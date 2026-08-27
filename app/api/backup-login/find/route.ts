import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  scryptSync,
  timingSafeEqual,
} from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const backupLookupAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

type DiscoverableMemorial = {
  id: number;
  slug: string | null;
  full_name: string | null;
  is_living_preplan: boolean | null;
  plan: string | null;
  payment_status: string | null;
};

type LegacyAccessRow = {
  memorial_id: number;
  death_verified_at: string | null;
  post_death_access_unlocked_at: string | null;
};

function getClientIp(req: Request) {
  return (
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function verifyBackupPassword(
  suppliedPassword: string,
  storedPassword: string
) {
  if (!storedPassword) {
    return false;
  }

  /*
   * Current secure Backup Person password format.
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

    if (
      suppliedBuffer.length !==
      storedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      suppliedBuffer,
      storedBuffer
    );
  }

  /*
   * Temporary compatibility with older Personal
   * E-Memorials that still have a legacy plain-text
   * Backup Person password.
   *
   * The existing /api/backup-login route upgrades
   * those passwords after successful access.
   */
  return (
    storedPassword ===
    String(suppliedPassword || "")
  );
}

function hasEligiblePlanAndPayment(
  memorial: DiscoverableMemorial
) {
  const hasEligiblePaidPlan =
    memorial.plan === "basic" ||
    memorial.plan === "plus" ||
    memorial.plan === "premium";

  const hasEligiblePaymentStatus =
    memorial.payment_status === "paid" ||
    memorial.payment_status === "free_beta";

  return (
    hasEligiblePaidPlan &&
    hasEligiblePaymentStatus
  );
}

function hasValidAuthorityVersion(
  value: unknown
) {
  const version = Number(value ?? 1);

  return (
    Number.isSafeInteger(version) &&
    version >= 1
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(
      body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body?.password || ""
    );

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Please enter your Backup Person email and password.",
        },
        { status: 400 }
      );
    }

    /*
     * Rate-limit Backup Person discovery attempts.
     */
    const ip = getClientIp(req);
    const attemptKey =
      `${ip}:${email}`;
    const now = Date.now();

    const existingAttempt =
      backupLookupAttempts.get(attemptKey);

    if (
      existingAttempt &&
      existingAttempt.resetAt > now
    ) {
      if (existingAttempt.count >= 5) {
        return NextResponse.json(
          {
            error:
              "Too many Backup Person login attempts. Please try again later.",
          },
          { status: 429 }
        );
      }

      backupLookupAttempts.set(
        attemptKey,
        {
          count:
            existingAttempt.count + 1,
          resetAt:
            existingAttempt.resetAt,
        }
      );
    } else {
      backupLookupAttempts.set(
        attemptKey,
        {
          count: 1,
          resetAt:
            now + 15 * 60 * 1000,
        }
      );
    }

    /*
     * Find memorials assigned to this email as either:
     *
     * 1. the current Primary Backup Person, when
     *    Secondary failover has NOT been activated, or
     *
     * 2. the activated Secondary Backup Person.
     *
     * IMPORTANT:
     * A Living MyEMemorial becomes is_living_preplan=false
     * when it is published after death. Discovery therefore
     * cannot use is_living_preplan=true as its only filter.
     *
     * Password verification happens before any memorial
     * information is returned. Final eligibility below mirrors
     * /api/backup-login:
     *
     * - Living MyEMemorials remain eligible;
     * - non-living former Living MyEMemorials are eligible
     *   only after independent death verification AND explicit
     *   post-death Backup Person activation;
     * - only eligible paid plans/payment states are returned;
     * - revoked or superseded Backup Person roles are excluded.
     */

    const {
      data: primaryCandidates,
      error: primaryLookupError,
    } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, slug, full_name, backup_email, backup_password, is_living_preplan, plan, payment_status"
      )
      .ilike("backup_email", email);

    if (primaryLookupError) {
      console.error(
        "PRIMARY BACKUP PERSON LOOKUP ERROR:",
        primaryLookupError
      );

      return NextResponse.json(
        {
          error:
            "Backup Person login could not be completed.",
        },
        { status: 500 }
      );
    }

    const primaryIds = (primaryCandidates || []).map(
      (memorial) => Number(memorial.id)
    );

    const blockedPrimaryMemorialIds =
      new Set<number>();

    if (primaryIds.length > 0) {
      const {
        data: primarySettings,
        error: primarySettingsError,
      } = await supabaseAdmin
        .from("memorial_backup_settings")
        .select(
          "memorial_id, secondary_backup_activated_at, primary_backup_authority_version, primary_backup_revoked_at"
        )
        .in("memorial_id", primaryIds);

      if (primarySettingsError) {
        console.error(
          "PRIMARY FAILOVER STATUS LOOKUP ERROR:",
          primarySettingsError
        );

        return NextResponse.json(
          {
            error:
              "Backup Person login could not be completed.",
          },
          { status: 500 }
        );
      }

      for (const settings of primarySettings || []) {
        const memorialId =
          Number(settings.memorial_id);

        const secondaryIsActive =
          Boolean(
            settings.secondary_backup_activated_at
          );

        const primaryIsRevoked =
          Boolean(
            settings.primary_backup_revoked_at
          );

        const authorityVersionIsValid =
          hasValidAuthorityVersion(
            settings.primary_backup_authority_version
          );

        if (
          secondaryIsActive ||
          primaryIsRevoked ||
          !authorityVersionIsValid
        ) {
          blockedPrimaryMemorialIds.add(
            memorialId
          );
        }
      }
    }

    const primaryCredentialMatches = (
      primaryCandidates || []
    ).filter((memorial) => {
      const memorialId =
        Number(memorial.id);

      if (
        blockedPrimaryMemorialIds.has(
          memorialId
        )
      ) {
        return false;
      }

      const memorialEmail =
        String(
          memorial.backup_email || ""
        )
          .trim()
          .toLowerCase();

      const storedPassword =
        String(
          memorial.backup_password || ""
        );

      return (
        memorialEmail === email &&
        verifyBackupPassword(
          password,
          storedPassword
        )
      );
    });

    const {
      data: secondarySettings,
      error: secondaryLookupError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(
        "memorial_id, secondary_backup_email, secondary_backup_password, secondary_backup_activated_at, secondary_backup_authority_version, secondary_backup_revoked_at"
      )
      .ilike("secondary_backup_email", email)
      .not(
        "secondary_backup_activated_at",
        "is",
        null
      );

    if (secondaryLookupError) {
      console.error(
        "SECONDARY BACKUP PERSON LOOKUP ERROR:",
        secondaryLookupError
      );

      return NextResponse.json(
        {
          error:
            "Backup Person login could not be completed.",
        },
        { status: 500 }
      );
    }

    const secondaryCredentialMatches =
      (secondarySettings || []).filter((settings) => {
        const secondaryEmail =
          String(
            settings.secondary_backup_email || ""
          )
            .trim()
            .toLowerCase();

        const storedPassword =
          String(
            settings.secondary_backup_password || ""
          );

        const secondaryIsRevoked =
          Boolean(
            settings.secondary_backup_revoked_at
          );

        const authorityVersionIsValid =
          hasValidAuthorityVersion(
            settings.secondary_backup_authority_version
          );

        return (
          secondaryEmail === email &&
          Boolean(
            settings.secondary_backup_activated_at
          ) &&
          !secondaryIsRevoked &&
          authorityVersionIsValid &&
          verifyBackupPassword(
            password,
            storedPassword
          )
        );
      });

    const secondaryIds =
      secondaryCredentialMatches.map(
        (settings) => Number(settings.memorial_id)
      );

    let secondaryMemorials:
      DiscoverableMemorial[] = [];

    if (secondaryIds.length > 0) {
      const {
        data: loadedSecondaryMemorials,
        error: secondaryMemorialError,
      } = await supabaseAdmin
        .from("memorials")
        .select(
          "id, slug, full_name, is_living_preplan, plan, payment_status"
        )
        .in("id", secondaryIds);

      if (secondaryMemorialError) {
        console.error(
          "SECONDARY BACKUP MEMORIAL LOOKUP ERROR:",
          secondaryMemorialError
        );

        return NextResponse.json(
          {
            error:
              "Backup Person login could not be completed.",
          },
          { status: 500 }
        );
      }

      secondaryMemorials =
        (loadedSecondaryMemorials || []) as
          DiscoverableMemorial[];
    }

    const credentialMatchedMemorials =
      new Map<number, DiscoverableMemorial>();

    for (
      const memorial of
      primaryCredentialMatches
    ) {
      credentialMatchedMemorials.set(
        Number(memorial.id),
        {
          id: Number(memorial.id),
          slug: memorial.slug,
          full_name: memorial.full_name,
          is_living_preplan:
            memorial.is_living_preplan,
          plan: memorial.plan,
          payment_status:
            memorial.payment_status,
        }
      );
    }

    for (const memorial of secondaryMemorials) {
      credentialMatchedMemorials.set(
        Number(memorial.id),
        memorial
      );
    }

    const nonLivingIds = Array.from(
      credentialMatchedMemorials.values()
    )
      .filter(
        (memorial) =>
          memorial.is_living_preplan !== true
      )
      .map((memorial) => memorial.id);

    const legacyAccessByMemorial =
      new Map<number, LegacyAccessRow>();

    if (nonLivingIds.length > 0) {
      const {
        data: legacyAccessRows,
        error: legacyAccessError,
      } = await supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(
          "memorial_id, death_verified_at, post_death_access_unlocked_at"
        )
        .in("memorial_id", nonLivingIds);

      if (legacyAccessError) {
        console.error(
          "BACKUP PERSON FIND POST-DEATH LOOKUP ERROR:",
          legacyAccessError
        );

        return NextResponse.json(
          {
            error:
              "Backup Person login could not be completed.",
          },
          { status: 500 }
        );
      }

      for (
        const row of
        (legacyAccessRows || []) as LegacyAccessRow[]
      ) {
        legacyAccessByMemorial.set(
          Number(row.memorial_id),
          row
        );
      }
    }

    const matches = Array.from(
      credentialMatchedMemorials.values()
    ).filter((memorial) => {
      if (
        !hasEligiblePlanAndPayment(memorial)
      ) {
        return false;
      }

      if (
        memorial.is_living_preplan === true
      ) {
        return true;
      }

      const legacyAccess =
        legacyAccessByMemorial.get(
          memorial.id
        );

      return (
        Boolean(
          legacyAccess?.death_verified_at
        ) &&
        Boolean(
          legacyAccess
            ?.post_death_access_unlocked_at
        )
      );
    });

    if (matches.length === 0) {
      return NextResponse.json(
        {
          error:
            "Backup Person email or password is incorrect.",
        },
        { status: 403 }
      );
    }

    /*
     * Successful credential verification.
     */
    backupLookupAttempts.delete(
      attemptKey
    );

    return NextResponse.json({
      success: true,

      memorials: matches.map(
        (memorial) => ({
          id: memorial.id,
          slug: memorial.slug,
          fullName:
            String(
              memorial.full_name || ""
            ).trim() ||
            "Living MyEMemorial",
        })
      ),
    });
  } catch (error) {
    console.error(
      "BACKUP PERSON FIND ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Backup Person login could not be completed.",
      },
      { status: 500 }
    );
  }
}
