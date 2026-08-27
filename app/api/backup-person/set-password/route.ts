import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes, scryptSync } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function hashBackupPassword(password: string) {
  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(
    String(password || ""),
    salt,
    64
  ).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

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
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your sign-in could not be verified." },
        { status: 401 }
      );
    }

    const { memorialId, password, backupRole } = await req.json();

    const normalizedBackupRole =
      backupRole === "secondary" ? "secondary" : "primary";

    const normalizedMemorialId = Number(memorialId);
    const normalizedPassword = String(password || "");

    if (
      !Number.isFinite(normalizedMemorialId) ||
      normalizedMemorialId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    if (normalizedPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            normalizedBackupRole === "secondary"
              ? "The Secondary Backup Person password must be at least 8 characters."
              : "The Backup Person password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, owner_id, is_living_preplan, plan, payment_status, backup_email")
        .eq("id", normalizedMemorialId)
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
            "Only the memorial owner can set the Backup Person password.",
        },
        { status: 403 }
      );
    }

    if (memorial.is_living_preplan !== true) {
      return NextResponse.json(
        {
          error:
            "Backup Person passwords are only available for Living MyEMemorials.",
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

    const hashedPassword =
      hashBackupPassword(normalizedPassword);

    const now = new Date().toISOString();

    if (normalizedBackupRole === "secondary") {
      const { data: settings, error: settingsLookupError } =
        await supabaseAdmin
          .from("memorial_backup_settings")
          .select(
            "memorial_id, secondary_backup_email, secondary_backup_activated_at, secondary_backup_authority_version, secondary_backup_revoked_at"
          )
          .eq("memorial_id", normalizedMemorialId)
          .maybeSingle();

      if (settingsLookupError) {
        console.error(
          "SECONDARY BACKUP SETTINGS LOOKUP ERROR:",
          settingsLookupError
        );

        return NextResponse.json(
          { error: settingsLookupError.message },
          { status: 500 }
        );
      }

      const secondaryEmail =
        normalizeEmail(
          settings?.secondary_backup_email
        );

      if (!secondaryEmail) {
        return NextResponse.json(
          {
            error:
              "Save the Secondary Backup Person email before setting their password.",
          },
          { status: 400 }
        );
      }

      const currentAuthorityVersion =
        Number(
          settings
            ?.secondary_backup_authority_version ?? 1
        );

      const safeCurrentAuthorityVersion =
        Number.isSafeInteger(currentAuthorityVersion) &&
        currentAuthorityVersion >= 1
          ? currentAuthorityVersion
          : 1;

      const nextAuthorityVersion =
        safeCurrentAuthorityVersion + 1;

      const secondaryIsActive =
        Boolean(
          settings?.secondary_backup_activated_at
        );

      const secondaryWasRevoked =
        Boolean(
          settings?.secondary_backup_revoked_at
        );

      const secondaryUpdate: Record<
        string,
        unknown
      > = {
        secondary_backup_password:
          hashedPassword,
        secondary_backup_authority_version:
          nextAuthorityVersion,
        updated_at: now,
      };

      /*
       * A revoked standby Secondary may be deliberately
       * reappointed by the owner by setting a fresh password.
       *
       * A revoked ACTIVE Secondary stays revoked here because
       * the replacement/revocation must be explicitly activated
       * again rather than silently regaining authority.
       */
      if (
        secondaryWasRevoked &&
        !secondaryIsActive
      ) {
        secondaryUpdate.secondary_backup_revoked_at =
          null;
        secondaryUpdate.secondary_backup_revoked_by =
          null;
        secondaryUpdate.secondary_backup_revocation_reason =
          null;
      }

      const { error: updateError } =
        await supabaseAdmin
          .from("memorial_backup_settings")
          .update(secondaryUpdate)
          .eq("memorial_id", normalizedMemorialId);

      if (updateError) {
        console.error(
          "SECONDARY BACKUP PASSWORD SET ERROR:",
          updateError
        );

        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      const secondaryWasReinstated =
        secondaryWasRevoked &&
        !secondaryIsActive;

      await recordAuthorityEvent({
        memorialId: normalizedMemorialId,
        backupRole: "secondary",
        eventType: secondaryWasReinstated
          ? "authority_reinstated"
          : "credential_changed",
        actorType: "owner",
        reasonCode: secondaryWasReinstated
          ? "owner_reappointed_standby_secondary"
          : "owner_set_secondary_password",
        authorityVersion:
          nextAuthorityVersion,
        identityEmail: secondaryEmail,
      });

      if (secondaryWasReinstated) {
        const { error: reminderResetError } =
          await supabaseAdmin
            .from("backup_person_reminder_state")
            .delete()
            .eq(
              "memorial_id",
              normalizedMemorialId
            )
            .eq("backup_role", "secondary");

        if (reminderResetError) {
          console.error(
            "SECONDARY BACKUP REMINDER RESET ERROR:",
            reminderResetError
          );
        }
      }
    } else {
      const {
        data: settings,
        error: settingsLookupError,
      } = await supabaseAdmin
        .from("memorial_backup_settings")
        .select(
          "memorial_id, primary_backup_authority_version, primary_backup_revoked_at"
        )
        .eq("memorial_id", normalizedMemorialId)
        .maybeSingle();

      if (settingsLookupError) {
        console.error(
          "PRIMARY BACKUP AUTHORITY LOOKUP ERROR:",
          settingsLookupError
        );

        return NextResponse.json(
          { error: settingsLookupError.message },
          { status: 500 }
        );
      }

      const currentAuthorityVersion =
        Number(
          settings
            ?.primary_backup_authority_version ?? 1
        );

      const safeCurrentAuthorityVersion =
        Number.isSafeInteger(currentAuthorityVersion) &&
        currentAuthorityVersion >= 1
          ? currentAuthorityVersion
          : 1;

      const nextAuthorityVersion =
        safeCurrentAuthorityVersion + 1;

      const primaryWasRevoked =
        Boolean(
          settings?.primary_backup_revoked_at
        );

      const { error: updateError } =
        await supabaseAdmin
          .from("memorials")
          .update({
            backup_password: hashedPassword,
          })
          .eq("id", normalizedMemorialId)
          .eq("owner_id", user.id);

      if (updateError) {
        console.error(
          "BACKUP PASSWORD SET ERROR:",
          updateError
        );

        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      /*
       * Setting a fresh Primary password is an explicit owner
       * reappointment. Clear any prior Primary revocation and
       * advance the authority version.
       */
      const { error: authorityUpdateError } =
        await supabaseAdmin
          .from("memorial_backup_settings")
          .upsert(
            {
              memorial_id:
                normalizedMemorialId,
              primary_backup_authority_version:
                nextAuthorityVersion,
              primary_backup_revoked_at: null,
              primary_backup_revoked_by: null,
              primary_backup_revocation_reason:
                null,
              updated_at: now,
            },
            {
              onConflict: "memorial_id",
            }
          );

      if (authorityUpdateError) {
        console.error(
          "PRIMARY BACKUP AUTHORITY UPDATE ERROR:",
          authorityUpdateError
        );

        return NextResponse.json(
          { error: authorityUpdateError.message },
          { status: 500 }
        );
      }

      await recordAuthorityEvent({
        memorialId: normalizedMemorialId,
        backupRole: "primary",
        eventType: primaryWasRevoked
          ? "authority_reinstated"
          : "credential_changed",
        actorType: "owner",
        reasonCode: primaryWasRevoked
          ? "owner_reappointed_primary"
          : "owner_set_primary_password",
        authorityVersion:
          nextAuthorityVersion,
        identityEmail:
          normalizeEmail(memorial.backup_email),
      });

      if (primaryWasRevoked) {
        const { error: reminderResetError } =
          await supabaseAdmin
            .from("backup_person_reminder_state")
            .delete()
            .eq(
              "memorial_id",
              normalizedMemorialId
            )
            .eq("backup_role", "primary");

        if (reminderResetError) {
          console.error(
            "PRIMARY BACKUP REMINDER RESET ERROR:",
            reminderResetError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      backupRole: normalizedBackupRole,
    });
  } catch (error) {
    console.error(
      "BACKUP PASSWORD SET API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}