import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

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

    const body = await req.json();
    const memorialId = Number(body?.memorialId);

    if (!Number.isFinite(memorialId) || memorialId <= 0) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, owner_id, is_living_preplan")
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
            "Only the Living MyEMemorial owner can cancel a death report.",
        },
        { status: 403 }
      );
    }

    if (memorial.is_living_preplan !== true) {
      return NextResponse.json(
        {
          error:
            "This action is only available for Living MyEMemorials.",
        },
        { status: 400 }
      );
    }

    const { data: handoff, error: handoffError } =
      await supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(`
          memorial_id,
          death_reported_at,
          death_verified_at,
          post_death_access_unlocked_at
        `)
        .eq("memorial_id", memorialId)
        .maybeSingle();

    if (handoffError) {
      console.error(
        "CANCEL DEATH REPORT LOAD ERROR:",
        handoffError
      );

      return NextResponse.json(
        { error: handoffError.message },
        { status: 500 }
      );
    }

    if (!handoff?.death_reported_at) {
      return NextResponse.json({
        success: true,
        alreadyCleared: true,
      });
    }

    if (
      handoff.death_verified_at ||
      handoff.post_death_access_unlocked_at
    ) {
      return NextResponse.json(
        {
          error:
            "This death report can no longer be cancelled automatically because verification or post-death access has already been completed.",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { error: clearError } =
      await supabaseAdmin
        .from("memorial_legacy_handoff")
        .update({
          death_reported_at: null,
          death_reported_by: null,
          death_report_note: null,
          updated_at: now,
        })
        .eq("memorial_id", memorialId);

    if (clearError) {
      console.error(
        "CANCEL DEATH REPORT SAVE ERROR:",
        clearError
      );

      return NextResponse.json(
        { error: clearError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyCleared: false,
      message:
        "The pending death report has been cancelled.",
    });
  } catch (error) {
    console.error(
      "CANCEL DEATH REPORT API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}