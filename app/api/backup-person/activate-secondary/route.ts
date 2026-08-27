import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function hasLegacyInstructionsEntitlement(memorial: {
  plan?: string | null;
  payment_status?: string | null;
}) {
  const hasEligiblePlan =
    memorial.plan === "basic" ||
    memorial.plan === "plus" ||
    memorial.plan === "premium";

  const hasEligiblePaymentStatus =
    memorial.payment_status === "paid" ||
    memorial.payment_status === "free_beta";

  return hasEligiblePlan && hasEligiblePaymentStatus;
}

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function identityFingerprint(email: string) {
  if (!email) return null;

  return createHash("sha256")
    .update(email)
    .digest("hex");
}

async function recordAuthorityEvent(input: {
  memorialId: number;
  backupRole: "primary" | "secondary";
  eventType: string;
  actorType: string;
  reasonCode?: string | null;
  authorityVersion?: number | null;
  identityEmail?: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("backup_person_authority_events")
    .insert({
      memorial_id: input.memorialId,
      backup_role: input.backupRole,
      event_type: input.eventType,
      actor_type: input.actorType,
      reason_code: input.reasonCode || null,
      authority_version:
        input.authorityVersion ?? null,
      identity_fingerprint:
        identityFingerprint(
          normalizeEmail(input.identityEmail)
        ),
    });

  if (error) {
    console.error(
      "BACKUP AUTHORITY EVENT INSERT ERROR:",
      error
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const memorialId = Number(body?.memorialId);

    if (
      !Number.isFinite(memorialId) ||
      memorialId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select(
          "id, owner_id, is_living_preplan, full_name, backup_email, backup_password, plan, payment_status"
        )
        .eq("id", memorialId)
        .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    let isEligiblePersonalMemorial =
      memorial.is_living_preplan === true;

    if (!isEligiblePersonalMemorial) {
      const {
        data: handoff,
        error: handoffError,
      } = await supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(
          "death_verified_at, post_death_access_unlocked_at"
        )
        .eq("memorial_id", memorialId)
        .maybeSingle();

      if (handoffError) {
        console.error(
          "SECONDARY BACKUP ACTIVATION HANDOFF LOOKUP ERROR:",
          handoffError
        );

        return NextResponse.json(
          {
            error:
              "MyEMemorial could not verify post-death Backup Person authority.",
          },
          { status: 500 }
        );
      }

      isEligiblePersonalMemorial =
        Boolean(handoff?.death_verified_at) &&
        Boolean(handoff?.post_death_access_unlocked_at);
    }

    if (!isEligiblePersonalMemorial) {
      return NextResponse.json(
        {
          error:
            "Secondary Backup Person activation is available only for an active Living MyEMemorial or after verified post-death access has been unlocked.",
        },
        { status: 400 }
      );
    }

    if (!hasLegacyInstructionsEntitlement(memorial)) {
      return NextResponse.json(
        {
          error:
            "Legacy Instructions are not available for this memorial.",
        },
        { status: 403 }
      );
    }

    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .select(
          "memorial_id, secondary_backup_name, secondary_backup_email, secondary_backup_phone, secondary_backup_password, secondary_backup_activated_at, secondary_backup_activated_by, primary_backup_authority_version, primary_backup_revoked_at, secondary_backup_authority_version, secondary_backup_revoked_at"
        )
        .eq("memorial_id", memorialId)
        .maybeSingle();

    if (settingsError) {
      console.error(
        "SECONDARY BACKUP ACTIVATION SETTINGS ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    const secondaryName = String(
      settings?.secondary_backup_name || ""
    ).trim();

    const secondaryEmail =
      normalizeEmail(
        settings?.secondary_backup_email
      );

    const secondaryPhone = String(
      settings?.secondary_backup_phone || ""
    ).trim();

    const secondaryPassword = String(
      settings?.secondary_backup_password || ""
    );

    if (
      !secondaryName ||
      !secondaryEmail ||
      !secondaryPhone ||
      !secondaryPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Complete the Secondary Backup Person name, email, phone, and password before activating the Secondary Backup Person.",
        },
        { status: 400 }
      );
    }

    const secondaryWasActivated =
      Boolean(
        settings?.secondary_backup_activated_at
      );

    const secondaryWasRevoked =
      Boolean(
        settings?.secondary_backup_revoked_at
      );

    const primaryAuthorityVersion = Number(
      settings?.primary_backup_authority_version ?? 1
    );

    const safePrimaryAuthorityVersion =
      Number.isSafeInteger(primaryAuthorityVersion) &&
      primaryAuthorityVersion >= 1
        ? primaryAuthorityVersion
        : 1;

    const secondaryAuthorityVersion = Number(
      settings?.secondary_backup_authority_version ?? 1
    );

    const safeSecondaryAuthorityVersion =
      Number.isSafeInteger(secondaryAuthorityVersion) &&
      secondaryAuthorityVersion >= 1
        ? secondaryAuthorityVersion
        : 1;

    /*
     * OWNER AUTHORIZATION
     */
    let isOwner = false;

    const authHeader =
      req.headers.get("authorization");

    const bearerToken =
      authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";

    if (bearerToken) {
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(
        bearerToken
      );

      if (!userError && user) {
        isOwner = memorial.owner_id === user.id;
      }
    }

    /*
     * #18 CENTRAL BACKUP PERSON AUTHORIZATION
     *
     * Initial Secondary failover may still be activated by the
     * currently authorized Primary Backup Person, but this route
     * no longer validates the cookie itself.
     *
     * The central /api/backup-access validator enforces the exact
     * four-part hardened cookie, one-hour age, active role,
     * current identity/password, authority version, revocation,
     * Living MyEMemorial gating, and paid entitlement.
     */
    let hasBackupAccess = false;

    if (!isOwner) {
      const accessCheckUrl = new URL(
        `/api/backup-access?memorialId=${encodeURIComponent(
          String(memorialId)
        )}`,
        req.url
      );

      const accessCheckResponse = await fetch(
        accessCheckUrl,
        {
          method: "GET",
          headers: {
            cookie:
              req.headers.get("cookie") || "",
          },
          cache: "no-store",
        }
      );

      const accessCheckResult =
        await accessCheckResponse.json();

      hasBackupAccess =
        accessCheckResponse.ok &&
        accessCheckResult?.valid === true &&
        accessCheckResult?.backupRole ===
          "primary";
    }

    /*
     * #18 authority rules:
     *
     * - Initial failover may be activated by the owner or the
     *   currently authorized Primary Backup Person.
     * - If an already-active Secondary was revoked/replaced,
     *   reactivation is owner-only. We do not allow automatic
     *   fallback or a revoked Backup Person to restore authority.
     */
    const isReactivation =
      secondaryWasActivated &&
      secondaryWasRevoked;

    if (
      isReactivation &&
      !isOwner
    ) {
      return NextResponse.json(
        {
          error:
            "Only the memorial owner can reactivate a revoked or replaced Secondary Backup Person.",
        },
        { status: 403 }
      );
    }

    if (
      !isReactivation &&
      !isOwner &&
      !hasBackupAccess
    ) {
      return NextResponse.json(
        {
          error:
            "Only the memorial owner or the currently authorized Primary Backup Person can activate the Secondary Backup Person.",
        },
        { status: 403 }
      );
    }

    if (
      secondaryWasActivated &&
      !secondaryWasRevoked
    ) {
      return NextResponse.json({
        success: true,
        alreadyActivated: true,
        activatedAt:
          settings?.secondary_backup_activated_at,
        activatedBy:
          settings?.secondary_backup_activated_by || "",
      });
    }

    const activatedAt = new Date().toISOString();
    const activatedBy = isOwner
      ? "owner"
      : "primary_backup";

    /*
     * Every role transition establishes new authority
     * generations for BOTH roles.
     *
     * Advancing Primary here prevents an old Primary cookie from
     * becoming valid again later if the owner restores Primary
     * within the original one-hour session window.
     */
    const nextPrimaryAuthorityVersion =
      safePrimaryAuthorityVersion + 1;

    const nextSecondaryAuthorityVersion =
      safeSecondaryAuthorityVersion + 1;

    const { error: activationError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .update({
          secondary_backup_activated_at:
            activatedAt,
          secondary_backup_activated_by:
            activatedBy,
          primary_backup_authority_version:
            nextPrimaryAuthorityVersion,
          secondary_backup_authority_version:
            nextSecondaryAuthorityVersion,
          secondary_backup_revoked_at: null,
          secondary_backup_revoked_by: null,
          secondary_backup_revocation_reason:
            null,
          updated_at: activatedAt,
        })
        .eq("memorial_id", memorialId);

    if (activationError) {
      console.error(
        "SECONDARY BACKUP ACTIVATION ERROR:",
        activationError
      );

      return NextResponse.json(
        { error: activationError.message },
        { status: 500 }
      );
    }

    await recordAuthorityEvent({
      memorialId,
      backupRole: "primary",
      eventType: "authority_deactivated",
      actorType: activatedBy,
      reasonCode:
        "secondary_failover_became_active",
      authorityVersion:
        nextPrimaryAuthorityVersion,
      identityEmail:
        normalizeEmail(memorial.backup_email),
    });

    await recordAuthorityEvent({
      memorialId,
      backupRole: "secondary",
      eventType: isReactivation
        ? "authority_reactivated"
        : "authority_activated",
      actorType: activatedBy,
      reasonCode: isReactivation
        ? "owner_explicitly_reactivated_secondary"
        : "secondary_failover_activated",
      authorityVersion:
        nextSecondaryAuthorityVersion,
      identityEmail: secondaryEmail,
    });

    /*
     * If this was a same-identity reactivation after a previous
     * resignation, remove the disabled reminder state. The annual
     * reminder cron will create a fresh one-year cycle.
     */
    if (isReactivation) {
      const { error: reminderResetError } =
        await supabaseAdmin
          .from("backup_person_reminder_state")
          .delete()
          .eq("memorial_id", memorialId)
          .eq("backup_role", "secondary");

      if (reminderResetError) {
        console.error(
          "SECONDARY BACKUP REMINDER RESET ERROR:",
          reminderResetError
        );
      }
    }

    return NextResponse.json({
      success: true,
      alreadyActivated: false,
      reactivated: isReactivation,
      activatedAt,
      activatedBy,
      primaryAuthorityVersion:
        nextPrimaryAuthorityVersion,
      authorityVersion:
        nextSecondaryAuthorityVersion,
      message: isReactivation
        ? "The Secondary Backup Person has been reactivated."
        : "The Secondary Backup Person has been activated.",
    });
  } catch (error) {
    console.error(
      "SECONDARY BACKUP ACTIVATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The Secondary Backup Person could not be activated.",
      },
      { status: 500 }
    );
  }
}
