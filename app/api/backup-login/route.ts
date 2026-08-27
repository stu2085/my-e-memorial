import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashBackupPassword(password: string) {
  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(
    String(password || ""),
    salt,
    64
  ).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

function verifyBackupPassword(
  suppliedPassword: string,
  storedPassword: string
) {
  if (!storedPassword) {
    return false;
  }

  /*
   * New secure password format.
   */
  if (storedPassword.startsWith("scrypt$")) {
    const parts = storedPassword.split("$");

    if (parts.length !== 3) {
      return false;
    }

    const salt = parts[1];
    const storedHash = parts[2];

    if (!salt || !storedHash) {
      return false;
    }

    const suppliedHash = scryptSync(
      String(suppliedPassword || ""),
      salt,
      64
    ).toString("hex");

    const suppliedBuffer = Buffer.from(
      suppliedHash,
      "hex"
    );

    const storedBuffer = Buffer.from(
      storedHash,
      "hex"
    );

    if (suppliedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(
      suppliedBuffer,
      storedBuffer
    );
  }

  /*
   * Temporary compatibility for existing memorials
   * whose backup password was stored as plain text.
   */
  return (
    storedPassword ===
    String(suppliedPassword || "")
  );
}

export async function POST(req: Request) {
  try {
    const { memorialId, email, password } =
      await req.json();

    if (!memorialId || !email || !password) {
      return NextResponse.json(
        {
          error:
            "Missing backup login information.",
        },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
const attemptKey = `${ip}:${memorialId}`;
const now = new Date();

const { data: existingAttempt, error: attemptLookupError } =
  await supabaseAdmin
    .from("backup_login_attempts")
    .select("id, attempt_count, reset_at")
    .eq("attempt_key", attemptKey)
    .maybeSingle();

if (attemptLookupError) {
  console.error(
    "BACKUP LOGIN RATE LIMIT LOOKUP ERROR:",
    attemptLookupError
  );

  return NextResponse.json(
    {
      error:
        "Backup access could not be completed.",
    },
    { status: 500 }
  );
}

if (
  existingAttempt &&
  new Date(existingAttempt.reset_at) > now
) {
  if (Number(existingAttempt.attempt_count) >= 5) {
    return NextResponse.json(
      {
        error:
          "Too many backup login attempts. Please try again later.",
      },
      { status: 429 }
    );
  }

  const { error: attemptUpdateError } =
    await supabaseAdmin
      .from("backup_login_attempts")
      .update({
        attempt_count:
          Number(existingAttempt.attempt_count) + 1,
        updated_at: now.toISOString(),
      })
      .eq("id", existingAttempt.id);

  if (attemptUpdateError) {
    console.error(
      "BACKUP LOGIN RATE LIMIT UPDATE ERROR:",
      attemptUpdateError
    );

    return NextResponse.json(
      {
        error:
          "Backup access could not be completed.",
      },
      { status: 500 }
    );
  }
} else {
  const resetAt = new Date(
    now.getTime() + 15 * 60 * 1000
  );

  const { error: attemptUpsertError } =
    await supabaseAdmin
      .from("backup_login_attempts")
      .upsert(
        {
          attempt_key: attemptKey,
          attempt_count: 1,
          reset_at: resetAt.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          onConflict: "attempt_key",
        }
      );

  if (attemptUpsertError) {
    console.error(
      "BACKUP LOGIN RATE LIMIT UPSERT ERROR:",
      attemptUpsertError
    );

    return NextResponse.json(
      {
        error:
          "Backup access could not be completed.",
      },
      { status: 500 }
    );
  }
}

const { data: memorial, error } =
      await supabaseAdmin
        .from("memorials")
        .select(
          "id, backup_email, backup_password, is_living_preplan, plan, payment_status"
        )
        .eq("id", memorialId)
        .single();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    /*
     * A Living MyEMemorial changes is_living_preplan to false
     * when it is published after death. The active Backup Person
     * must still be able to sign back in after the one-hour
     * hardened session expires or after choosing End Backup Access.
     *
     * A non-living memorial qualifies here only if its Personal
     * MyEMemorial death was independently verified and post-death
     * access was explicitly unlocked.
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
        .eq("memorial_id", memorial.id)
        .maybeSingle();

      if (legacyAccessError) {
        console.error(
          "BACKUP LOGIN POST-DEATH LOOKUP ERROR:",
          legacyAccessError
        );

        return NextResponse.json(
          {
            error:
              "Backup access could not be completed.",
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
        return NextResponse.json(
          {
            error:
              "Backup access is not available for this memorial.",
          },
          { status: 403 }
        );
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
      return NextResponse.json(
        {
          error:
            "Backup access is not available for this memorial.",
        },
        { status: 403 }
      );
    }

    const {
      data: backupSettings,
      error: backupSettingsError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(
        "secondary_backup_email, secondary_backup_password, secondary_backup_activated_at, primary_backup_authority_version, primary_backup_revoked_at, secondary_backup_authority_version, secondary_backup_revoked_at"
      )
      .eq("memorial_id", memorial.id)
      .maybeSingle();

    if (backupSettingsError) {
      console.error(
        "BACKUP LOGIN SETTINGS LOOKUP ERROR:",
        backupSettingsError
      );

      return NextResponse.json(
        {
          error:
            "Backup access could not be completed.",
        },
        { status: 500 }
      );
    }

    const secondaryIsActive =
      Boolean(
        backupSettings?.secondary_backup_activated_at
      );

    const activeBackupRole:
      | "primary"
      | "secondary" =
      secondaryIsActive
        ? "secondary"
        : "primary";

    /*
     * #18 Backup Person authority state.
     *
     * Revocation never causes an automatic fallback to the
     * other Backup Person. The owner must explicitly establish
     * the next authorized Backup Person.
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
      return NextResponse.json(
        {
          error:
            "Backup access is not available for this memorial.",
        },
        { status: 403 }
      );
    }

    const activeEmail = secondaryIsActive
      ? String(
          backupSettings?.secondary_backup_email || ""
        )
      : String(memorial.backup_email || "");

    const storedPassword = secondaryIsActive
      ? String(
          backupSettings?.secondary_backup_password || ""
        )
      : String(memorial.backup_password || "");

    /*
     * This is the exact stored credential value that the
     * session signature will bind to. If an older plain-text
     * password is upgraded below, this variable is replaced
     * with the new hash so the validator sees the same value.
     */
    let sessionStoredPassword = storedPassword;

    const emailMatches =
      activeEmail
        .trim()
        .toLowerCase() ===
      String(email || "")
        .trim()
        .toLowerCase();

    const passwordMatches =
      verifyBackupPassword(
        String(password || ""),
        storedPassword
      );

    if (!emailMatches || !passwordMatches) {
      return NextResponse.json(
        {
          error:
            "Backup email or password is incorrect.",
        },
        { status: 403 }
      );
    }

    /*
     * If this was an older plain-text password,
     * immediately replace it with a secure hash for
     * whichever Backup Person role authenticated.
     */
    if (
      storedPassword &&
      !storedPassword.startsWith("scrypt$")
    ) {
      const hashedPassword =
        hashBackupPassword(
          String(password || "")
        );

      if (activeBackupRole === "secondary") {
        const { error: passwordUpgradeError } =
          await supabaseAdmin
            .from("memorial_backup_settings")
            .update({
              secondary_backup_password:
                hashedPassword,
              updated_at:
                new Date().toISOString(),
            })
            .eq("memorial_id", memorial.id);

        if (passwordUpgradeError) {
          console.error(
            "SECONDARY BACKUP PASSWORD UPGRADE ERROR:",
            passwordUpgradeError
          );

          return NextResponse.json(
            {
              error:
                "Backup access could not be completed.",
            },
            { status: 500 }
          );
        }
      } else {
        const { error: passwordUpgradeError } =
          await supabaseAdmin
            .from("memorials")
            .update({
              backup_password: hashedPassword,
            })
            .eq("id", memorial.id);

        if (passwordUpgradeError) {
          console.error(
            "BACKUP PASSWORD UPGRADE ERROR:",
            passwordUpgradeError
          );

          return NextResponse.json(
            {
              error:
                "Backup access could not be completed.",
            },
            { status: 500 }
          );
        }
      }

      sessionStoredPassword = hashedPassword;
    }

    const backupAccessSecret =
  process.env.BACKUP_ACCESS_SECRET || "";

if (!backupAccessSecret) {
      return NextResponse.json(
        {
          error:
            "Backup access is not configured.",
        },
        { status: 500 }
      );
    }

    const issuedAt = Date.now();
    const normalizedActiveEmail =
      activeEmail.trim().toLowerCase();

    /*
     * #14 final session format:
     *
     * memorialId:issuedAt:backupRole:hardenedSignature
     *
     * The signature is bound to the current Backup Person
     * role, email, stored password/hash, and current authority
     * version. Role failover, identity changes, password changes,
     * authority replacement, or revocation therefore invalidate
     * the existing session automatically.
     */
    const hardenedSignature = createHmac(
      "sha256",
      backupAccessSecret
    )
      .update(
        `${memorial.id}:${issuedAt}:${activeBackupRole}:${normalizedActiveEmail}:${sessionStoredPassword}:${activeAuthorityVersion}`
      )
      .digest("hex");

/*
 * Successful login — clear the failed-attempt
 * counter for this memorial and IP address.
 */
const { error: attemptDeleteError } =
  await supabaseAdmin
    .from("backup_login_attempts")
    .delete()
    .eq("attempt_key", attemptKey);

if (attemptDeleteError) {
  console.error(
    "BACKUP LOGIN RATE LIMIT DELETE ERROR:",
    attemptDeleteError
  );
}

const response = NextResponse.json({
      success: true,
      backupRole: activeBackupRole,
    });

    /*
     * Browser-session cookie: intentionally omit maxAge/expires so
     * closing the browser removes the cookie. The central
     * /api/backup-access validator still enforces the absolute
     * one-hour session limit from the signed issuedAt timestamp.
     */
    response.cookies.set(
      "myememorial_backup_access",
      `${memorial.id}:${issuedAt}:${activeBackupRole}:${hardenedSignature}`,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );

    return response;
  } catch (err) {
    console.error(
      "BACKUP LOGIN API ERROR:",
      err
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}