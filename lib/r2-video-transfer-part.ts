import "server-only";

import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2Config } from "./r2-storage";

export const VIDEO_TRANSFER_PART_BYTES = 8 * 1024 * 1024;

export async function transferVideoPart({
  outputUrl,
  storageKey,
  uploadId,
  partNumber,
  totalBytes,
}: {
  outputUrl: string;
  storageKey: string;
  uploadId: string;
  partNumber: number;
  totalBytes: number;
}) {
  if (!Number.isSafeInteger(totalBytes) || totalBytes < 1024) {
    throw new Error("Invalid video size.");
  }

  const partCount = Math.ceil(totalBytes / VIDEO_TRANSFER_PART_BYTES);
  if (
    !Number.isInteger(partNumber) ||
    partNumber < 1 ||
    partNumber > partCount ||
    partCount > 10_000
  ) {
    throw new Error("Invalid multipart transfer size or part number.");
  }

  const source = new URL(outputUrl);
  if (source.protocol !== "https:") {
    throw new Error("Video transfer requires HTTPS.");
  }

  const start = (partNumber - 1) * VIDEO_TRANSFER_PART_BYTES;
  const end = Math.min(totalBytes - 1, start + VIDEO_TRANSFER_PART_BYTES - 1);
  const expectedLength = end - start + 1;
  const response = await fetch(source, {
    headers: { Range: `bytes=${start}-${end}` },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (
    response.status !== 206 ||
    response.headers.get("content-range") !== `bytes ${start}-${end}/${totalBytes}`
  ) {
    await response.body?.cancel();
    throw new Error(`Renderly returned an unexpected range (HTTP ${response.status}).`);
  }

  const body = new Uint8Array(await response.arrayBuffer());
  if (body.byteLength !== expectedLength) {
    throw new Error("Renderly returned an incomplete video part.");
  }

  const { bucket } = getR2Config();
  const result = await getR2Client().send(
    new UploadPartCommand({
      Bucket: bucket,
      Key: storageKey,
      UploadId: uploadId,
      PartNumber: partNumber,
      ContentLength: expectedLength,
      Body: body,
    }),
    { abortSignal: AbortSignal.timeout(30_000) }
  );

  if (!result.ETag) {
    throw new Error("R2 did not return a part ETag.");
  }

  return { partNumber, etag: result.ETag };
}
