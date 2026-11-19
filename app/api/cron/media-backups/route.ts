import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { transporter } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const maxPhotoBytes = 20 * 1024 * 1024;
const maxBatchPhotos = 5;
const maxBulkFiles = 5;
const backupBuckets = new Set([
  "campaign-media", "memorial-articles", "memorial-audio", "memorial-media", "memorial-photos",
]);

type BackupFile = { bucket: string; path: string; bytes: number };

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const { bucket, path, bytes } = value as Partial<BackupFile>;
  return typeof bucket === "string" && backupBuckets.has(bucket) &&
    typeof path === "string" && Buffer.byteLength(path) <= 1024 &&
    !/[\x00-\x1f\x7f\\]/.test(path) &&
    path.split("/").every((segment) => segment && segment !== "." && segment !== "..") &&
    typeof bytes === "number" && Number.isSafeInteger(bytes) &&
    bytes >= 0 && bytes <= maxPhotoBytes;
}

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
  const scheduled = new URL(request.url).searchParams.get("scheduled") === "1";
  return runBackup(request, scheduled ? "scheduled" : "photo");
}

export async function POST(request: Request) {
  return runBackup(request, "test-batch");
}

export async function PUT(request: Request) {
  return runBackup(request, "inventory");
}

async function runBackup(request: Request, mode: "photo" | "test-batch" | "inventory" | "scheduled") {
  const authorization = request.headers.get("authorization") ?? "";
  if (!matchesSecret(authorization, process.env.CRON_SECRET?.trim()) &&
      (mode === "scheduled" || !matchesSecret(authorization, process.env.MEDIA_BACKUP_TEST_SECRET?.trim()))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scheduled = mode === "scheduled";
  const permanent = scheduled || mode === "inventory";
  const alertEmail = process.env.MEDIA_BACKUP_ALERT_EMAIL?.trim();
  if (scheduled && (process.env.VERCEL_ENV !== "production" ||
      process.env.MEDIA_BACKUP_SCHEDULED_ENABLED !== "true")) {
    return NextResponse.json({ enabled: false });
  }
  if (scheduled && (!alertEmail || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD)) {
    return NextResponse.json({ error: "Scheduled backup alert configuration missing" }, { status: 503 });
  }

  let inventory: BackupFile[] = [];
  if (mode === "inventory") {
    const payload: unknown = await request.json().catch(() => null);
    if (!Array.isArray(payload) || payload.length < 1 || payload.length > maxBulkFiles ||
        !payload.every(isBackupFile)) {
      return NextResponse.json({ error: "Send one to five valid inventory entries" }, { status: 422 });
    }
    inventory = payload;
  }

  const sourceBucket = process.env.MEDIA_BACKUP_TEST_SOURCE_BUCKET?.trim();
  const sourcePath = process.env.MEDIA_BACKUP_TEST_SOURCE_PATH?.trim();
  if (!permanent && (!sourceBucket || !sourcePath)) {
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
  async function copyFile(sourceBucket: string, path: string, expectedBytes?: number) {
    stage = "download_source";
    const { data, error } = await supabase.storage.from(sourceBucket).download(path);
    if (error || !data) throw new Error("Source download failed");
    if (expectedBytes !== undefined && data.size !== expectedBytes) {
      stage = "source_size_changed";
      throw new Error("Source size differs from inventory");
    }
    if (data.size > maxPhotoBytes ||
        (expectedBytes === undefined && (!data.type.startsWith("image/") || data.size === 0))) {
      return null;
    }

    const body = Buffer.from(await data.arrayBuffer());
    const checksum = sha256(body);
    const sourceId = sha256(Buffer.from(JSON.stringify([sourceBucket, path])));
    const contentType = data.type || "application/octet-stream";
    const typeId = sha256(Buffer.from(contentType));
    const key = permanent
      ? `files/${sourceBucket}/${sourceId}/${checksum}/${typeId}`
      : `test/${sourceId}/${checksum}`;
    stage = "upload_backup";
    await r2.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: { sha256: checksum },
    }));

    stage = "verify_backup";
    const backup = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const restoredBytes = await backup.Body?.transformToByteArray();
    if (!restoredBytes || restoredBytes.byteLength !== body.byteLength ||
        sha256(restoredBytes) !== checksum || backup.ContentType !== contentType) {
      throw new Error("Backup verification failed");
    }

    const result = { verified: true, key, bytes: body.byteLength, sha256: checksum };
    if (permanent) {
      stage = "write_restore_record";
      await r2.send(new PutObjectCommand({
        Bucket: bucket,
        Key: `${key}.json`,
        Body: JSON.stringify({ bucket: sourceBucket, path, contentType, ...result }),
        ContentType: "application/json",
      }));
    }
    return result;
  }

  try {
    if (scheduled) {
      stage = "claim_scheduled_files";
      const lease = randomUUID();
      const { data, error } = await supabase.rpc("claim_scheduled_media_backups", { p_lease: lease });
      if (error || !Array.isArray(data)) throw new Error("Could not claim scheduled media");

      let verified = 0;
      let failed = 0;
      for (const file of data as (BackupFile & {
        object_id: string; revision: string; failures: number; alerted_at: string | null;
      })[]) {
        let backupKey: string | null = null;
        let failedStage: string | null = null;
        try {
          stage = "validate_source";
          if (!isBackupFile(file)) throw new Error("Invalid scheduled file");
          const result = await copyFile(file.bucket, file.path, file.bytes);
          if (!result) throw new Error("File exceeds backup limit");
          backupKey = result.key;
          verified += 1;
        } catch {
          failed += 1;
          failedStage = stage;
          console.error("Scheduled media backup item failed", { bucket: file.bucket, stage });
        }

        const failures = failedStage ? file.failures + 1 : 0;
        const now = new Date();
        stage = "save_scheduled_progress";
        const { data: saved, error: saveError } = await supabase.from("media_backup_progress")
          .update({
            backup_key: backupKey,
            verified_at: backupKey ? now.toISOString() : null,
            next_attempt_at: new Date(now.getTime() + Math.min(60, 5 * failures) * 60_000).toISOString(),
            failures,
            last_stage: failedStage,
          })
          .eq("object_id", file.object_id).eq("revision", file.revision).eq("lease_token", lease)
          .select("object_id").maybeSingle();
        if (saveError || !saved) throw new Error("Could not save scheduled progress");

        if (failures >= 3 && !file.alerted_at) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: alertEmail,
              subject: "MyEMemorial media backup needs attention",
              text: `A file failed backup ${failures} times.\nBucket: ${file.bucket}\nPath: ${file.path}\nStage: ${failedStage}\nThe job will retry automatically.`,
            });
            const { error: alertError } = await supabase.from("media_backup_progress")
              .update({ alerted_at: new Date().toISOString() })
              .eq("object_id", file.object_id).eq("revision", file.revision).eq("lease_token", lease);
            if (alertError) throw alertError;
          } catch {
            console.error("Scheduled media backup alert failed", { bucket: file.bucket });
          }
        }
      }
      return NextResponse.json({ enabled: true, attempted: data.length, verified, failed },
        { status: failed ? 502 : 200 });
    }

    if (mode === "inventory") {
      const results = [];
      for (const entry of inventory) {
        try {
          const result = await copyFile(entry.bucket, entry.path, entry.bytes);
          if (!result) throw new Error("File exceeds backup limit");
          results.push({ ...entry, ...result });
        } catch {
          console.error("Media backup inventory item failed", { bucket: entry.bucket, stage });
          results.push({ ...entry, verified: false, stage });
        }
      }
      return NextResponse.json({ results });
    }

    if (!sourceBucket || !sourcePath) return NextResponse.json({ enabled: false });
    if (mode === "photo") {
      const result = await copyFile(sourceBucket, sourcePath);
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
    const { data, error } = await supabase.storage.from(sourceBucket).list(folder, {
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
        const result = await copyFile(sourceBucket, path);
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
