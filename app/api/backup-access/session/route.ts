import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";

export async function GET(
  req: NextRequest
) {
  const cookieValue = req.cookies.get(
    "myememorial_backup_access"
  )?.value;

  if (!cookieValue) {
    return NextResponse.json({
      valid: false,
    });
  }

  const [
    memorialIdValue,
    issuedAtValue,
    suppliedSignature,
  ] = cookieValue.split(":");

  if (
    !memorialIdValue ||
    !issuedAtValue ||
    !suppliedSignature
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  const memorialId =
    Number(memorialIdValue);

  const issuedAt =
    Number(issuedAtValue);

  if (
    !Number.isFinite(memorialId) ||
    memorialId <= 0 ||
    !Number.isFinite(issuedAt) ||
    issuedAt <= 0
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  /*
   * Backup Person sessions expire after one hour.
   */
  const now = Date.now();
  const maxBackupAccessAge =
    60 * 60 * 1000;

  if (
    issuedAt > now ||
    now - issuedAt >
      maxBackupAccessAge
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  const backupAccessSecret =
    process.env
      .BACKUP_ACCESS_SECRET || "";

  if (!backupAccessSecret) {
    return NextResponse.json(
      {
        valid: false,
        error:
          "Backup access is not configured.",
      },
      { status: 500 }
    );
  }

  const expectedSignature =
    createHmac(
      "sha256",
      backupAccessSecret
    )
      .update(
        `${memorialId}:${issuedAt}`
      )
      .digest("hex");

  const suppliedBuffer =
    Buffer.from(
      suppliedSignature,
      "utf8"
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  const valid =
    timingSafeEqual(
      suppliedBuffer,
      expectedBuffer
    );

  return NextResponse.json({
    valid,
  });
}