import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { transporter } from "../../../lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function sanitizeEmailHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  try {
   const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "").trim();

let ownerUserId: string | null = null;

if (token) {
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (!userError && user) {
    ownerUserId = user.id;
  }
}

const { memorialId, funeralHomeType } = await req.json();

    const normalizedMemorialId = Number(memorialId);

    if (
      !Number.isFinite(normalizedMemorialId) ||
      normalizedMemorialId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    if (
      funeralHomeType !== "primary" &&
      funeralHomeType !== "alternate"
    ) {
      return NextResponse.json(
        { error: "Invalid funeral home type." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, owner_id, full_name, is_living_preplan")
        .eq("id", normalizedMemorialId)
        .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    

    if (memorial.is_living_preplan !== true) {
      return NextResponse.json(
        {
          error:
            "Funeral-home preference notification is only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .select("*")
        .eq("memorial_id", normalizedMemorialId)
        .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        {
          error:
            "Backup Person settings could not be found.",
        },
        { status: 404 }
      );
    }
const isOwner =
  Boolean(
    ownerUserId &&
    memorial.owner_id === ownerUserId
  );

let backupAllowed = false;

if (!isOwner) {
  if (funeralHomeType !== "alternate") {
    return NextResponse.json(
      {
        error:
          "The Backup Person may only notify the activated Alternate Funeral Home.",
      },
      { status: 403 }
    );
  }

  const accessCheckUrl = new URL(
    `/api/backup-access?memorialId=${normalizedMemorialId}`,
    req.url
  );

  const accessCheckResponse = await fetch(
    accessCheckUrl,
    {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
      cache: "no-store",
    }
  );

  const accessCheckResult =
    await accessCheckResponse.json();

  const hasBackupAccess =
    accessCheckResponse.ok &&
    accessCheckResult?.valid === true;

  if (!hasBackupAccess) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const {
    data: legacy,
    error: legacyError,
  } = await supabaseAdmin
    .from("memorial_legacy_handoff")
    .select("death_reported_at")
    .eq(
      "memorial_id",
      normalizedMemorialId
    )
    .maybeSingle();

  if (legacyError) {
    console.error(
      "FUNERAL HOME NOTIFY LEGACY LOOKUP ERROR:",
      legacyError
    );

    return NextResponse.json(
      { error: legacyError.message },
      { status: 500 }
    );
  }

  if (!legacy?.death_reported_at) {
    return NextResponse.json(
      {
        error:
          "A death must first be reported before the Backup Person may notify the Alternate Funeral Home.",
      },
      { status: 403 }
    );
  }

  const alternateIsActive =
    Boolean(
      settings.primary_funeral_home_unavailable_at
    ) &&
    Boolean(
      settings.alternate_funeral_home_activated_at
    );

  if (!alternateIsActive) {
    return NextResponse.json(
      {
        error:
          "The Alternate Funeral Home must first be activated.",
      },
      { status: 403 }
    );
  }

  backupAllowed = true;
}

if (!isOwner && !backupAllowed) {
  return NextResponse.json(
    { error: "Unauthorized." },
    { status: 401 }
  );
}
    const isPrimary = funeralHomeType === "primary";

    const funeralHomeName = String(
      isPrimary
        ? settings.primary_funeral_home_name || ""
        : settings.alternate_funeral_home_name || ""
    ).trim();

    const funeralHomeEmail = String(
      isPrimary
        ? settings.primary_funeral_home_email || ""
        : settings.alternate_funeral_home_email || ""
    )
      .trim()
      .toLowerCase();

    const memorialName = String(
      memorial.full_name || "the memorial owner"
    ).trim();

    const memorialNameHtml =
      escapeHtml(memorialName);

    const funeralHomeNameHtml =
      escapeHtml(funeralHomeName);

    const memorialNameSubject =
      sanitizeEmailHeader(memorialName);

    const funeralHomeNameSubject =
      sanitizeEmailHeader(funeralHomeName);

    const notifyAuthorized = isPrimary
      ? settings.primary_funeral_home_notify_authorized
      : settings.alternate_funeral_home_notify_authorized;

    const alreadyAcknowledged = isPrimary
      ? settings.primary_funeral_home_acknowledged_at
      : settings.alternate_funeral_home_acknowledged_at;

    if (!funeralHomeName) {
      return NextResponse.json(
        { error: "Funeral home name is required." },
        { status: 400 }
      );
    }

    if (!funeralHomeEmail) {
      return NextResponse.json(
        { error: "Funeral home email is required." },
        { status: 400 }
      );
    }

    if (notifyAuthorized !== true) {
      return NextResponse.json(
        {
          error:
            "The memorial owner has not authorized notification to this funeral home.",
        },
        { status: 403 }
      );
    }

    if (alreadyAcknowledged) {
      return NextResponse.json(
        {
          error:
            "This funeral home has already acknowledged the owner's preference.",
        },
        { status: 400 }
      );
    }

    const rawToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const baseUrl =
  process.env.NODE_ENV === "development"
    ? req.nextUrl.origin
    : process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

const acknowledgementUrl =
  `${baseUrl}/funeral-home/acknowledge?token=${encodeURIComponent(rawToken)}`;

    const updatePayload = isPrimary
      ? {
          primary_funeral_home_ack_token_hash: tokenHash,
          primary_funeral_home_ack_token_expires_at: expiresAt,
          primary_funeral_home_notification_email:
            funeralHomeEmail,
          updated_at: new Date().toISOString(),
        }
      : {
          alternate_funeral_home_ack_token_hash: tokenHash,
          alternate_funeral_home_ack_token_expires_at: expiresAt,
          alternate_funeral_home_notification_email:
            funeralHomeEmail,
          updated_at: new Date().toISOString(),
        };

    const { error: updateError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .update(updatePayload)
        .eq("memorial_id", normalizedMemorialId);

    if (updateError) {
      console.error(
        "FUNERAL HOME NOTIFICATION TOKEN SAVE ERROR:",
        updateError
      );

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    try {
      await transporter.sendMail({
        from: `"MyEMemorial" <help@myememorial.com>`,
        to: funeralHomeEmail,
        subject: `${memorialNameSubject} Has Identified ${funeralHomeNameSubject} as a Preferred Funeral Home`,
        html: `
          <p>Hello,</p>

          <p>
            <strong>${memorialNameHtml}</strong> has identified
            <strong>${funeralHomeNameHtml}</strong> as ${
              isPrimary ? "their preferred" : "an alternate"
            } funeral home in their Living MyEMemorial on MyEMemorial.
          </p>

          <p>
            This notice does not create a prepaid funeral arrangement,
            contract, financial obligation, or guarantee of future services.
          </p>

          <p>
            ${memorialNameHtml} has authorized MyEMemorial to notify
            your funeral home of this preference.
          </p>

          <p>
            A Designated Contact is also on file for ${memorialNameHtml}.
            Current contact information may be provided to your funeral home
            after their death if it is needed to help coordinate contact and
            independent death verification.
          </p>

          <p>
            Please use the button below to acknowledge that your funeral
            home received this preference notice.
          </p>

          <p style="margin: 24px 0;">
            <a
              href="${acknowledgementUrl}"
              style="
                display:inline-block;
                padding:14px 22px;
                background:#1f2937;
                color:#ffffff;
                text-decoration:none;
                border-radius:8px;
                font-size:16px;
                font-weight:700;
              "
            >
              Acknowledge Preference
            </a>
          </p>

          <p>
            This acknowledgement only confirms receipt of the owner's
            preference. It does not create a contract or prepaid arrangement.
          </p>

          <p>
            Thank you,<br />
            MyEMemorial
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
                width="220"
                style="display:block; margin-top:16px; border:0;"
              />
            </a>
          </p>
        `,
      });
    } catch (emailError) {
      console.error(
        "FUNERAL HOME NOTIFICATION EMAIL ERROR:",
        emailError
      );

      const failedEmailCleanupPayload = isPrimary
        ? {
            primary_funeral_home_ack_token_hash: null,
            primary_funeral_home_ack_token_expires_at: null,
            primary_funeral_home_notification_email: null,
            updated_at: new Date().toISOString(),
          }
        : {
            alternate_funeral_home_ack_token_hash: null,
            alternate_funeral_home_ack_token_expires_at: null,
            alternate_funeral_home_notification_email: null,
            updated_at: new Date().toISOString(),
          };

      const { error: cleanupError } =
        await supabaseAdmin
          .from("memorial_backup_settings")
          .update(failedEmailCleanupPayload)
          .eq("memorial_id", normalizedMemorialId);

      if (cleanupError) {
        console.error(
          "FUNERAL HOME NOTIFICATION FAILURE CLEANUP ERROR:",
          cleanupError
        );
      }

      return NextResponse.json(
        {
          error:
            "The funeral-home notification could not be sent.",
          emailStatus: "failed",
        },
        { status: 500 }
      );
    }

    const sentAt = new Date().toISOString();

    const sentUpdatePayload = isPrimary
      ? {
          primary_funeral_home_notified_at: sentAt,
          updated_at: sentAt,
        }
      : {
          alternate_funeral_home_notified_at: sentAt,
          updated_at: sentAt,
        };

    const { error: sentUpdateError } =
      await supabaseAdmin
        .from("memorial_backup_settings")
        .update(sentUpdatePayload)
        .eq("memorial_id", normalizedMemorialId);

    if (sentUpdateError) {
      console.error(
        "FUNERAL HOME NOTIFICATION SENT-STATE UPDATE ERROR:",
        sentUpdateError
      );

      return NextResponse.json(
        {
          error:
            "The email was sent, but MyEMemorial could not record the notification status.",
          emailStatus: "sent_status_error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailStatus: "sent",
      message: "Funeral home notification sent.",
    });
  } catch (error) {
    console.error(
      "FUNERAL HOME NOTIFY API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
