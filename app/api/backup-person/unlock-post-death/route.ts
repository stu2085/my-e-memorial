import {
  NextRequest,
  NextResponse,
} from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const memorialId = Number(
      body?.memorialId
    );

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

    /*
     * Confirm this is the authorized
     * Backup Person session.
     */
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${memorialId}`,
      req.url
    );

    const accessCheckResponse =
      await fetch(accessCheckUrl, {
        method: "GET",
        headers: {
          cookie:
            req.headers.get("cookie") || "",
        },
        cache: "no-store",
      });

    const accessCheckResult =
      await accessCheckResponse.json();

    if (
      !accessCheckResponse.ok ||
      accessCheckResult?.valid !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Authorized Backup Person access is required.",
        },
        { status: 403 }
      );
    }

    /*
     * Confirm this is still a
     * Living MyEMemorial.
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
        {
          error: "Memorial not found.",
        },
        { status: 404 }
      );
    }

    if (
      memorial.is_living_preplan !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Post-death access is only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    /*
     * Load ONLY the fields required to
     * decide whether post-death access
     * may be unlocked.
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
        "POST-DEATH UNLOCK LOAD ERROR:",
        handoffError
      );

      return NextResponse.json(
        {
          error: handoffError.message,
        },
        { status: 500 }
      );
    }

    if (!handoff?.death_reported_at) {
      return NextResponse.json(
        {
          error:
            "A death report has not been submitted.",
        },
        { status: 409 }
      );
    }

    if (
      !handoff.death_verified_at ||
      !String(
        handoff.death_verified_by_funeral_home ||
          ""
      ).trim()
    ) {
      return NextResponse.json(
        {
          error:
            "The death has not yet been independently verified.",
        },
        { status: 409 }
      );
    }

    /*
     * Repeated requests are harmless.
     */
    if (
      handoff.post_death_access_unlocked_at
    ) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        postDeathAccessUnlockedAt:
          handoff.post_death_access_unlocked_at,
      });
    }

    const now =
      new Date().toISOString();

    /*
     * Set ONLY the post-death unlock
     * timestamp.
     *
     * Do not alter the report or
     * verification evidence.
     */
    const {
      error: unlockError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .update({
        post_death_access_unlocked_at:
          now,
        updated_at: now,
      })
      .eq("memorial_id", memorialId)
      .not("death_verified_at", "is", null)
      .not(
        "death_verified_by_funeral_home",
        "is",
        null
      );

    if (unlockError) {
      console.error(
        "POST-DEATH UNLOCK SAVE ERROR:",
        unlockError
      );

      return NextResponse.json(
        {
          error: unlockError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyUnlocked: false,
      memorialName:
        memorial.full_name ||
        "this Living MyEMemorial",
      postDeathAccessUnlockedAt: now,
    });
  } catch (error) {
    console.error(
      "POST-DEATH UNLOCK API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Post-death access could not be unlocked.",
      },
      { status: 500 }
    );
  }
}