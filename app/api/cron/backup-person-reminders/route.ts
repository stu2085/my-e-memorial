import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { transporter } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type BackupRole = "primary" | "secondary";

type EligibleMemorial = {
  id: number;
  owner_id: string | null;
  full_name: string | null;
  backup_person_name: string | null;
  backup_email: string | null;
};

type BackupSettingsRow = {
  memorial_id: number;
  secondary_backup_name: string | null;
  secondary_backup_email: string | null;
  primary_backup_revoked_at: string | null;
  secondary_backup_revoked_at: string | null;
};

type LegacyHandoffRow = {
  memorial_id: number;
  death_reported_at: string | null;
  post_death_access_unlocked_at: string | null;
};

type ReminderStateRow = {
  id: number;
  memorial_id: number;
  backup_role: BackupRole;
  backup_name: string | null;
  backup_email: string;
  cycle_started_at: string;
  last_sent_at: string | null;
  next_due_at: string;
  send_count: number;
  last_attempt_at: string | null;
  last_error: string | null;
  reminders_disabled_at: string | null;
  disabled_reason: string | null;
  preference_token_hash: string | null;
  preference_token_expires_at: string | null;
};

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

function sanitizeEmailHeader(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function addOneCalendarYear(input: Date) {
  const result = new Date(input.getTime());
  const originalMonth = result.getUTCMonth();

  result.setUTCFullYear(result.getUTCFullYear() + 1);

  if (
    originalMonth === 1 &&
    input.getUTCDate() === 29 &&
    result.getUTCMonth() !== 1
  ) {
    result.setUTCMonth(1, 28);
  }

  return result;
}

function isAuthorizedCronRequest(req: NextRequest) {
  const cronSecret = String(
    process.env.CRON_SECRET || ""
  ).trim();

  if (!cronSecret) {
    return false;
  }

  return (
    req.headers.get("authorization") ===
    `Bearer ${cronSecret}`
  );
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.myememorial.com"
  ).replace(/\/+$/, "");
}

function getRoleLabel(role: BackupRole) {
  return role === "secondary"
    ? "Secondary Backup Person"
    : "Primary Backup Person";
}

function buildReminderEmail({
  backupName,
  ownerName,
  backupRole,
  preferenceUrl,
}: {
  backupName: string;
  ownerName: string;
  backupRole: BackupRole;
  preferenceUrl: string;
}) {
  const safeBackupName = escapeHtml(
    backupName || "Backup Person"
  );
  const safeOwnerName = escapeHtml(
    ownerName || "the memorial owner"
  );
  const safeRoleLabel = escapeHtml(
    getRoleLabel(backupRole)
  );
  const safePreferenceUrl =
    escapeHtml(preferenceUrl);

  const roleExplanation =
    backupRole === "secondary"
      ? `
        <p>
          You are the <strong>Secondary Backup Person</strong>.
          Your role is to be available if the Primary Backup Person
          can no longer serve and your Backup Person role is activated.
        </p>
      `
      : `
        <p>
          You are the <strong>Primary Backup Person</strong>.
          If the memorial owner passes away, you are the person
          MyEMemorial expects to begin the Backup Person process
          unless you can no longer serve.
        </p>
      `;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1c1917;line-height:1.65;font-size:16px;">
      <p>Hello ${safeBackupName},</p>

      <p>
        This is your annual MyEMemorial Backup Person check-in for
        <strong>${safeOwnerName}</strong>.
      </p>

      <p>
        You are currently listed as the
        <strong>${safeRoleLabel}</strong> for their
        <strong>Living MyEMemorial</strong>.
      </p>

      <h2 style="margin:24px 0 10px;font-size:20px;line-height:1.3;color:#1c1917;">
        What does being a Backup Person mean?
      </h2>

      ${roleExplanation}

      <p>
        While ${safeOwnerName} is living, there is normally nothing
        you need to do other than remain willing to serve and keep
        your contact information current.
      </p>

      <p>
        If ${safeOwnerName} passes away, the authorized Backup Person
        may report the death through MyEMemorial. A death report by
        itself does not unlock the memorial. MyEMemorial requires
        independent death verification before private post-death
        information and permitted Backup Person access are unlocked.
      </p>

      <p>
        After verification, the authorized Backup Person may help
        carry out the owner's MyEMemorial instructions, make the
        after-death updates permitted by MyEMemorial, communicate with
        an authorized funeral home when appropriate, and provide the
        memorial's approved photos and videos for a funeral-service
        presentation.
      </p>

      <p>
        Being a MyEMemorial Backup Person does <strong>not</strong>
        automatically make you the owner's executor, give you authority
        over the owner's estate, or give you authority to make funeral
        decisions unless the owner has separately given you that legal
        authority.
      </p>

      <h2 style="margin:24px 0 10px;font-size:20px;line-height:1.3;color:#1c1917;">
        Annual check-in
      </h2>

      <p>
        Please make sure your contact information is still current and
        that you are still willing and able to serve in this role if
        you are ever needed.
      </p>

      <p>
        <strong>If everything is still correct, no action is required.</strong>
      </p>

      <p>
        If you can no longer serve as a Backup Person, use the secure
        button below. Your Backup Person access will end immediately,
        your stored Backup Person password will be removed, future annual
        reminder emails to you will stop, and the memorial owner will be
        notified that their Backup Person information needs to be updated.
      </p>

      <div style="margin:24px 0;">
        <a
          href="${safePreferenceUrl}"
          style="
            display:inline-block;
            background:#7c2d12;
            color:#ffffff;
            text-decoration:none;
            padding:13px 20px;
            border-radius:10px;
            font-size:16px;
            font-weight:700;
          "
        >
          I Can No Longer Serve as Backup Person
        </a>
      </div>

      <p>
        For security, MyEMemorial will never include your Backup Person
        password or private Legacy Instructions in this reminder.
      </p>

      <p>
        Thank you for helping preserve ${safeOwnerName}'s wishes and
        life story for the future.
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
  `;
}

export async function GET(req: NextRequest) {
  const startedAt = new Date();

  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json(
      {
        error: String(process.env.CRON_SECRET || "").trim()
          ? "Unauthorized."
          : "CRON_SECRET is not configured.",
      },
      { status: 401 }
    );
  }

  try {
    let memorialQuery = supabaseAdmin
      .from("memorials")
      .select(
        "id, owner_id, full_name, backup_person_name, backup_email"
      )
      .eq("is_living_preplan", true)
      .eq("is_draft", false)
      .in("plan", ["basic", "plus", "premium"])
      .in("payment_status", ["paid", "free_beta"]);


    const {
      data: memorialRows,
      error: memorialError,
    } = await memorialQuery;

    if (memorialError) {
      console.error(
        "BACKUP REMINDER MEMORIAL LOAD ERROR:",
        memorialError
      );

      return NextResponse.json(
        { error: memorialError.message },
        { status: 500 }
      );
    }

    const memorials =
      (memorialRows || []) as EligibleMemorial[];

    if (memorials.length === 0) {
      return NextResponse.json({
        success: true,
        eligibleMemorials: 0,
        initialized: 0,
        identityReset: 0,
        due: 0,
        sent: 0,
        failed: 0,
        disabled: 0,
        revoked: 0,
        skippedAfterDeath: 0,
        details: [],
      });
    }

    const memorialIds = memorials.map(
      (memorial) => memorial.id
    );

    const [
      settingsResult,
      handoffResult,
      stateResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("memorial_backup_settings")
        .select(
          "memorial_id, secondary_backup_name, secondary_backup_email, primary_backup_revoked_at, secondary_backup_revoked_at"
        )
        .in("memorial_id", memorialIds),

      supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(
          "memorial_id, death_reported_at, post_death_access_unlocked_at"
        )
        .in("memorial_id", memorialIds),

      supabaseAdmin
        .from("backup_person_reminder_state")
        .select("*")
        .in("memorial_id", memorialIds),
    ]);

    if (settingsResult.error) {
      return NextResponse.json(
        { error: settingsResult.error.message },
        { status: 500 }
      );
    }

    if (handoffResult.error) {
      return NextResponse.json(
        { error: handoffResult.error.message },
        { status: 500 }
      );
    }

    if (stateResult.error) {
      return NextResponse.json(
        { error: stateResult.error.message },
        { status: 500 }
      );
    }

    const settingsByMemorial = new Map<
      number,
      BackupSettingsRow
    >(
      (
        (settingsResult.data || []) as BackupSettingsRow[]
      ).map((row) => [row.memorial_id, row])
    );

    const handoffByMemorial = new Map<
      number,
      LegacyHandoffRow
    >(
      (
        (handoffResult.data || []) as LegacyHandoffRow[]
      ).map((row) => [row.memorial_id, row])
    );

    const stateByKey = new Map<
      string,
      ReminderStateRow
    >(
      (
        (stateResult.data || []) as ReminderStateRow[]
      ).map((row) => [
        `${row.memorial_id}:${row.backup_role}`,
        row,
      ])
    );

    let initialized = 0;
    let identityReset = 0;
    let due = 0;
    let sent = 0;
    let failed = 0;
    let disabled = 0;
    let revoked = 0;
    let skippedAfterDeath = 0;

    const details: Array<Record<string, unknown>> = [];

    for (const memorial of memorials) {
      const settings =
        settingsByMemorial.get(memorial.id) || null;

      const handoff =
        handoffByMemorial.get(memorial.id) || null;

      if (
        handoff?.death_reported_at ||
        handoff?.post_death_access_unlocked_at
      ) {
        skippedAfterDeath += 1;

        details.push({
          memorialId: memorial.id,
          ownerName: memorial.full_name || "",
          action: "skipped_after_death",
        });

        continue;
      }

      const people: Array<{
        role: BackupRole;
        name: string;
        email: string;
      }> = [
        {
          role: "primary",
          name: String(
            memorial.backup_person_name || ""
          ).trim(),
          email: normalizeEmail(
            memorial.backup_email
          ),
        },
        {
          role: "secondary",
          name: String(
            settings?.secondary_backup_name || ""
          ).trim(),
          email: normalizeEmail(
            settings?.secondary_backup_email
          ),
        },
      ];

      for (const person of people) {
        if (!person.email) {
          continue;
        }

        const key =
          `${memorial.id}:${person.role}`;

        const now = new Date();
        const nowIso = now.toISOString();

        let state =
          stateByKey.get(key) || null;

        /*
         * #18 revocation enforcement for annual reminders.
         *
         * A revoked Backup Person assignment must never receive
         * a new reminder cycle or annual reminder. This check is
         * authoritative even when no reminder-state row exists yet.
         *
         * If a reminder-state row already exists, disable it without
         * replacing its identity. Explicit reappointment/reactivation
         * routes will remove the disabled row and start a fresh cycle.
         */
        const revokedAt =
          person.role === "secondary"
            ? settings?.secondary_backup_revoked_at || null
            : settings?.primary_backup_revoked_at || null;

        if (revokedAt) {
          revoked += 1;

          if (
            state &&
            !state.reminders_disabled_at
          ) {
            const {
              error: revokedStateUpdateError,
            } = await supabaseAdmin
              .from("backup_person_reminder_state")
              .update({
                reminders_disabled_at: revokedAt,
                disabled_reason:
                  "backup_person_authority_revoked",
                preference_token_hash: null,
                preference_token_expires_at: null,
                updated_at: nowIso,
              })
              .eq("id", state.id);

            if (revokedStateUpdateError) {
              failed += 1;

              details.push({
                memorialId: memorial.id,
                role: person.role,
                email: person.email,
                action:
                  "revoked_reminder_disable_failed",
                error:
                  revokedStateUpdateError.message,
              });

              continue;
            }

            state.reminders_disabled_at =
              revokedAt;
            state.disabled_reason =
              "backup_person_authority_revoked";
            state.preference_token_hash =
              null;
            state.preference_token_expires_at =
              null;
          }

          details.push({
            memorialId: memorial.id,
            role: person.role,
            email: person.email,
            action:
              "revoked_assignment_skipped",
            revokedAt,
          });

          continue;
        }

        const identityChanged =
          Boolean(state) &&
          normalizeEmail(state!.backup_email) !==
            person.email;

        if (!state || identityChanged) {
          const nextDueAt =
            addOneCalendarYear(now).toISOString();

          const { data: upsertedState, error } =
            await supabaseAdmin
              .from("backup_person_reminder_state")
              .upsert(
                {
                  memorial_id: memorial.id,
                  backup_role: person.role,
                  backup_name: person.name || null,
                  backup_email: person.email,
                  cycle_started_at: nowIso,
                  last_sent_at: null,
                  next_due_at: nextDueAt,
                  send_count: 0,
                  last_attempt_at: null,
                  last_error: null,
                  reminders_disabled_at: null,
                  disabled_reason: null,
                  preference_token_hash: null,
                  preference_token_expires_at: null,
                  updated_at: nowIso,
                },
                {
                  onConflict:
                    "memorial_id,backup_role",
                }
              )
              .select("*")
              .single();

          if (error || !upsertedState) {
            failed += 1;

            details.push({
              memorialId: memorial.id,
              role: person.role,
              action:
                "state_initialization_failed",
              error:
                error?.message ||
                "Could not initialize reminder state.",
            });

            continue;
          }

          state =
            upsertedState as ReminderStateRow;
          stateByKey.set(key, state);

          if (identityChanged) {
            identityReset += 1;
          } else {
            initialized += 1;
          }

          details.push({
            memorialId: memorial.id,
            role: person.role,
            email: person.email,
            action: identityChanged
              ? "identity_cycle_reset"
              : "annual_cycle_initialized",
            nextDueAt,
          });

          continue;
        } else if (
          state.backup_name !==
          (person.name || null)
        ) {
          await supabaseAdmin
            .from("backup_person_reminder_state")
            .update({
              backup_name: person.name || null,
              updated_at: nowIso,
            })
            .eq("id", state.id);

          state.backup_name =
            person.name || null;
        }

        if (state.reminders_disabled_at) {
          disabled += 1;

          details.push({
            memorialId: memorial.id,
            role: person.role,
            email: person.email,
            action: "reminders_disabled",
            disabledAt:
              state.reminders_disabled_at,
          });

          continue;
        }

        const nextDueMs = Date.parse(
          state.next_due_at
        );

        const isDue =
          Number.isFinite(nextDueMs) &&
          nextDueMs <= now.getTime();

        if (isDue) {
          due += 1;
        }

        if (!isDue) {
          details.push({
            memorialId: memorial.id,
            role: person.role,
            email: person.email,
            action: "not_due",
            nextDueAt: state.next_due_at,
          });

          continue;
        }


        if (state.last_attempt_at) {
          const lastAttemptMs = Date.parse(
            state.last_attempt_at
          );

          if (
            Number.isFinite(lastAttemptMs) &&
            now.getTime() - lastAttemptMs <
              20 * 60 * 60 * 1000
          ) {
            details.push({
              memorialId: memorial.id,
              role: person.role,
              action: "recent_attempt_skipped",
            });

            continue;
          }
        }

        const rawPreferenceToken =
          randomBytes(32).toString("hex");

        const preferenceTokenHash =
          createHash("sha256")
            .update(rawPreferenceToken)
            .digest("hex");

        const preferenceTokenExpiresAt =
          new Date(
            now.getTime() +
              400 * 24 * 60 * 60 * 1000
          ).toISOString();

        const { error: tokenStateError } =
          await supabaseAdmin
            .from("backup_person_reminder_state")
            .update({
              preference_token_hash:
                preferenceTokenHash,
              preference_token_expires_at:
                preferenceTokenExpiresAt,
              last_attempt_at: nowIso,
              updated_at: nowIso,
            })
            .eq("id", state.id);

        if (tokenStateError) {
          failed += 1;

          details.push({
            memorialId: memorial.id,
            role: person.role,
            action: "token_save_failed",
            error: tokenStateError.message,
          });

          continue;
        }

        const preferenceUrl =
          `${getSiteUrl()}` +
          `/backup-person/reminder-preference?token=` +
          encodeURIComponent(rawPreferenceToken);

        const ownerName = String(
          memorial.full_name ||
            "the memorial owner"
        ).trim();

        const subjectOwnerName =
          sanitizeEmailHeader(ownerName) ||
          "a MyEMemorial owner";

        const recipient = person.email;

        try {
          await transporter.sendMail({
            from:
              `"MyEMemorial" <help@myememorial.com>`,
            to: recipient,
            subject:
              `Annual Backup Person Check-In for ${subjectOwnerName}'s MyEMemorial`,
            html: buildReminderEmail({
              backupName: person.name,
              ownerName,
              backupRole: person.role,
              preferenceUrl,
            }),
          });

          sent += 1;

          const sentAt = new Date();
          const sentAtIso =
            sentAt.toISOString();
          const nextDueAt =
            addOneCalendarYear(
              sentAt
            ).toISOString();

          const { error: sentStateError } =
            await supabaseAdmin
              .from(
                "backup_person_reminder_state"
              )
              .update({
                last_sent_at: sentAtIso,
                next_due_at: nextDueAt,
                send_count:
                  Number(
                    state.send_count || 0
                  ) + 1,
                last_attempt_at: sentAtIso,
                last_error: null,
                updated_at: sentAtIso,
              })
              .eq("id", state.id);

          if (sentStateError) {
            details.push({
              memorialId: memorial.id,
              role: person.role,
              action:
                "sent_but_state_update_failed",
              error:
                sentStateError.message,
            });

            continue;
          }

          state.last_sent_at =
            sentAtIso;
          state.next_due_at =
            nextDueAt;
          state.send_count =
            Number(
              state.send_count || 0
            ) + 1;
          state.last_attempt_at =
            sentAtIso;
          state.last_error = null;

          details.push({
            memorialId: memorial.id,
            role: person.role,
            assignedEmail: person.email,
            recipient,
            action: "annual_reminder_sent",
            nextDueAt: state.next_due_at,
          });
        } catch (emailError) {
          failed += 1;

          const errorMessage =
            emailError instanceof Error
              ? emailError.message
              : "Email send failed.";

          console.error(
            "ANNUAL BACKUP PERSON REMINDER EMAIL ERROR:",
            {
              memorialId: memorial.id,
              role: person.role,
              error: emailError,
            }
          );

          await supabaseAdmin
            .from("backup_person_reminder_state")
            .update({
              last_attempt_at: nowIso,
              last_error:
                errorMessage.slice(0, 1000),
              preference_token_hash: null,
              preference_token_expires_at: null,
              updated_at: nowIso,
            })
            .eq("id", state.id);

          details.push({
            memorialId: memorial.id,
            role: person.role,
            action: "email_failed",
            error: errorMessage,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      eligibleMemorials: memorials.length,
      initialized,
      identityReset,
      due,
      sent,
      failed,
      disabled,
      revoked,
      skippedAfterDeath,
      details,
    });
  } catch (error) {
    console.error(
      "ANNUAL BACKUP PERSON REMINDER CRON ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Annual Backup Person reminders could not be processed.",
      },
      { status: 500 }
    );
  }
}
