import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug")?.trim();

    if (!slug) {
      return NextResponse.json(
        { error: "Missing memorial slug." },
        { status: 400 }
      );
    }

    const { data: memorial, error } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, slug, full_name, owner_id, plan, extra_video_minutes, is_living_preplan"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    /*
     * A Living MyEMemorial changes is_living_preplan to false
     * after verified post-death publication. Backup Person access
     * must continue to work for that converted memorial, but only
     * after independent death verification AND explicit post-death
     * access activation have both been recorded.
     *
     * Ordinary deceased memorials, or converted memorials without
     * both security milestones, remain unavailable here.
     */
    if (memorial.is_living_preplan !== true) {
      const {
        data: legacyAccess,
        error: legacyAccessError,
      } = await supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(
          "death_verified_at, post_death_access_unlocked_at"
        )
        .eq("memorial_id", memorial.id)
        .maybeSingle();

      if (legacyAccessError) {
        console.error(
          "BACKUP MEMORIAL POST-DEATH LOOKUP ERROR:",
          legacyAccessError
        );

        return NextResponse.json(
          { error: "Backup access could not be completed." },
          { status: 500 }
        );
      }

      const verifiedPostDeathPersonal =
        Boolean(legacyAccess?.death_verified_at) &&
        Boolean(legacyAccess?.post_death_access_unlocked_at);

      if (!verifiedPostDeathPersonal) {
        return NextResponse.json(
          { error: "Backup access is not available for this memorial." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      memorial: {
        id: memorial.id,
        slug: memorial.slug,
        full_name: memorial.full_name,
        owner_id: memorial.owner_id,
        plan: memorial.plan,
        extra_video_minutes: memorial.extra_video_minutes,
        is_living_preplan: memorial.is_living_preplan,
      },
    });
  } catch (error) {
    console.error(
      "BACKUP MEMORIAL LOOKUP ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}