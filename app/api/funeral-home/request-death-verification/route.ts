import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";
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

function signaturesMatch(
  supplied: string,
  expected: string
) {
  const suppliedBuffer = Buffer.from(
    supplied,
    "utf8"
  );

  const expectedBuffer = Buffer.from(
    expected,
    "utf8"
  );

  if (
    suppliedBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    suppliedBuffer,
    expectedBuffer
  );
}

export async function POST(req: NextRequest) {
  try {
    const { memorialId } = await req.json();

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

    /*
     * Confirm this request is coming from an
     * authorized Backup Person session.
     */
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${normalizedMemorialId}`,
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

    const hasBackupAccess =
  accessCheckResponse.ok &&
  accessCheckResult?.valid === true;

const internalSignature = String(
  req.headers.get(
    "x-myememorial-internal-signature"
  ) || ""
).trim();

const internalSecret =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const expectedInternalSignature =
  internalSecret
    ? createHmac(
        "sha256",
        internalSecret
      )
        .update(
          `request-death-verification:${normalizedMemorialId}`
        )
        .digest("hex")
    : "";

const hasInternalAccess =
  Boolean(
    internalSignature &&
    expectedInternalSignature &&
    signaturesMatch(
      internalSignature,
      expectedInternalSignature
    )
  );

if (!hasBackupAccess && !hasInternalAccess) {
  return NextResponse.json(
    {
      error:
        "Backup access is not valid.",
    },
    { status: 403 }
  );
}

    /*
     * Load the memorial.
     */
    const {
      data: memorial,
      error: memorialError,
    } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, full_name, is_living_preplan, backup_person_name, backup_email"
      )
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
            "Death verification is only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    /*
     * A pending death report must already
     * exist before we contact a funeral home.
     */
    const {
      data: handoff,
      error: handoffError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .select(
        "death_reported_at, death_verified_at"
      )
      .eq(
        "memorial_id",
        normalizedMemorialId
      )
      .maybeSingle();

    if (handoffError) {
      console.error(
        "DEATH VERIFICATION REQUEST HANDOFF ERROR:",
        handoffError
      );

      return NextResponse.json(
        { error: handoffError.message },
        { status: 500 }
      );
    }

    if (!handoff?.death_reported_at) {
      return NextResponse.json(
        {
          error:
            "There is no pending death report.",
        },
        { status: 409 }
      );
    }

    if (handoff.death_verified_at) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
      });
    }

    /*
     * Determine the currently active
     * funeral home.
     */
    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(`
        backup_phone,
        primary_funeral_home_name,
        primary_funeral_home_email,
        primary_funeral_home_acknowledged_at,
        primary_funeral_home_unavailable_at,
        alternate_funeral_home_name,
        alternate_funeral_home_email,
        alternate_funeral_home_activated_at,
        alternate_funeral_home_acknowledged_at
      `)
      .eq(
        "memorial_id",
        normalizedMemorialId
      )
      .maybeSingle();

    if (settingsError) {
      console.error(
        "DEATH VERIFICATION REQUEST SETTINGS ERROR:",
        settingsError
      );

      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        {
          error:
            "No funeral-home information is available.",
        },
        { status: 409 }
      );
    }

    const alternateIsActive =
      Boolean(
        settings.primary_funeral_home_unavailable_at
      ) &&
      Boolean(
        settings.alternate_funeral_home_activated_at
      );

    const funeralHomeType:
      | "primary"
      | "alternate" =
      alternateIsActive
        ? "alternate"
        : "primary";

    const funeralHomeName =
      funeralHomeType === "alternate"
        ? String(
            settings.alternate_funeral_home_name ||
              ""
          ).trim()
        : String(
            settings.primary_funeral_home_name ||
              ""
          ).trim();

    const funeralHomeEmail =
      funeralHomeType === "alternate"
        ? String(
            settings.alternate_funeral_home_email ||
              ""
          )
            .trim()
            .toLowerCase()
        : String(
            settings.primary_funeral_home_email ||
              ""
          )
            .trim()
            .toLowerCase();

    const acknowledgedAt =
      funeralHomeType === "alternate"
        ? settings.alternate_funeral_home_acknowledged_at
        : settings.primary_funeral_home_acknowledged_at;

    if (
      !funeralHomeName ||
      !funeralHomeEmail
    ) {
      return NextResponse.json(
        {
          error:
            "The active funeral home does not have complete contact information.",
        },
        { status: 409 }
      );
    }

    /*
     * Preference acknowledgement establishes
     * the funeral-home contact.
     *
     * It does NOT verify the death.
     */
    if (!acknowledgedAt) {
      return NextResponse.json(
        {
          error:
            "The active funeral home has not yet acknowledged the owner's preference notice.",
        },
        { status: 409 }
      );
    }

    const secret =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!secret) {
      return NextResponse.json(
        {
          error:
            "Death verification is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * The token is tied to this exact death
     * report timestamp.
     *
     * If the owner cancels the report, the
     * verification route will reject it.
     */
    const verificationToken =
      createHmac("sha256", secret)
        .update(
          `${normalizedMemorialId}:${funeralHomeType}:${handoff.death_reported_at}`
        )
        .digest("hex");

    const baseUrl = req.nextUrl.origin;

    const verificationUrl =
      `${baseUrl}/funeral-home/verify-death` +
      `?memorialId=${normalizedMemorialId}` +
      `&funeralHomeType=${funeralHomeType}` +
      `&token=${encodeURIComponent(
        verificationToken
      )}`;

    const memorialName =
      String(memorial.full_name || "").trim() ||
      "the person named in this Living MyEMemorial";

    const designatedContactName =
      String(memorial.backup_person_name || "").trim() ||
      "Not provided";

    const designatedContactEmail =
      String(memorial.backup_email || "").trim() ||
      "Not provided";

    const designatedContactPhone =
      String(settings.backup_phone || "").trim() ||
      "Not provided";

    const memorialNameHtml =
      escapeHtml(memorialName);

    const funeralHomeNameHtml =
      escapeHtml(funeralHomeName);

    const designatedContactNameHtml =
      escapeHtml(designatedContactName);

    const designatedContactPhoneHtml =
      escapeHtml(designatedContactPhone);

    const designatedContactEmailHtml =
      escapeHtml(designatedContactEmail);

    await transporter.sendMail({
      from:
        `"MyEMemorial" <help@myememorial.com>`,
      to: funeralHomeEmail,
      subject:
        "MyEMemorial Death Verification Request",
      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f5f5f4;
          font-family:Arial,Helvetica,sans-serif;
          color:#1c1917;
        ">
          <div style="
            max-width:640px;
            margin:0 auto;
            background:#ffffff;
            border-radius:18px;
            padding:32px;
          ">
            <div style="
              text-align:center;
              margin-bottom:28px;
            ">
              <img
                src="${baseUrl}/myememorial-logo.png"
                alt="MyEMemorial"
                width="220"
                style="
                  width:220px;
                  max-width:100%;
                  height:auto;
                  border:0;
                "
              />
            </div>

            <h1 style="
              margin:0 0 22px;
              text-align:center;
              font-size:26px;
              line-height:1.3;
            ">
              Death Verification Request
            </h1>

            <p style="
              font-size:17px;
              line-height:1.7;
            ">
              MyEMemorial has received a report
              that <strong>${memorialNameHtml}</strong>
              has died.
            </p>

            <p style="
              font-size:17px;
              line-height:1.7;
            ">
              <strong>${funeralHomeNameHtml}</strong>
              was previously identified as the
              current funeral-home contact for
              this Living MyEMemorial.
            </p>

            <div style="
              margin:24px 0;
              padding:18px;
              border:1px solid #d6d3d1;
              border-radius:12px;
              background:#fafaf9;
            ">
              <p style="
                margin:0 0 12px;
                font-size:18px;
                line-height:1.5;
                font-weight:700;
              ">
                Designated Contact
              </p>

              <p style="
                margin:0;
                font-size:17px;
                line-height:1.8;
              ">
                <strong>Name:</strong> ${designatedContactNameHtml}<br />
                <strong>Phone:</strong> ${designatedContactPhoneHtml}<br />
                <strong>Email:</strong> ${designatedContactEmailHtml}
              </p>
            </div>

            <p style="
              font-size:17px;
              line-height:1.7;
            ">
              Please allow the family or Designated Contact a day or two to
              contact you first. If you have not heard from them after that
              time, you are welcome to reach out using the phone number or
              email address above.
            </p>

            <div style="
              margin:24px 0;
              padding:18px;
              border:1px solid #bfdbfe;
              border-radius:12px;
              background:#eff6ff;
            ">
              <p style="
                margin:0;
                font-size:17px;
                line-height:1.7;
                font-weight:700;
                color:#1e3a8a;
              ">
                Please confirm only if your
                funeral home is currently
                handling arrangements for this
                person and can independently
                verify the death.
              </p>
            </div>

            <div style="
              text-align:center;
              margin:30px 0;
            ">
              <a
                href="${verificationUrl}"
                style="
                  display:inline-block;
                  background:#1c1917;
                  color:#ffffff;
                  text-decoration:none;
                  padding:16px 28px;
                  border-radius:12px;
                  font-size:18px;
                  font-weight:700;
                "
              >
                Review Death Verification
              </a>
            </div>

            <p style="
              font-size:16px;
              line-height:1.7;
              color:#57534e;
            ">
              This is separate from the earlier
              funeral-home preference
              acknowledgement. This request is
              specifically for independent
              verification of the reported
              death.
            </p>

            <p style="
              margin-top:30px;
              font-size:16px;
              line-height:1.7;
            ">
              <strong>MyEMemorial</strong><br />
              Where Life’s Stories Are Told.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      sent: true,
      emailStatus: "sent",
      funeralHomeType,
      funeralHomeName,
    });
  } catch (error) {
    console.error(
      "REQUEST DEATH VERIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        sent: false,
        emailStatus: "failed",
        error:
          "The death-verification request could not be sent.",
      },
      { status: 500 }
    );
  }
}