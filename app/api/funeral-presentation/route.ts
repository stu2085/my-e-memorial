import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const PRESENTATION_LINK_LIFETIME_MS =
  7 * 24 * 60 * 60 * 1000;

function getPresentationSecret() {
  return (
    process.env.FUNERAL_PRESENTATION_SECRET ||
    process.env.BACKUP_ACCESS_SECRET ||
    ""
  );
}

function parseStringList(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall through to comma-separated legacy data.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCaptionList(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string"
        ? item.trim()
        : ""
    );
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.map((item) =>
        typeof item === "string"
          ? item.trim()
          : ""
      );
    }
  } catch {
    // Fall through to legacy comma-separated data.
  }

  return value
    .split(",")
    .map((item) => item.trim());
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

type PresentationPhoto = {
  url: string;
  caption: string;
  attribution: string;
};

function dedupePhotos(
  photos: PresentationPhoto[]
) {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    const url = photo.url.trim();

    if (!url || seen.has(url)) {
      return false;
    }

    seen.add(url);
    return true;
  });
}

function signaturesMatch(
  supplied: string,
  expected: string
) {
  const suppliedBuffer =
    Buffer.from(supplied, "utf8");
  const expectedBuffer =
    Buffer.from(expected, "utf8");

  return (
    suppliedBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      suppliedBuffer,
      expectedBuffer
    )
  );
}

function createPresentationToken(
  memorialId: number,
  expiresAt: number
) {
  const secret = getPresentationSecret();

  if (!secret) {
    throw new Error(
      "Funeral presentation links are not configured."
    );
  }

  const signature = createHmac(
    "sha256",
    secret
  )
    .update(`${memorialId}:${expiresAt}`)
    .digest("hex");

  return `${memorialId}.${expiresAt}.${signature}`;
}

function verifyPresentationToken(
  token: string,
  expectedMemorialId: number
) {
  const secret = getPresentationSecret();

  if (!secret) {
    return false;
  }

  const [
    memorialIdValue,
    expiresAtValue,
    suppliedSignature,
  ] = String(token || "").split(".");

  const memorialId = Number(memorialIdValue);
  const expiresAt = Number(expiresAtValue);

  if (
    !Number.isFinite(memorialId) ||
    memorialId !== expectedMemorialId ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    !suppliedSignature
  ) {
    return false;
  }

  const expectedSignature = createHmac(
    "sha256",
    secret
  )
    .update(`${memorialId}:${expiresAt}`)
    .digest("hex");

  return signaturesMatch(
    suppliedSignature,
    expectedSignature
  );
}

async function hasBackupAccess(
  req: NextRequest,
  memorialId: number
) {
  try {
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

    const result =
      await accessCheckResponse.json();

    return (
      accessCheckResponse.ok &&
      result?.valid === true
    );
  } catch (error) {
    console.error(
      "FUNERAL PRESENTATION BACKUP ACCESS ERROR:",
      error
    );
    return false;
  }
}

async function isPostDeathUnlocked(
  memorialId: number
) {
  const {
    data: handoff,
    error,
  } = await supabaseAdmin
    .from("memorial_legacy_handoff")
    .select(
      "post_death_access_unlocked_at"
    )
    .eq("memorial_id", memorialId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(
    handoff?.post_death_access_unlocked_at
  );
}

export async function POST(
  req: NextRequest
) {
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

    const backupAllowed =
      await hasBackupAccess(
        req,
        memorialId
      );

    if (!backupAllowed) {
      return NextResponse.json(
        {
          error:
            "Authorized Backup Person access is required.",
        },
        { status: 403 }
      );
    }

    const postDeathUnlocked =
      await isPostDeathUnlocked(memorialId);

    if (!postDeathUnlocked) {
      return NextResponse.json(
        {
          error:
            "Celebration of Life Presentation is available only after verified post-death access has been unlocked.",
        },
        { status: 403 }
      );
    }

    const {
      data: memorial,
      error: memorialError,
    } = await supabaseAdmin
      .from("memorials")
      .select("id, slug")
      .eq("id", memorialId)
      .maybeSingle();

    if (
      memorialError ||
      !memorial
    ) {
      return NextResponse.json(
        {
          error: "Memorial not found.",
        },
        { status: 404 }
      );
    }

    const expiresAt =
      Date.now() +
      PRESENTATION_LINK_LIFETIME_MS;

    const token =
      createPresentationToken(
        memorial.id,
        expiresAt
      );

    const url =
      `${req.nextUrl.origin}` +
      `/memorial/${encodeURIComponent(
        memorial.slug
      )}/presentation` +
      `?token=${encodeURIComponent(
        token
      )}`;

    return NextResponse.json({
      success: true,
      url,
      expiresAt:
        new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error(
      "FUNERAL PRESENTATION LINK API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The funeral home presentation link could not be created.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    const slug = String(
      req.nextUrl.searchParams.get(
        "slug"
      ) || ""
    ).trim();

    const token = String(
      req.nextUrl.searchParams.get(
        "token"
      ) || ""
    ).trim();

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "A memorial slug is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: memorial,
      error: memorialError,
    } = await supabaseAdmin
      .from("memorials")
      .select(
        `
          id,
          slug,
          full_name,
          featured_photo_url,
          gallery_photos,
          gallery_photo_captions,
          video_urls,
          favorite_song_url,
          favorite_song_urls,
          funeral_presentation_music_source,
          is_published,
          is_living_preplan
        `
      )
      .eq("slug", slug)
      .maybeSingle();

    if (
      memorialError ||
      !memorial
    ) {
      return NextResponse.json(
        {
          error: "Memorial not found.",
        },
        { status: 404 }
      );
    }

    const isPublicMemorial =
      memorial.is_published === true &&
      memorial.is_living_preplan !== true;

    let authorized =
      isPublicMemorial;

    if (
      !authorized &&
      token &&
      verifyPresentationToken(
        token,
        memorial.id
      )
    ) {
      authorized = true;
    }

    if (!authorized) {
      authorized =
        await hasBackupAccess(
          req,
          memorial.id
        );
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "This Celebration of Life Presentation is not available.",
        },
        { status: 403 }
      );
    }

    if (!isPublicMemorial) {
      const postDeathUnlocked =
        await isPostDeathUnlocked(
          memorial.id
        );

      if (!postDeathUnlocked) {
        return NextResponse.json(
          {
            error:
              "Celebration of Life Presentation is available only after verified post-death access has been unlocked.",
          },
          { status: 403 }
        );
      }
    }

    const {
      data: memorialVideos,
      error: videosError,
    } = await supabaseAdmin
      .from("memorial_videos")
      .select(
        "playback_id, sort_order"
      )
      .eq(
        "memorial_id",
        memorial.id
      )
      .order(
        "sort_order",
        { ascending: true }
      );

    if (videosError) {
      console.error(
        "FUNERAL PRESENTATION VIDEO LOAD ERROR:",
        videosError
      );
    }

    const {
      data: approvedSubmissions,
      error: submissionsError,
    } = await supabaseAdmin
      .from("memorial_submissions")
      .select(
        "submitter_name, message, photo_urls, video_urls, created_at"
      )
      .eq(
        "memorial_id",
        memorial.id
      )
      .eq("status", "approved")
      .order(
        "created_at",
        { ascending: true }
      );

    if (submissionsError) {
      console.error(
        "FUNERAL PRESENTATION CONTRIBUTION LOAD ERROR:",
        submissionsError
      );
    }

    const galleryPhotoUrls =
      parseStringList(
        memorial.gallery_photos
      );

    const galleryPhotoCaptions =
      parseCaptionList(
        memorial.gallery_photo_captions
      );

    const ownerPhotos: PresentationPhoto[] = [
      {
        url: String(
          memorial.featured_photo_url ||
            ""
        ).trim(),
        caption: "",
        attribution: "",
      },
      ...galleryPhotoUrls.map(
        (url, index) => ({
          url,
          caption:
            galleryPhotoCaptions[
              index
            ] || "",
          attribution: "",
        })
      ),
    ];

    const contributionPhotos: PresentationPhoto[] =
      (approvedSubmissions || [])
        .flatMap((submission) =>
          parseStringList(
            submission.photo_urls
          ).map((url) => ({
            url,
            caption: String(
              submission.message || ""
            ).trim(),
            attribution: String(
              submission.submitter_name ||
                ""
            ).trim(),
          }))
        );

    const structuredVideoIds =
      (memorialVideos || [])
        .map((video) =>
          String(
            video.playback_id || ""
          ).trim()
        )
        .filter(Boolean);

    const legacyVideoIds =
      parseStringList(
        memorial.video_urls
      );

    const contributionVideoIds =
      (approvedSubmissions || [])
        .flatMap((submission) =>
          parseStringList(
            submission.video_urls
          )
        );

    const photos = dedupePhotos([
      ...ownerPhotos,
      ...contributionPhotos,
    ]);

    const videos = dedupe([
      ...structuredVideoIds,
      ...legacyVideoIds,
      ...contributionVideoIds,
    ]);

    /*
     * Favorite Songs use the same canonical behavior as the
     * public memorial slideshow: the multi-song array is the
     * source of truth when present, with the legacy single-song
     * field retained only as backward compatibility.
     */
    const canonicalFavoriteSongs =
      parseStringList(
        memorial.favorite_song_urls
      );

    const legacyFavoriteSong = String(
      memorial.favorite_song_url || ""
    ).trim();

    const funeralPresentationMusicSource =
      memorial.funeral_presentation_music_source === "funeral_home"
        ? "funeral_home"
        : "favorite_songs";

    const favoriteSongs =
      funeralPresentationMusicSource === "favorite_songs"
        ? dedupe(
            canonicalFavoriteSongs.length > 0
              ? canonicalFavoriteSongs
              : legacyFavoriteSong
                ? [legacyFavoriteSong]
                : []
          ).slice(0, 5)
        : [];

    return NextResponse.json({
      success: true,
      memorial: {
        id: memorial.id,
        slug: memorial.slug,
        fullName:
          memorial.full_name ||
          "Memorial",
        photos,
        videos,
        favoriteSongs,
        funeralPresentationMusicSource,
      },
    });
  } catch (error) {
    console.error(
      "FUNERAL PRESENTATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The Celebration of Life Presentation could not be loaded.",
      },
      { status: 500 }
    );
  }
}
