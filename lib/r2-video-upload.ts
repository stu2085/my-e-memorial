import "server-only";

import { Readable } from "node:stream";
import {
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2Config } from "./r2-storage";

const PART_SIZE = 8 * 1024 * 1024;

function validateVideoKey(key: string) {
  if (
    !key ||
    !key.endsWith(".mp4") ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\\")
  ) {
    throw new Error("Invalid R2 video storage key.");
  }
}

export async function uploadVideoToR2(options: {
  key: string;
  body: Readable;
  expectedBytes?: number;
}) {
  const { key, body, expectedBytes } = options;
  validateVideoKey(key);

  const client = getR2Client();
  const { bucket } = getR2Config();

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "video/mp4",
    },
    queueSize: 2,
    partSize: PART_SIZE,
    leavePartsOnError: false,
  });

  await upload.done();

  const stored = await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const bytes = stored.ContentLength;

  if (
    typeof bytes !== "number" ||
    bytes < 1024 ||
    (expectedBytes !== undefined && bytes !== expectedBytes)
  ) {
    throw new Error("R2 video size verification failed.");
  }

  return { key, bytes };
}

export async function getPrivateVideoDownloadUrl(
  key: string,
  options?: { inline: boolean; expiresIn: number }
) {
  validateVideoKey(key);

  const client = getR2Client();
  const { bucket } = getR2Config();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: options?.inline
        ? "inline"
        : 'attachment; filename="Celebration of Life.mp4"',
    }),
    { expiresIn: options?.expiresIn ?? 900 }
  );
}
