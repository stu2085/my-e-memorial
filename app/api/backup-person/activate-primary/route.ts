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
            "Only the memorial owner can restore Primary Backup Person authority.",
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
            "Backup Person authority is only available for Living MyEMemorials.",
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

    const primaryEmail =
      normalizeEmail(memorial.backup_email);

    const primaryPassword =
      String(
        memorial.backup_password || ""
      );

    if (
      !primaryEmail ||
      !primaryPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Set the Primary Backup Person email and a fresh password before restoring Primary authority.",
        },
        { status: 400 }
      );
    }

    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(
        "memorial_id, secondary_backup_email, secondary_backup_activated_at, primary_backup_authority_version, primary_backup_revoked_at, secondary_backup_authority_version"
      )
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "PRIMARY RESTORE SETTINGS LOOKUP ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    if (
      settings?.primary_backup_revoked_at
    ) {
      return NextResponse.json(
        {
          error:
            "The Primary Backup Person is currently revoked. Set a fresh Primary Backup Person password first, then restore Primary authority.",
        },
        { status: 409 }
      );
    }

    const secondaryIsActive =
      Boolean(
        settings
          ?.secondary_backup_activated_at
      );

    if (!secondaryIsActive) {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        backupRole: "primary",
        message:
          "The Primary Backup Person is already the active Backup Person.",
      });
    }

    const currentPrimaryVersion =
      safeAuthorityVersion(
        settings
          ?.primary_backup_authority_version
      );

    const currentSecondaryVersion =
      safeAuthorityVersion(
        settings
          ?.secondary_backup_authority_version
      );

    /*
     * Advance BOTH generations during the role transition.
     *
     * This invalidates every previously issued Primary and
     * Secondary cookie so neither role can regain an old session
     * simply because the owner switches roles again.
     */
    const nextPrimaryVersion =
      currentPrimaryVersion + 1;

    const nextSecondaryVersion =
      currentSecondaryVersion + 1;

    const restoredAt =
      new Date().toISOString();

    const {
      error: restoreError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .update({
        secondary_backup_activated_at:
          null,
        secondary_backup_activated_by:
          null,
        primary_backup_authority_version:
          nextPrimaryVersion,
        secondary_backup_authority_version:
          nextSecondaryVersion,
        updated_at: restoredAt,
      })
      .eq("memorial_id", memorialId);

    if (restoreError) {
      console.error(
        "PRIMARY BACKUP RESTORE ERROR:",
        restoreError
      );

      return NextResponse.json(
        { error: restoreError.message },
        { status: 500 }
      );
    }

    await recordAuthorityEvent({
      memorialId,
      backupRole: "secondary",
      eventType:
        "authority_deactivated",
      actorType: "owner",
      reasonCode:
        "owner_restored_primary",
      authorityVersion:
        nextSecondaryVersion,
      identityEmail:
        normalizeEmail(
          settings?.secondary_backup_email
        ),
    });

    await recordAuthorityEvent({
      memorialId,
      backupRole: "primary",
      eventType:
        "authority_restored",
      actorType: "owner",
      reasonCode:
        "owner_restored_primary",
      authorityVersion:
        nextPrimaryVersion,
      identityEmail: primaryEmail,
    });

    return NextResponse.json({
      success: true,
      alreadyActive: false,
      backupRole: "primary",
      restoredAt,
      primaryAuthorityVersion:
        nextPrimaryVersion,
      secondaryAuthorityVersion:
        nextSecondaryVersion,
      message:
        "Primary Backup Person authority has been restored.",
    });
  } catch (error) {
    console.error(
      "PRIMARY BACKUP RESTORE API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Primary Backup Person authority could not be restored.",
      },
      { status: 500 }
    );
  }
}
