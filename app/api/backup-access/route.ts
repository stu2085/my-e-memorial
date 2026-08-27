import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function signaturesMatch(
  suppliedSignature: string,
  expectedSignature: string
) {
  const suppliedBuffer = Buffer.from(
    suppliedSignature,
    "utf8"
  );

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    suppliedBuffer,
    expectedBuffer
  );
}

export async function GET(req: NextRequest) {
  const memorialIdValue =
    req.nextUrl.searchParams.get("memorialId");

  const memorialId = Number(memorialIdValue);

  if (
    !Number.isFinite(memorialId) ||
    memorialId <= 0
  ) {
    return NextResponse.json(
      {
        valid: false,
        error: "Missing or invalid memorial ID.",
      },
      { status: 400 }
    );
  }

  const cookieValue = req.cookies.get(
    "myememorial_backup_access"
  )?.value;

  if (!cookieValue) {
    return NextResponse.json({ valid: false });
  }

  const cookieParts = cookieValue.split(":");

  /*
   * #14 final cookie format:
   * memorialId:issuedAt:backupRole:hardenedSignature
   */
  if (cookieParts.length !== 4) {
    return NextResponse.json({ valid: false });
  }

  const cookieMemorialId = cookieParts[0];
  const issuedAtValue = cookieParts[1];
  const cookieBackupRole = cookieParts[2];
  const suppliedHardenedSignature =
    cookieParts[3];

  if (
    !cookieMemorialId ||
    !issuedAtValue ||
    (cookieBackupRole !== "primary" &&
      cookieBackupRole !== "secondary") ||
    !suppliedHardenedSignature ||
    cookieMemorialId !== String(memorialId)
  ) {
    return NextResponse.json({ valid: false });
  }

  const issuedAt = Number(issuedAtValue);

  if (
    !Number.isFinite(issuedAt) ||
    issuedAt <= 0
  ) {
    return NextResponse.json({ valid: false });
  }

  const now = Date.now();
  const maxBackupAccessAge =
    60 * 60 * 1000;

  if (
    issuedAt > now ||
    now - issuedAt > maxBackupAccessAge
  ) {
    return NextResponse.json({ valid: false });
  }

  const backupAccessSecret =
    process.env.BACKUP_ACCESS_SECRET || "";

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

  /*
   * Load the currently configured Backup Person
   * identity for this memorial.
   *
   * Before Secondary failover:
   *   Primary is the active identity.
   *
   * After Secondary failover:
   *   Secondary is the active identity.
   */
  const {
    data: memorial,
    error: memorialError,
  } = await supabaseAdmin
    .from("memorials")
    .select(
      "id, is_living_preplan, backup_email, backup_password, plan, payment_status"
    )
    .eq("id", memorialId)
    .maybeSingle();

  if (memorialError) {
    console.error(
      "BACKUP ACCESS MEMORIAL LOOKUP ERROR:",
      memorialError
    );

    return NextResponse.json(
      {
        valid: false,
        error:
          "Backup access could not be verified.",
      },
      { status: 500 }
    );
  }

  if (!memorial) {
    return NextResponse.json({
      valid: false,
    });
  }

  /*
   * A Living MyEMemorial changes is_living_preplan to false
   * when it is published after death. Backup authority must
   * survive that conversion.
   *
   * For a non-living memorial, continue Backup Person access
   * only when the Living MyEMemorial death was independently
   * verified AND post-death access was explicitly unlocked.
   * This prevents this route from granting Backup Person access
   * to an unrelated ordinary memorial merely because it has
   * backup credential fields.
   */
  if (memorial.is_living_preplan !== true) {
    const {
      data: legacyAccess,
      error: legacyAccessError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .select(
        "death_verified_at, post_death_access_unlocked_at"
      )
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (legacyAccessError) {
      console.error(
        "BACKUP ACCESS POST-DEATH LOOKUP ERROR:",
        legacyAccessError
      );

      return NextResponse.json(
        {
          valid: false,
          error:
            "Backup access could not be verified.",
        },
        { status: 500 }
      );
    }

    const verifiedPostDeathPersonal =
      Boolean(legacyAccess?.death_verified_at) &&
      Boolean(
        legacyAccess?.post_death_access_unlocked_at
      );

    if (!verifiedPostDeathPersonal) {
      return NextResponse.json({
        valid: false,
      });
    }
  }

  const hasEligiblePaidPlan =
    memorial.plan === "basic" ||
    memorial.plan === "plus" ||
    memorial.plan === "premium";

  const hasEligiblePaymentStatus =
    memorial.payment_status === "paid" ||
    memorial.payment_status === "free_beta";

  if (
    !hasEligiblePaidPlan ||
    !hasEligiblePaymentStatus
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  const {
    data: backupSettings,
    error: backupSettingsError,
  } = await supabaseAdmin
    .from("memorial_backup_settings")
    .select(
      "secondary_backup_email, secondary_backup_password, secondary_backup_activated_at, primary_backup_authority_version, primary_backup_revoked_at, secondary_backup_authority_version, secondary_backup_revoked_at"
    )
    .eq("memorial_id", memorialId)
    .maybeSingle();

  if (backupSettingsError) {
    console.error(
      "BACKUP ACCESS SETTINGS LOOKUP ERROR:",
      backupSettingsError
    );

    return NextResponse.json(
      {
        valid: false,
        error:
          "Backup access could not be verified.",
      },
      { status: 500 }
    );
  }

  const secondaryActivatedAt =
    backupSettings
      ?.secondary_backup_activated_at || null;

  const secondaryIsActive =
    Boolean(secondaryActivatedAt);

  const activeBackupRole:
    | "primary"
    | "secondary" =
    secondaryIsActive
      ? "secondary"
      : "primary";

  /*
   * #18 Backup Person authority state.
   *
   * Revocation is authoritative. An active revoked role must
   * not fall back automatically to the other Backup Person.
   */
  const activeRevokedAt = secondaryIsActive
    ? backupSettings?.secondary_backup_revoked_at || null
    : backupSettings?.primary_backup_revoked_at || null;

  const activeAuthorityVersion = Number(
    secondaryIsActive
      ? backupSettings?.secondary_backup_authority_version ?? 1
      : backupSettings?.primary_backup_authority_version ?? 1
  );

  if (
    activeRevokedAt ||
    !Number.isSafeInteger(activeAuthorityVersion) ||
    activeAuthorityVersion < 1
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  const activeEmail = (
    secondaryIsActive
      ? String(
          backupSettings
            ?.secondary_backup_email || ""
        )
      : String(memorial.backup_email || "")
  )
    .trim()
    .toLowerCase();

  const activeStoredPassword =
    secondaryIsActive
      ? String(
          backupSettings
            ?.secondary_backup_password || ""
        )
      : String(
          memorial.backup_password || ""
        );

  if (
    !activeEmail ||
    !activeStoredPassword
  ) {
    return NextResponse.json({
      valid: false,
    });
  }

  /*
   * Hardened session signature.
   *
   * The hardened signature is bound to:
   * - memorial
   * - issue time
   * - active Backup Person role
   * - active Backup Person email
   * - current stored password value/hash
   * - current Backup Person authority version
   *
   * Therefore role failover, identity change,
   * password change, authority replacement, or
   * revocation invalidates the hardened session
   * automatically.
   */
  const hardenedSignature = createHmac(
    "sha256",
    backupAccessSecret
  )
    .update(
      `${memorialId}:${issuedAt}:${activeBackupRole}:${activeEmail}:${activeStoredPassword}:${activeAuthorityVersion}`
    )
    .digest("hex");

  const valid =
    cookieBackupRole === activeBackupRole &&
    signaturesMatch(
      suppliedHardenedSignature,
      hardenedSignature
    );

  return NextResponse.json({
    valid,
    memorialId: valid ? memorialId : null,
    backupRole:
      valid ? activeBackupRole : null,
    sessionIssuedAt:
      valid ? issuedAt : null,
  });
}
