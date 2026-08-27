import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type BackupRole = "primary" | "secondary";

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
    .update(normalizeEmail(email))
    .digest("hex");
}

function safeAuthorityVersion(value: unknown) {
  const parsed = Number(value ?? 1);

  return Number.isSafeInteger(parsed) &&
    parsed >= 1
    ? parsed
    : 1;
}

async function recordAuthorityEvent(input: {
  memorialId: number;
  backupRole: BackupRole;
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
          input.identityEmail || ""
        ),
    });

  if (error) {
    console.error(
      "BACKUP AUTHORITY EVENT INSERT ERROR:",
      error
    );
  }
}

async function getOwnerFromRequest(req: NextRequest) {
  const authHeader =
    req.headers.get("authorization");

  const token =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error:
            "Your sign-in could not be verified.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    errorResponse: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      user,
      errorResponse,
    } = await getOwnerFromRequest(req);

    if (!user) {
      return errorResponse!;
    }

    const body = await req.json();

    const memorialId =
      Number(body?.memorialId);

    const backupRole: BackupRole =
      body?.backupRole === "secondary"
        ? "secondary"
        : "primary";

    if (
      !Number.isFinite(memorialId) ||
      memorialId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid memorial ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: memorial,
      error: memorialError,
    } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, owner_id, is_living_preplan, plan, payment_status, backup_email, backup_password"
      )
      .eq("id", memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the memorial owner can end Backup Person access.",
        },
        { status: 403 }
      );
    }

    if (
      memorial.is_living_preplan !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Backup Person access is only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    if (
      !hasLegacyInstructionsEntitlement(
        memorial
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Legacy Instructions are not available for this memorial.",
        },
        { status: 403 }
      );
    }

    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(
        "memorial_id, secondary_backup_email, secondary_backup_password, secondary_backup_activated_at, primary_backup_authority_version, primary_backup_revoked_at, secondary_backup_authority_version, secondary_backup_revoked_at"
      )
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "BACKUP REVOKE SETTINGS LOOKUP ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    const identityEmail =
      backupRole === "secondary"
        ? normalizeEmail(
            settings
              ?.secondary_backup_email
          )
        : normalizeEmail(
            memorial.backup_email
          );

    if (!identityEmail) {
      return NextResponse.json(
        {
          error:
            backupRole === "secondary"
              ? "No Secondary Backup Person is currently assigned."
              : "No Primary Backup Person is currently assigned.",
        },
        { status: 400 }
      );
    }

    const alreadyRevoked =
      backupRole === "secondary"
        ? Boolean(
            settings
              ?.secondary_backup_revoked_at
          )
        : Boolean(
            settings
              ?.primary_backup_revoked_at
          );

    const currentVersion =
      backupRole === "secondary"
        ? safeAuthorityVersion(
            settings
              ?.secondary_backup_authority_version
          )
        : safeAuthorityVersion(
            settings
              ?.primary_backup_authority_version
          );

    const revokedAt =
      new Date().toISOString();

    let authorityVersion =
      currentVersion;

    if (!alreadyRevoked) {
      authorityVersion =
        currentVersion + 1;

      if (backupRole === "secondary") {
        /*
         * Keep secondary_backup_activated_at unchanged.
         *
         * If Secondary is currently active, preserving the marker
         * prevents an unsafe automatic fallback to Primary.
         */
        const { error: revokeError } =
          await supabaseAdmin
            .from(
              "memorial_backup_settings"
            )
            .update({
              secondary_backup_password:
                null,
              secondary_backup_authority_version:
                authorityVersion,
              secondary_backup_revoked_at:
                revokedAt,
              secondary_backup_revoked_by:
                "owner",
              secondary_backup_revocation_reason:
                "owner_revoked_backup_person",
              updated_at: revokedAt,
            })
            .eq(
              "memorial_id",
              memorialId
            );

        if (revokeError) {
          return NextResponse.json(
            { error: revokeError.message },
            { status: 500 }
          );
        }
      } else {
        const {
          error: passwordClearError,
        } = await supabaseAdmin
          .from("memorials")
          .update({
            backup_password: null,
          })
          .eq("id", memorialId)
          .eq("owner_id", user.id);

        if (passwordClearError) {
          return NextResponse.json(
            {
              error:
                passwordClearError.message,
            },
            { status: 500 }
          );
        }

        const { error: revokeError } =
          await supabaseAdmin
            .from(
              "memorial_backup_settings"
            )
            .upsert(
              {
                memorial_id: memorialId,
                primary_backup_authority_version:
                  authorityVersion,
                primary_backup_revoked_at:
                  revokedAt,
                primary_backup_revoked_by:
                  "owner",
                primary_backup_revocation_reason:
                  "owner_revoked_backup_person",
                updated_at: revokedAt,
              },
              {
                onConflict: "memorial_id",
              }
            );

        if (revokeError) {
          return NextResponse.json(
            { error: revokeError.message },
            { status: 500 }
          );
        }
      }

      await recordAuthorityEvent({
        memorialId,
        backupRole,
        eventType:
          "authority_revoked",
        actorType: "owner",
        reasonCode:
          "owner_revoked_backup_person",
        authorityVersion,
        identityEmail,
      });
    }

    /*
     * Stop reminder delivery for this role. If no reminder-state
     * row exists yet, there is nothing to update; the revocation
     * state remains authoritative.
     */
    const {
      error: reminderDisableError,
    } = await supabaseAdmin
      .from(
        "backup_person_reminder_state"
      )
      .update({
        reminders_disabled_at:
          revokedAt,
        disabled_reason:
          "owner_revoked_backup_person",
        preference_token_hash: null,
        preference_token_expires_at:
          null,
        updated_at: revokedAt,
      })
      .eq("memorial_id", memorialId)
      .eq("backup_role", backupRole);

    if (reminderDisableError) {
      console.error(
        "BACKUP REVOKE REMINDER DISABLE ERROR:",
        reminderDisableError
      );
    }

    return NextResponse.json({
      success: true,
      alreadyRevoked,
      backupRole,
      revokedAt,
      authorityVersion,
      message:
        backupRole === "secondary"
          ? "Secondary Backup Person access has been ended."
          : "Primary Backup Person access has been ended.",
    });
  } catch (error) {
    console.error(
      "BACKUP PERSON OWNER REVOKE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Backup Person access could not be ended.",
      },
      { status: 500 }
    );
  }
}
