import { NextRequest, NextResponse } from "next/server";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { createHash, timingSafeEqual } from "node:crypto";
import { getR2Client, getR2Config } from "../../../../lib/r2-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_KEY =
  "connection-tests/7bb042a8-7984-474a-9165-9a603061cd1d.mp4";

export async function POST(req: NextRequest) {
  const secret = process.env.R2_TRANSFER_SECRET;

  const supplied = req.headers.get("x-r2-transfer-secret") || "";

  if (!secret || !supplied) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expectedHash = createHash("sha256").update(secret).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();

  if (!timingSafeEqual(expectedHash, suppliedHash)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = getR2Client();
    const config = getR2Config();

    const object = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: TEST_KEY,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Vercel connected to private Cloudflare R2",
      bytes: object.ContentLength,
    });
  } catch (error) {
    console.error("R2 CONNECTION TEST FAILED:", error);

    return NextResponse.json(
      { success: false, error: "R2 connection test failed" },
      { status: 502 }
    );
  }
}

