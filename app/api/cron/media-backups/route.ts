import { createHash, timingSafeEqual } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxPhotoBytes = 20 * 1024 * 1024;
const maxBatchPhotos = 5;

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function matchesSecret(authorization: string, secret: string | undefined) {
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const supplied = Buffer.from(authorization);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function GET(request: Request) {
  return runBackup(request, false);
}

export async function POST(request: Request) {
  return runBackup(request, true);
}

async function runBackup(request: Request, batch: boolean) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!matchesSecret(authorization, process.env.CRON_SECRET?.trim()) &&
      !matchesSecret(authorization, process.env.MEDIA_BACKUP_TEST_SECRET?.trim())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceBucket = process.env.MEDIA_BACKUP_TEST_SOURCE_BUCKET?.trim();
  const sourcePath = process.env.MEDIA_BACKUP_TEST_SOURCE_PATH?.trim();
  if (!sourceBucket || !sourcePath) {
    return NextResponse.json({ enabled: false });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accountId = process.env.R2_BACKUP_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BACKUP_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_BACKUP_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_BACKUP_SECRET_ACCESS_KEY?.trim();
  if (!url || !serviceKey || !accountId || bucket !== "myememorial-media-backups" ||
      !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "Backup configuration missing or invalid" }, { status: 503 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  let stage = "download_source";
  const storage = supabase.storage.from(sourceBucket);

  async function copyPhoto(path: string) {
    stage = "download_source";
    const { data, error } = await storage.download(path);
    if (error || !data) throw new Error("Source download failed");
    if (!data.type.startsWith("image/") || data.size === 0 || data.size > maxPhotoBytes) {
      return null;
    }

    const body = Buffer.from(await data.arrayBuffer());
    const checksum = sha256(body);
    const sourceId = sha256(Buffer.from(JSON.stringify([sourceBucket, path])));
    const key = `test/${sourceId}/${checksum}`;
    stage = "upload_backup";
    await r2.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: data.type,
      Metadata: { sha256: checksum },
    }));

    stage = "verify_backup";
    const backup = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const restoredBytes = await backup.Body?.transformToByteArray();
    if (!restoredBytes || restoredBytes.byteLength !== body.byteLength ||
        sha256(restoredBytes) !== checksum || backup.ContentType !== data.type) {
      throw new Error("Backup verification failed");
    }

    return { verified: true, key, bytes: body.byteLength, sha256: checksum };
  }

  try {
    if (!batch) {
      const result = await copyPhoto(sourcePath);
      return result
        ? NextResponse.json(result)
        : NextResponse.json({ error: "Select a nonempty photo up to 20 MiB" }, { status: 422 });
    }

    const folderEnd = sourcePath.lastIndexOf("/");
    if (folderEnd < 1) {
      return NextResponse.json({ error: "Configure a photo inside a test folder" }, { status: 422 });
    }

    const folder = sourcePath.slice(0, folderEnd);
    stage = "list_test_folder";
    const { data, error } = await storage.list(folder, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !data) throw new Error("Folder listing failed");

    const candidates = data.filter((item) =>
      item.id && item.metadata?.mimetype?.startsWith("image/") &&
      Number(item.metadata.size) > 0 && Number(item.metadata.size) <= maxPhotoBytes,
    ).slice(0, maxBatchPhotos);
    if (candidates.length < 2) {
      return NextResponse.json({ error: "The test folder needs at least two eligible photos" }, { status: 422 });
    }

    const verified = [];
    const failed: { path: string; stage: string }[] = [];
    for (const candidate of candidates) {
      const path = `${folder}/${candidate.name}`;
      try {
        const result = await copyPhoto(path);
        if (!result) throw new Error("Photo no longer eligible");
        verified.push({ path, ...result });
      } catch {
        failed.push({ path, stage });
      }
    }

    if (failed.length) console.error("Media backup batch test had failures", { count: failed.length });
    return NextResponse.json({
      passed: failed.length === 0,
      attempted: candidates.length,
      verified,
      failed,
    }, { status: failed.length ? 502 : 200 });
  } catch {
    console.error("Media backup test failed", { stage });
    return NextResponse.json({ error: "Media backup test failed", stage }, { status: 502 });
  } finally {
    r2.destroy();
  }
}
