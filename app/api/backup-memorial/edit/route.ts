import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const memorialId =
      req.nextUrl.searchParams.get("memorialId");

    if (!memorialId) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    /*
     * #14: Delegate Backup Person session validation to
     * the central hardened validator. This keeps Primary /
     * Secondary identity, failover state, expiration, and
     * signature semantics consistent across all routes.
     */
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${encodeURIComponent(memorialId)}`,
      req.url
    );

    const accessCheckResponse = await fetch(accessCheckUrl, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "",
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
            "Authorized backup access is required.",
        },
        { status: 403 }
      );
    }

    const { data: memorial, error } =
  await supabaseAdmin
    .from("memorials")
  .select(`
  id,
  slug,
  owner_id,
  is_draft,
  is_published,
  is_living_preplan,
  first_name,
  middle_name,
  last_name,
  maiden_name,
  nickname,
  gender,
  birth_date,
  death_date,
  obituary,
  obituary_url,
  obituary_image_url,
  life_story,
  great_grandparents_names,
  grandparents_father_side,
  grandparents_mother_side,
  parents_names,
  siblings_names,
  spouse_names,
  children_names,
  grandchildren_names,
  great_grandchildren_names,
  places_lived,
  places_worked,
  schools_attended,
  awards_won,
  social_link_1,
  social_link_2,
  social_link_3,
  social_link_4,
  social_link_5,
  featured_photo_url,
  headstone_photo_1,
  headstone_photo_2,
  gallery_photos,
  gallery_photo_captions,
  newspaper_articles,
  video_urls,
  video_notes,
  video_link_urls,
  video_link_notes,
  video_link_thumbnail_urls,
  favorite_song_url,
  favorite_song_urls,
  favorite_song_notes,
  final_resting_type,
  cemetery_name,
  grave_section,
  grave_row,
  grave_plot,
  grave_lat,
  grave_lng,
  grave_directions,
  map_street,
  map_city,
  map_state,
  map_zip,
  map_country,
  ashes_location_description,
  plan,
  payment_status,
  guided_current_chapter,
  backup_person_name,
  backup_email,
  backup_street,
  backup_city,
  backup_state,
  backup_zip,
  creator_street,
  creator_city,
  creator_state,
  creator_zip,
  promotion_category
`)
    .eq("id", Number(memorialId))
    .maybeSingle();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

const { data: legacy, error: legacyError } =
  await supabaseAdmin
    .from("memorial_legacy_handoff")
    .select(
      "death_verified_at, post_death_access_unlocked_at"
    )
    .eq("memorial_id", Number(memorialId))
    .maybeSingle();

if (legacyError) {
  console.error(
    "BACKUP MEMORIAL LEGACY LOAD ERROR:",
    legacyError
  );

  return NextResponse.json(
    { error: legacyError.message },
    { status: 500 }
  );
}

/*
 * While the owner is living, a valid Backup Person may load the
 * Living MyEMemorial in read-only mode.
 *
 * After publication, is_living_preplan is false. In that state,
 * require the same independent-death-verification + post-death-unlock
 * conditions enforced by the central hardened validator before
 * returning any memorial editing data.
 */
if (
  memorial.is_living_preplan !== true &&
  (
    !legacy?.death_verified_at ||
    !legacy?.post_death_access_unlocked_at
  )
) {
  return NextResponse.json(
    {
      error:
        "Verified post-death Backup Person access is required for this published memorial.",
    },
    { status: 403 }
  );
}

return NextResponse.json({
  memorial,
});
  } catch (error) {
    console.error(
      "BACKUP MEMORIAL EDIT LOAD ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}