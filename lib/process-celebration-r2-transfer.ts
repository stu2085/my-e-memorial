import "server-only";

import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getR2Client, getR2Config } from "./r2-storage";
import { transferVideoPart, VIDEO_TRANSFER_PART_BYTES } from "./r2-video-transfer-part";

type TransferPart = { partNumber: number; etag: string };

type Transfer = {
  presentation_public_id: string;
  render_job_id: string;
  content_hash: string;
  storage_key: string;
  expected_bytes: number | null;
  upload_id: string | null;
  completed_parts: TransferPart[];
  lease_token: string;
  consecutive_failures: number;
};

async function getCompletedVideoUrl(jobId: string) {
  const key = process.env.RENDERLY_API_KEY?.trim();
  if (!key) throw new Error("Renderly is not configured.");

  const response = await fetch(
    `https://renderly.video/api/v1/renders/${encodeURIComponent(jobId)}`,
    {
      headers: { Authorization: `Bearer ${key}` },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }
  );

  if (!response.ok) throw new Error(`Renderly status HTTP ${response.status}.`);
  const { data } = await response.json();
  if (typeof data?.status !== "string" || !data.status) {
    throw new Error("Renderly did not report a job status.");
  }
  if (data.status !== "COMPLETED" && data.status !== "FAILED") {
    return null;
  }
  if (data?.status !== "COMPLETED" || typeof data.outputUrl !== "string") {
    throw new Error("Renderly has no completed video for this job.");
  }

  const url = new URL(data.outputUrl);
  if (url.protocol !== "https:") throw new Error("Expected an HTTPS video URL.");
  return url;
}

async function getVideoSize(url: URL) {
  const response = await fetch(url, {
    headers: { Range: "bytes=0-0" },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const match = /^bytes 0-0\/(\d+)$/.exec(response.headers.get("content-range") ?? "");
  await response.body?.cancel();

  const bytes = Number(match?.[1]);
  if (
    response.status !== 206 ||
    !Number.isSafeInteger(bytes) ||
    bytes < 1024 ||
    Math.ceil(bytes / VIDEO_TRANSFER_PART_BYTES) > 10_000
  ) {
    throw new Error("Renderly did not report a supported MP4 size.");
  }
  return bytes;
}

export async function processCelebrationR2Transfer(db: SupabaseClient) {
  const startedAt = Date.now();
  const claim = await db.rpc("claim_celebration_r2_transfer");
  if (claim.error) throw new Error("Could not claim an R2 transfer.");

  const transfer = claim.data?.[0] as Transfer | undefined;
  if (!transfer) return { status: "idle" };

  async function checkpoint(changes: Record<string, unknown>, releaseLease = true) {
    const result = await db
      .from("celebration_r2_transfers")
      .update({
        ...changes,
        ...(releaseLease ? { lease_token: null, lease_expires_at: null } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("presentation_public_id", transfer!.presentation_public_id)
      .eq("render_job_id", transfer!.render_job_id)
      .eq("lease_token", transfer!.lease_token)
      .gt("lease_expires_at", new Date().toISOString())
      .select("render_job_id")
      .maybeSingle();

    if (result.error || !result.data) throw new Error("Could not save the transfer checkpoint.");
  }

  const { render_job_id: jobId, storage_key: key } = transfer;
  let consecutiveFailures = transfer.consecutive_failures;

  try {
    const { bucket } = getR2Config();
    const client = getR2Client();
    const object = { Bucket: bucket, Key: key };
    const expectedBytes = transfer.expected_bytes;

    if (!expectedBytes || !transfer.upload_id) {
      const url = await getCompletedVideoUrl(jobId);
      if (!url) {
        await checkpoint({
          next_attempt_at: new Date(Date.now() + 60_000).toISOString(),
          consecutive_failures: 0,
          last_error: null,
        });
        return { status: "waiting_for_render" };
      }
      const bytes = await getVideoSize(url);
      const upload = await client.send(
        new CreateMultipartUploadCommand({ ...object, ContentType: "video/mp4" }),
        { abortSignal: AbortSignal.timeout(15_000) }
      );
      if (!upload.UploadId) throw new Error("R2 did not return an upload ID.");

      await checkpoint({
        expected_bytes: bytes,
        upload_id: upload.UploadId,
        completed_parts: [],
        consecutive_failures: 0,
        last_error: null,
      });
      return { status: "started" };
    }

    const totalParts = Math.ceil(expectedBytes / VIDEO_TRANSFER_PART_BYTES);
    const parts = transfer.completed_parts;

    if (parts.length < totalParts) {
      const url = await getCompletedVideoUrl(jobId);
      if (!url) {
        await checkpoint({
          next_attempt_at: new Date(Date.now() + 60_000).toISOString(),
          consecutive_failures: 0,
          last_error: null,
        });
        return { status: "waiting_for_render" };
      }
      const completedParts = [...parts];
      const maxPartsPerRun = 8;

      for (let uploaded = 1; ; uploaded++) {
        const part = await transferVideoPart({
          outputUrl: url.toString(),
          storageKey: key,
          uploadId: transfer.upload_id,
          partNumber: completedParts.length + 1,
          totalBytes: expectedBytes,
        });
        completedParts.push(part);

        // Allow up to 60 seconds for another part and leave time to checkpoint.
        const canContinue =
          uploaded < maxPartsPerRun &&
          completedParts.length < totalParts &&
          Date.now() - startedAt < 25_000;

        await checkpoint(
          {
            completed_parts: completedParts,
            consecutive_failures: 0,
            last_error: null,
          },
          !canContinue
        );
        consecutiveFailures = 0;

        if (!canContinue) {
          return { status: "part_uploaded", part: part.partNumber, totalParts };
        }
      }
    }

    async function storedSize() {
      try {
        const head = await client.send(
          new HeadObjectCommand(object),
          { abortSignal: AbortSignal.timeout(15_000) }
        );
        return head.ContentLength;
      } catch (error) {
        if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
          return undefined;
        }
        throw error;
      }
    }

    let bytes = await storedSize();
    if (bytes === undefined) {
      await client.send(
        new CompleteMultipartUploadCommand({
          ...object,
          UploadId: transfer.upload_id,
          MultipartUpload: {
            Parts: parts.map(({ partNumber, etag }) => ({
              PartNumber: partNumber,
              ETag: etag,
            })),
          },
        }),
        { abortSignal: AbortSignal.timeout(30_000) }
      );
      bytes = await storedSize();
    }

    if (bytes !== expectedBytes) throw new Error("R2 file size did not match.");
    await checkpoint({ status: "stored", consecutive_failures: 0, last_error: null });
    return { status: "stored", bytes };
  } catch (error) {
    const failures = consecutiveFailures + 1;
    await checkpoint({
      status: failures >= 5 ? "failed" : "uploading",
      consecutive_failures: failures,
      next_attempt_at: new Date(Date.now() + Math.min(30, 2 ** failures) * 60_000).toISOString(),
      last_error: "R2 transfer step failed.",
    });
    console.error("Celebration R2 transfer step failed", {
      jobId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: failures >= 5 ? "failed" : "retry_scheduled" };
  }
}
