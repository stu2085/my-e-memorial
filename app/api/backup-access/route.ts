import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export async function GET(req: NextRequest) {
  const memorialId = req.nextUrl.searchParams.get("memorialId");

  if (!memorialId) {
    return NextResponse.json(
      { valid: false, error: "Missing memorial ID." },
      { status: 400 }
    );
  }

  const cookieValue = req.cookies.get(
    "myememorial_backup_access"
  )?.value;

  if (!cookieValue) {
    return NextResponse.json({ valid: false });
  }

  const [cookieMemorialId, suppliedSignature] =
    cookieValue.split(":");

  if (
    !cookieMemorialId ||
    !suppliedSignature ||
    cookieMemorialId !== memorialId
  ) {
    return NextResponse.json({ valid: false });
  }

  const backupAccessSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!backupAccessSecret) {
    return NextResponse.json(
      { valid: false, error: "Backup access is not configured." },
      { status: 500 }
    );
  }

  const expectedSignature = createHmac(
    "sha256",
    backupAccessSecret
  )
    .update(String(memorialId))
    .digest("hex");

  const suppliedBuffer = Buffer.from(
    suppliedSignature,
    "utf8"
  );

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return NextResponse.json({ valid: false });
  }

  const valid = timingSafeEqual(
    suppliedBuffer,
    expectedBuffer
  );

  return NextResponse.json({
    valid,
    memorialId: valid ? Number(memorialId) : null,
  });
}