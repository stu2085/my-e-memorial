import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { transporter } from "../../../lib/email";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type BackupRole = "primary" | "secondary";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getRoleLabel(role: BackupRole) {
  return role === "secondary"
    ? "Secondary Backup Person"
    : "Primary Backup Person";
}

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function identityFingerprint(email: string) {
  if (!email) return null;

  return createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");
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

function readToken(req: NextRequest) {
  return String(
    req.nextUrl.searchParams.get("token") || ""
  ).trim();
}

async function loadPreferenceState(token: string) {
  if (!token || token.length < 32) {
    return {
      state: null,
      error: "This link is invalid.",
    };
  }

  const tokenHash = hashToken(token);

  const { data: state, error } =
    await supabaseAdmin
      .from("backup_person_reminder_state")
      .select("*")
      .eq("preference_token_hash", tokenHash)
      .maybeSingle();

  if (error) {
    return {
      state: null,
      error: error.message,
    };
  }

  if (!state) {
    return {
      state: null,
      error:
        "This link is invalid or has already been used.",
    };
  }

  if (
    !state.preference_token_expires_at ||
    new Date(
      state.preference_token_expires_at
    ).getTime() < Date.now()
  ) {
    return {
      state: null,
      error:
        "This reminder-preference link has expired.",
    };
  }

  return {
    state,
    error: "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = readToken(req);
    const { state, error } =
      await loadPreferenceState(token);

    if (!state) {
      return NextResponse.json(
        { error },
        { status: 404 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, full_name, is_living_preplan")
        .eq("id", state.memorial_id)
        .maybeSingle();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (state.reminders_disabled_at) {
      return NextResponse.json({
        success: true,
        alreadyDisabled: true,
        ownerName: memorial.full_name || "",
        backupName: state.backup_name || "",
        backupRole: state.backup_role,
        roleLabel:
          getRoleLabel(state.backup_role),
      });
    }

    return NextResponse.json({
      success: true,
      alreadyDisabled: false,
      ownerName: memorial.full_name || "",
      backupName: state.backup_name || "",
      backupRole: state.backup_role,
      roleLabel:
        getRoleLabel(state.backup_role),
    });
  } catch (error) {
    console.error(
      "BACKUP REMINDER PREFERENCE GET ERROR:",
      error
    );

    return NextResponse.json(
      { error: "This link could not be verified." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = readToken(req);
    const { state, error } =
      await loadPreferenceState(token);

    if (!state) {
      return NextResponse.json(
        { error },
        { status: 404 }
      );
    }

    const [
      memorialResult,
      settingsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("memorials")
        .select(
          "id, owner_id, full_name, is_living_preplan, backup_email, backup_password"
        )
        .eq("id", state.memorial_id)
        .maybeSingle(),

      supabaseAdmin
        .from("memorial_backup_settings")
        .select(
          "secondary_backup_email, secondary_backup_password, secondary_backup_activated_at, primary_backup_authority_version, primary_backup_revoked_at, secondary_backup_authority_version, secondary_backup_revoked_at"
        )
        .eq("memorial_id", state.memorial_id)
        .maybeSingle(),

    ]);

    if (
      memorialResult.error ||
      !memorialResult.data
    ) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (settingsResult.error) {
      return NextResponse.json(
        { error: settingsResult.error.message },
        { status: 500 }
      );
    }

    const memorial = memorialResult.data;
    const settings = settingsResult.data;

    if (
      memorial.is_living_preplan !== true
    ) {
      return NextResponse.json({
        success: true,
        noLongerNeeded: true,
        message:
          "Backup Person access is no longer active for this memorial.",
      });
    }

    const currentlyAssignedEmail =
      state.backup_role === "secondary"
        ? normalizeEmail(
            settings?.secondary_backup_email
          )
        : normalizeEmail(
            memorial.backup_email
          );

    if (
      !currentlyAssignedEmail ||
      currentlyAssignedEmail !==
        normalizeEmail(state.backup_email)
    ) {
      return NextResponse.json(
        {
          error:
            "This reminder link is no longer associated with the current Backup Person assignment.",
        },
        { status: 409 }
      );
    }

    const disabledAt =
      new Date().toISOString();

    const backupRole =
      state.backup_role as BackupRole;

    const currentAuthorityVersion =
      Number(
        backupRole === "secondary"
          ? settings
              ?.secondary_backup_authority_version ?? 1
          : settings
              ?.primary_backup_authority_version ?? 1
      );

    const safeCurrentAuthorityVersion =
      Number.isSafeInteger(
        currentAuthorityVersion
      ) &&
      currentAuthorityVersion >= 1
        ? currentAuthorityVersion
        : 1;

    const nextAuthorityVersion =
      safeCurrentAuthorityVersion + 1;

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

    /*
     * #18 durable Backup Person resignation.
     *
     * Resignation removes authority immediately:
     * - clear the role's stored credential
     * - mark the role revoked
     * - advance authority_version so any existing cookie fails
     *
     * Legacy Instructions and memorial content are untouched.
     * If an active Secondary resigns, its activation marker is
     * deliberately preserved so Primary does not silently regain
     * authority.
     */
    if (!alreadyRevoked) {
      if (backupRole === "secondary") {
        const { error: revokeError } =
          await supabaseAdmin
            .from("memorial_backup_settings")
            .update({
              secondary_backup_password: null,
              secondary_backup_authority_version:
                nextAuthorityVersion,
              secondary_backup_revoked_at:
                disabledAt,
              secondary_backup_revoked_by:
                "backup_person",
              secondary_backup_revocation_reason:
                "backup_person_can_no_longer_serve",
              updated_at: disabledAt,
            })
            .eq(
              "memorial_id",
              state.memorial_id
            );

        if (revokeError) {
          return NextResponse.json(
            { error: revokeError.message },
            { status: 500 }
          );
        }
      } else {
        const { error: passwordClearError } =
          await supabaseAdmin
            .from("memorials")
            .update({
              backup_password: null,
            })
            .eq("id", state.memorial_id);

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
            .from("memorial_backup_settings")
            .upsert(
              {
                memorial_id:
                  state.memorial_id,
                primary_backup_authority_version:
                  nextAuthorityVersion,
                primary_backup_revoked_at:
                  disabledAt,
                primary_backup_revoked_by:
                  "backup_person",
                primary_backup_revocation_reason:
                  "backup_person_can_no_longer_serve",
                updated_at: disabledAt,
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
        memorialId: state.memorial_id,
        backupRole,
        eventType: "authority_revoked",
        actorType: "backup_person",
        reasonCode:
          "backup_person_can_no_longer_serve",
        authorityVersion:
          nextAuthorityVersion,
        identityEmail:
          currentlyAssignedEmail,
      });
    }

    /*
     * Stop reminders and invalidate the one-time preference link.
     * This happens even if authority was already revoked, keeping
     * the reminder state idempotent.
     */
    if (!state.reminders_disabled_at) {
      const { error: updateError } =
        await supabaseAdmin
          .from("backup_person_reminder_state")
          .update({
            reminders_disabled_at:
              disabledAt,
            disabled_reason:
              "backup_person_can_no_longer_serve",
            preference_token_hash: null,
            preference_token_expires_at: null,
            updated_at: disabledAt,
          })
          .eq("id", state.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    let ownerNotificationSent = false;

    if (memorial.owner_id) {
      try {
        const {
          data: ownerData,
          error: ownerLookupError,
        } =
          await supabaseAdmin.auth.admin.getUserById(
            memorial.owner_id
          );

        if (ownerLookupError) {
          console.error(
            "BACKUP REMINDER OWNER LOOKUP ERROR:",
            ownerLookupError
          );
        }

        const ownerEmail =
          ownerData?.user?.email?.trim() || "";

        if (ownerEmail) {
          const ownerName = escapeHtml(
            memorial.full_name ||
              "your Living MyEMemorial"
          );

          const backupName = escapeHtml(
            state.backup_name ||
              state.backup_email
          );

          const roleLabel = escapeHtml(
            getRoleLabel(
              state.backup_role as BackupRole
            )
          );

          await transporter.sendMail({
            from:
              `"MyEMemorial" <help@myememorial.com>`,
            to: ownerEmail,
            subject:
              "Your MyEMemorial Backup Person Can No Longer Serve",
            html: `
              <div style="font-family:Arial,Helvetica,sans-serif;color:#1c1917;line-height:1.65;font-size:16px;">
                <p>Hello,</p>

                <p>
                  <strong>${backupName}</strong>, who is listed as the
                  <strong>${roleLabel}</strong> for
                  <strong>${ownerName}</strong>, has indicated that they
                  can no longer serve as a Backup Person.
                </p>

                <p>
                  Their Backup Person access has been revoked immediately,
                  their stored Backup Person password has been removed,
                  and their annual reminder emails have been turned off.
                </p>

                <p>
                  Your memorial and private Legacy Instructions have not
                  been deleted or changed. Please sign in to MyEMemorial
                  and update your Backup Person information as soon as
                  convenient.
                </p>

                <p>
                  MyEMemorial<br />
                  <strong>Where Life’s Stories Are Told.</strong>
                </p>

                <p>
                  <a
                    href="https://www.myememorial.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="text-decoration:none;"
                  >
                    <img
                      src="https://www.myememorial.com/myememorial-logo.png"
                      alt="MyEMemorial"
                      width="400"
                      style="display:block;margin-top:18px;border:0;width:400px;max-width:100%;height:auto;"
                    />
                  </a>
                </p>
              </div>
            `,
          });

          ownerNotificationSent = true;
        }
      } catch (emailError) {
        console.error(
          "BACKUP REMINDER OWNER EMAIL ERROR:",
          emailError
        );
      }
    }

    return NextResponse.json({
      success: true,
      alreadyDisabled:
        Boolean(state.reminders_disabled_at),
      alreadyRevoked,
      authorityRevoked: true,
      ownerNotificationSent,
      disabledAt,
      message:
        "Your Backup Person access has been ended immediately and your annual reminder emails have been turned off. The memorial owner has been notified when an owner email address was available.",
    });
  } catch (error) {
    console.error(
      "BACKUP REMINDER PREFERENCE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Your reminder preference could not be updated.",
      },
      { status: 500 }
    );
  }
}
