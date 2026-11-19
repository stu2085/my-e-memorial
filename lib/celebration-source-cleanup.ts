import "server-only";

import { createHash } from "node:crypto";
import { DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import Mux from "@mux/mux-node";
import type { SupabaseClient } from "@supabase/supabase-js";

type Upload = { bucket: string; path: string; source_exists: boolean };

async function rejectShared(db: SupabaseClient, id: number, needles: string[]) {
  const { data, error } = await db.rpc("celebration_cleanup_has_references", {
    p_id: id, p_needles: [...new Set(needles.filter(Boolean))],
  });
  if (error || data !== false) throw new Error("Shared references require review");
}

function backupClient() {
  const account = process.env.R2_BACKUP_ACCOUNT_ID;
  const accessKeyId = process.env.R2_BACKUP_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_BACKUP_SECRET_ACCESS_KEY;
  if (!account || !accessKeyId || !secretAccessKey ||
      process.env.R2_BACKUP_BUCKET_NAME !== "myememorial-media-backups") {
    throw new Error("Unexpected media backup configuration");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

async function deleteBackupCopies(r2: S3Client, upload: Upload) {
  const hash = createHash("sha256").update(JSON.stringify([upload.bucket, upload.path])).digest("hex");
  for (const prefix of [`files/${upload.bucket}/${hash}/`, `test/${hash}/`]) {
    const request = new ListObjectsV2Command({
      Bucket: "myememorial-media-backups", Prefix: prefix, MaxKeys: 51,
    });
    const listed = await r2.send(request);
    const keys = (listed.Contents ?? []).map(({ Key }) => Key ?? "");
    const suffix = prefix.startsWith("test/")
      ? /^[a-f0-9]{64}$/ : /^[a-f0-9]{64}\/[a-f0-9]{64}(?:\.json)?$/;
    if (listed.IsTruncated || keys.length > 50 ||
        keys.some((key) => !key.startsWith(prefix) || !suffix.test(key.slice(prefix.length)))) {
      throw new Error("Backup keys require review");
    }
    for (const key of keys) {
      await r2.send(new DeleteObjectCommand({ Bucket: "myememorial-media-backups", Key: key }));
    }
    if (keys.length) {
      const remaining = await r2.send(request);
      if (remaining.IsTruncated || remaining.Contents?.length) throw new Error("Backup objects remain");
    }
  }
}

export async function cleanCelebrationSources(
  db: SupabaseClient, id: number, publicId: string, recheck: () => Promise<void>,
) {
  const { data, error } = await db.rpc("list_celebration_cleanup_uploads", { p_public_id: publicId });
  if (error || !Array.isArray(data)) throw new Error("Source upload lookup failed");
  const uploads = data as Upload[];
  const prefix = `celebration-presentations/${publicId}/`;

  if (uploads.length) {
    if (uploads.some(({ bucket, path }) =>
      !["memorial-photos", "memorial-audio"].includes(bucket) || !path.startsWith(prefix) ||
      path.split("/").some((part) => !part || part === "." || part === ".."))) {
      throw new Error("Source upload ownership needs review");
    }
    const r2 = backupClient();
    try {
      for (const upload of uploads) {
        const filename = upload.path.split("/").at(-1)!;
        await rejectShared(db, id, [filename, encodeURIComponent(filename)]);
        await recheck();
        // Keep the source as the retry cursor until all its backup copies are removed.
        await deleteBackupCopies(r2, upload);
        if (upload.source_exists) {
          await recheck();
          const { error: removeError } = await db.storage.from(upload.bucket).remove([upload.path]);
          if (removeError) throw removeError;
        }
        const { error: catalogError } = await db.from("celebration_cleanup_backup_catalog")
          .update({ cleaned_at: new Date().toISOString() }).eq("bucket", upload.bucket).eq("path", upload.path);
        if (catalogError) throw catalogError;
      }
    } finally {
      r2.destroy();
    }
    return { uploadsRemoved: uploads.length, complete: false };
  }

  const { data: items, error: itemError } = await db.from("celebration_presentation_items")
    .select("mux_asset_id,mux_playback_id")
    .eq("presentation_id", id).not("mux_asset_id", "is", null).limit(101);
  if (itemError || !items || items.length > 100) throw new Error("Mux asset list requires review");
  if (!items.length) return { uploadsRemoved: 0, complete: true };
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) throw new Error("Mux not configured");
  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET,
    timeout: 5000, maxRetries: 1,
  });

  const notFound = (error: unknown) =>
    Boolean(error && typeof error === "object" && "status" in error && error.status === 404);
  for (const assetId of new Set(items.map(({ mux_asset_id }) => mux_asset_id as string))) {
    let asset;
    try {
      asset = await mux.video.assets.retrieve(assetId);
    } catch (error) {
      if (notFound(error)) continue;
      throw error;
    }
    if (asset.passthrough !== `celebration:${publicId}`) {
      throw new Error("Mux ownership needs review");
    }
    await rejectShared(db, id, [
      assetId, ...(asset.playback_ids ?? []).map(({ id }) => id),
      ...items.filter((item) => item.mux_asset_id === assetId).map((item) => item.mux_playback_id ?? ""),
    ]);
    await recheck();
    try {
      await mux.video.assets.delete(assetId);
    } catch (error) {
      if (!notFound(error)) throw error;
    }
  }
  return { uploadsRemoved: 0, complete: true };
}
