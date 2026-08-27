import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function createVerificationSignature(
  memorialId: number,
  funeralHomeType: "primary" | "alternate",
  deathReportedAt: string
) {
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!secret) {
    throw new Error(
      "Death verification is not configured."
    );
  }

  return createHmac("sha256", secret)
    .update(
      `${memorialId}:${funeralHomeType}:${deathReportedAt}`
    )
    .digest("hex");
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
    const body = await req.json();

    const memorialId = Number(body?.memorialId);

    const funeralHomeType =
      body?.funeralHomeType === "alternate"
        ? "alternate"
        : body?.funeralHomeType === "primary"
          ? "primary"
          : null;

    const suppliedSignature =
      String(body?.token || "").trim();

    if (
      !Number.isFinite(memorialId) ||
      memorialId <= 0 ||
      !funeralHomeType ||
      !suppliedSignature
    ) {
      return NextResponse.json(
        {
          error:
            "This death-verification request is not valid.",
        },
        { status: 400 }
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
        "id, full_name, is_living_preplan"
      )
      .eq("id", memorialId)
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
     * There must be an active pending death report.
     */
    const {
      data: handoff,
      error: handoffError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .select(`
        memorial_id,
        death_reported_at,
        death_verified_at,
        death_verified_by_funeral_home,
        post_death_access_unlocked_at
      `)
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (handoffError) {
      console.error(
        "DEATH VERIFICATION HANDOFF LOAD ERROR:",
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
            "There is no pending death report for this Living MyEMemorial.",
        },
        { status: 409 }
      );
    }

    /*
     * If it has already been verified, do not
     * write another verification.
     */
    if (handoff.death_verified_at) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        memorialName:
          memorial.full_name ||
          "this Living MyEMemorial",
      });
    }

    /*
     * Verify that this link was generated for
     * this exact pending death report.
     *
     * If the owner cancelled the report,
     * death_reported_at becomes null and this
     * route already refuses it.
     *
     * If a later report is created, its
     * death_reported_at is different, making
     * the old email link invalid.
     */
    const expectedSignature =
      createVerificationSignature(
        memorialId,
        funeralHomeType,
        handoff.death_reported_at
      );

    if (
      !signaturesMatch(
        suppliedSignature,
        expectedSignature
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This death-verification link is invalid or no longer current.",
        },
        { status: 403 }
      );
    }

    /*
     * Load the owner's funeral-home settings.
     */
    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from("memorial_backup_settings")
      .select(`
        primary_funeral_home_name,
        primary_funeral_home_email,
        primary_funeral_home_acknowledged_at,
        primary_funeral_home_unavailable_at,
        alternate_funeral_home_name,
        alternate_funeral_home_email,
        alternate_funeral_home_activated_at,
        alternate_funeral_home_acknowledged_at
      `)
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "DEATH VERIFICATION SETTINGS LOAD ERROR:",
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
            "No funeral-home information is available for this Living MyEMemorial.",
        },
        { status: 409 }
      );
    }

    /*
     * Determine which funeral home is currently
     * eligible to verify the death.
     *
     * Primary is used unless it was marked
     * unavailable and the Alternate was
     * activated.
     */
    const alternateIsActive =
      Boolean(
        settings.primary_funeral_home_unavailable_at
      ) &&
      Boolean(
        settings.alternate_funeral_home_activated_at
      );

    const expectedFuneralHomeType =
      alternateIsActive
        ? "alternate"
        : "primary";

    if (
      funeralHomeType !==
      expectedFuneralHomeType
    ) {
      return NextResponse.json(
        {
          error:
            "This funeral home is not the currently active funeral home for this Living MyEMemorial.",
        },
        { status: 403 }
      );
    }

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
     * We require the funeral home to have
     * previously acknowledged the owner's
     * preference notice.
     *
     * Acknowledgement itself is NOT proof of
     * death. It only establishes the funeral
     * home contact before this separate
     * verification request can be accepted.
     */
    if (!acknowledgedAt) {
      return NextResponse.json(
        {
          error:
            "This funeral home has not previously acknowledged the owner's funeral-home preference.",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const {
      error: verificationError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .update({
        death_verified_at: now,
        death_verified_by_funeral_home:
          funeralHomeName,
        updated_at: now,
      })
      .eq("memorial_id", memorialId);

    if (verificationError) {
      console.error(
        "DEATH VERIFICATION SAVE ERROR:",
        verificationError
      );

      return NextResponse.json(
        { error: verificationError.message },
        { status: 500 }
      );
    }

    /*
     * IMPORTANT:
     *
     * This route verifies death only.
     *
     * It does NOT set:
     * post_death_access_unlocked_at
     *
     * Actual Backup Person unlock remains a
     * separate controlled action in #7.
     */
    return NextResponse.json({
      success: true,
      alreadyVerified: false,
      memorialName:
        memorial.full_name ||
        "this Living MyEMemorial",
      funeralHomeName,
      deathVerifiedAt: now,
      postDeathUnlocked: false,
    });
  } catch (error) {
    console.error(
      "VERIFY DEATH API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The death could not be verified.",
      },
      { status: 500 }
    );
  }
}