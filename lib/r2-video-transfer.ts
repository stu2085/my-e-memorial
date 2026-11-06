import "server-only";

import { Readable } from "node:stream";
import { uploadVideoToR2 } from "./r2-video-upload";

export async function transferRenderlyVideoToR2(options: {
  outputUrl: string;
  storageKey: string;
}) {
  const { outputUrl, storageKey } = options;

  const url = new URL(outputUrl);

  if (url.protocol !== "https:") {
    throw new Error("Video transfer requires HTTPS.");
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Renderly MP4 download failed: HTTP ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType &&
    !contentType.includes("video/") &&
    !contentType.includes("application/octet-stream")
  ) {
    throw new Error("Unexpected video response type.");
  }

  const sizeHeader = response.headers.get("content-length");
  const expectedBytes = sizeHeader
    ? Number(sizeHeader)
    : undefined;

  if (
    expectedBytes !== undefined &&
    (!Number.isSafeInteger(expectedBytes) || expectedBytes < 1024)
  ) {
    throw new Error("Invalid video content length.");
  }

  const stream = Readable.fromWeb(
    response.body as Parameters<typeof Readable.fromWeb>[0]
  );

  return uploadVideoToR2({
    key: storageKey,
    body: stream,
    expectedBytes,
  });
}
