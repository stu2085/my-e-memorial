import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { memorialId } = await req.json();

    if (!memorialId) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    /*
     * #14: Delegate Backup Person session validation to
     * the central hardened validator. This enforces the
     * current Primary / Secondary identity, failover state,
     * expiration, and identity-bound signature.
     */
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${encodeURIComponent(
        String(memorialId)
      )}`,
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
            "Authorized Backup Person access is required.",
        },
        { status: 403 }
      );
    }

    /*
     * Load the memorial again on the server.
     * Publication is allowed only for an existing
     * Living MyEMemorial with a date of death.
     */
    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select(
          "id, slug, is_living_preplan, is_published, death_date"
        )
        .eq("id", memorialId)
        .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (!memorial.is_living_preplan) {
      return NextResponse.json(
        {
          error:
            "This memorial is no longer a Living MyEMemorial.",
        },
        { status: 400 }
      );
    }

    if (!memorial.death_date) {
      return NextResponse.json(
        {
          error:
            "A date of death must be entered before the memorial can be published.",
        },
        { status: 400 }
      );
    }

    /*
     * Publishing is a post-death action. A death report
     * or a date of death alone is not enough; independent
     * verification must already have unlocked post-death
     * Backup Person access.
     */
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
        "BACKUP PUBLISH POST-DEATH ACCESS CHECK ERROR:",
        legacyAccessError
      );

      return NextResponse.json(
        {
          error:
            "Post-death access could not be verified.",
        },
        { status: 500 }
      );
    }

    const deathVerified =
      Boolean(legacyAccess?.death_verified_at);

    const postDeathUnlocked =
      Boolean(
        legacyAccess?.post_death_access_unlocked_at
      );

    if (!deathVerified || !postDeathUnlocked) {
      return NextResponse.json(
        {
          error:
            "This Living MyEMemorial cannot be published until the death has been independently verified and post-death Backup Person access has been unlocked.",
        },
        { status: 403 }
      );
    }

    /*
     * Explicit after-death conversion.
     *
     * This is intentionally separate from normal saving.
     * Ordinary Guided Flow saves still keep a Personal
     * E-Memorial private.
     */
    const { error: updateError } = await supabaseAdmin
      .from("memorials")
      .update({
        is_living_preplan: false,
        is_published: true,
        is_draft: false,
        guided_current_chapter: null,
      })
      .eq("id", memorial.id)
      .eq("is_living_preplan", true);

    if (updateError) {
      console.error(
        "BACKUP PUBLISH UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        { error: "The memorial could not be published." },
        { status: 500 }
      );
    }

    /*
     * Keep the hardened Backup Person session after publication.
     * The authorized Backup Person still needs post-death access
     * for funeral presentation, approved updates, visitor
     * contributions, and Primary / Secondary succession.
     */
    return NextResponse.json({
      success: true,
      slug: memorial.slug,
    });
  } catch (error) {
    console.error(
      "BACKUP PUBLISH API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}