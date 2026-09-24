import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const PRESERVED_EXPIRATION = "9999-12-31T23:59:59.000Z";
const EDIT_COOKIE_DAYS = 60;
const MAX_MUSIC_TRACKS = 5;

type ImportedPhoto = {
  url: string;
  caption: string;
  attribution: string;
  source: "creator" | "contributor";
  submittedByName: string | null;
};

type ImportedVideo = {
  playbackId: string;
  caption: string;
  attribution: string;
  source: "creator" | "contributor";
  submittedByName: string | null;
  durationSeconds: number | null;
};

type ResolvedVideo = ImportedVideo & {
  assetId: string;
  durationSeconds: number | null;
};

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPrivateToken() {
  return randomBytes(32).toString("hex");
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
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
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall through to legacy comma-separated data.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCaptionList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? item.trim() : ""
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
        typeof item === "string" ? item.trim() : ""
      );
    }
  } catch {
    // Fall through to legacy comma-separated data.
  }

  return value.split(",").map((item) => item.trim());
}

function trimCaption(value: unknown) {
  return normalizeText(value).slice(0, 35);
}

function isYoutubeUrl(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");

    return (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}

function dedupePhotos(photos: ImportedPhoto[]) {
  const byUrl = new Map<string, ImportedPhoto>();

  for (const photo of photos) {
    const key = photo.url.trim();

    if (!key) {
      continue;
    }

    const existing = byUrl.get(key);

    if (!existing) {
      byUrl.set(key, photo);
      continue;
    }

    if (!existing.caption && photo.caption) {
      byUrl.set(key, {
        ...existing,
        caption: photo.caption,
      });
    }
  }

  return [...byUrl.values()];
}

function dedupeVideos(videos: ImportedVideo[]) {
  const seen = new Set<string>();

  return videos.filter((video) => {
    const key = video.playbackId.trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function muxGet(path: string) {
  const tokenId = process.env.MUX_TOKEN_ID || "";
  const tokenSecret = process.env.MUX_TOKEN_SECRET || "";

  if (!tokenId || !tokenSecret) {
    throw new Error("Video service is not configured.");
  }

  const authorization =
    "Basic " +
    Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");

  let lastError = "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.mux.com/video/v1${path}`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      return result;
    }

    lastError = String(
      result?.error?.message ||
        result?.message ||
        `Mux request failed with status ${response.status}.`
    );

    if (response.status !== 429 || attempt === 2) {
      throw new Error(lastError);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 400 * (attempt + 1))
    );
  }

  throw new Error(lastError || "Mux request failed.");
}

async function resolveMuxVideo(
  video: ImportedVideo
): Promise<ResolvedVideo> {
  const playbackId = video.playbackId.trim();

  const lookup = await muxGet(
    `/playback-ids/${encodeURIComponent(playbackId)}`
  );

  const objectType = String(lookup?.data?.object?.type || "");
  const assetId = String(lookup?.data?.object?.id || "").trim();

  if (objectType !== "asset" || !assetId) {
    throw new Error(
      `A saved MyEMemorial video could not be matched to its Mux asset (${playbackId}).`
    );
  }

  const assetResult = await muxGet(
    `/assets/${encodeURIComponent(assetId)}`
  );

  const asset = assetResult?.data || {};
  const duration = Number(asset?.duration || 0);

  return {
    ...video,
    assetId,
    durationSeconds:
      Number.isFinite(duration) && duration > 0
        ? Math.ceil(duration)
        : video.durationSeconds,
  };
}

function setEditCookie(
  response: NextResponse,
  publicId: string,
  token: string,
  req: NextRequest
) {
  response.cookies.set({
    name: `celebration_edit_${publicId}`,
    value: token,
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: EDIT_COOKIE_DAYS * 24 * 60 * 60,
  });

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
}

async function reopenExistingPresentation(
  req: NextRequest,
  presentation: {
    id: number;
    public_id: string;
    claimed_by: string | null;
    status: string;
    payment_status: string;
    expires_at: string | null;
  },
  userId: string
) {
  if (presentation.claimed_by !== userId) {
    return NextResponse.json(
      {
        error:
          "The connected Celebration Presentation belongs to a different account.",
      },
      { status: 403 }
    );
  }

  if (
    presentation.status !== "active" ||
    presentation.payment_status !== "paid" ||
    !presentation.expires_at ||
    new Date(presentation.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json(
      {
        error:
          "The connected Celebration Presentation is not currently active.",
      },
      { status: 409 }
    );
  }

  const editToken = createPrivateToken();
  const editTokenHash = hashToken(editToken);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("celebration_presentations")
    .update({
      edit_token_hash: editTokenHash,
    })
    .eq("id", presentation.id)
    .eq("claimed_by", userId)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json(
      {
        error: "The Presentation Builder could not be opened.",
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    success: true,
    alreadyExists: true,
    publicId: presentation.public_id,
    url: `/celebration-of-life-slideshow/create/${presentation.public_id}`,
  });

  setEditCookie(
    response,
    presentation.public_id,
    editToken,
    req
  );

  return response;
}

export async function POST(req: NextRequest) {
  let createdPresentationId: number | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const memorialId = Number(body?.memorialId);

    if (!Number.isInteger(memorialId) || memorialId <= 0) {
      return NextResponse.json(
        { error: "A valid MyEMemorial ID is required." },
        { status: 400 }
      );
    }

    const authorization = req.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Please sign in again before creating the Presentation.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user?.id || !user.email) {
      return NextResponse.json(
        {
          error:
            "Your sign-in session could not be verified.",
        },
        { status: 401 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select(`
          id,
          owner_id,
          full_name,
          birth_date,
          death_date,
          featured_photo_url,
          gallery_photos,
          gallery_photo_captions,
          video_urls,
          video_notes,
          favorite_song_url,
          favorite_song_urls,
          favorite_song_notes,
          funeral_presentation_music_source,
          is_living_preplan,
          plan,
          payment_status
        `)
        .eq("id", memorialId)
        .maybeSingle();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "MyEMemorial not found." },
        { status: 404 }
      );
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Only the MyEMemorial owner can create its Presentation.",
        },
        { status: 403 }
      );
    }

    if (memorial.is_living_preplan === true) {
      return NextResponse.json(
        {
          error:
            "Celebration of Life Presentations are included with Departed MyEMemorials.",
        },
        { status: 400 }
      );
    }

    const paidPlan =
      memorial.plan === "basic" ||
      memorial.plan === "plus" ||
      memorial.plan === "premium";

    const entitledPaymentStatus =
      memorial.payment_status === "paid" ||
      memorial.payment_status === "free_beta";

    if (!paidPlan || !entitledPaymentStatus) {
      return NextResponse.json(
        {
          error:
            "A Basic, Plus, or Premium Departed MyEMemorial is required.",
        },
        { status: 403 }
      );
    }

    /*
     * Idempotency: if this MyEMemorial already has its single Presentation,
     * open that same Presentation rather than creating another one.
     */
    const {
      data: existingPresentation,
      error: existingError,
    } = await supabaseAdmin
      .from("celebration_presentations")
      .select(
        "id, public_id, claimed_by, status, payment_status, expires_at"
      )
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "INCLUDED PRESENTATION LOOKUP ERROR:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            "The connected Celebration Presentation could not be checked.",
        },
        { status: 500 }
      );
    }

    if (existingPresentation) {
      return reopenExistingPresentation(
        req,
        existingPresentation,
        user.id
      );
    }

    const [
      memorialVideosResult,
      approvedSubmissionsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("memorial_videos")
        .select(
          "playback_id, duration_seconds, note, sort_order"
        )
        .eq("memorial_id", memorialId)
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("memorial_submissions")
        .select(
          "submitter_name, message, photo_urls, video_urls, created_at"
        )
        .eq("memorial_id", memorialId)
        .eq("status", "approved")
        .order("created_at", { ascending: true }),
    ]);

    if (memorialVideosResult.error) {
      console.error(
        "INCLUDED PRESENTATION VIDEO LOAD ERROR:",
        memorialVideosResult.error
      );

      return NextResponse.json(
        {
          error:
            "The MyEMemorial videos could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (approvedSubmissionsResult.error) {
      console.error(
        "INCLUDED PRESENTATION CONTRIBUTION LOAD ERROR:",
        approvedSubmissionsResult.error
      );

      return NextResponse.json(
        {
          error:
            "Approved family contributions could not be loaded.",
        },
        { status: 500 }
      );
    }

    const approvedSubmissions =
      approvedSubmissionsResult.data || [];

    const galleryPhotoUrls =
      parseStringList(memorial.gallery_photos);

    const galleryPhotoCaptions =
      parseCaptionList(memorial.gallery_photo_captions);

    const photos = dedupePhotos([
      {
        url: normalizeText(memorial.featured_photo_url),
        caption: "",
        attribution: "",
        source: "creator",
        submittedByName: null,
      },
      ...galleryPhotoUrls.map((url, index) => ({
        url,
        caption: trimCaption(
          galleryPhotoCaptions[index] || ""
        ),
        attribution: "",
        source: "creator" as const,
        submittedByName: null,
      })),
      ...approvedSubmissions.flatMap((submission) => {
        const submitterName = normalizeText(
          submission.submitter_name
        );

        return parseStringList(
          submission.photo_urls
        ).map((url) => ({
          url,
          caption: trimCaption(submission.message),
          attribution: submitterName,
          source: "contributor" as const,
          submittedByName: submitterName || null,
        }));
      }),
    ]);

    const structuredVideos: ImportedVideo[] =
      (memorialVideosResult.data || [])
        .map((video) => ({
          playbackId: normalizeText(video.playback_id),
          caption: trimCaption(video.note),
          attribution: "",
          source: "creator" as const,
          submittedByName: null,
          durationSeconds:
            Number(video.duration_seconds || 0) > 0
              ? Number(video.duration_seconds)
              : null,
        }))
        .filter((video) => Boolean(video.playbackId));

    const legacyVideoIds =
      parseStringList(memorial.video_urls);

    const legacyVideoNotes =
      parseCaptionList(memorial.video_notes);

    const legacyVideos: ImportedVideo[] =
      legacyVideoIds.map((playbackId, index) => ({
        playbackId,
        caption: trimCaption(
          legacyVideoNotes[index] || ""
        ),
        attribution: "",
        source: "creator",
        submittedByName: null,
        durationSeconds: null,
      }));

    const contributionVideos: ImportedVideo[] =
      approvedSubmissions.flatMap((submission) => {
        const submitterName = normalizeText(
          submission.submitter_name
        );

        return parseStringList(
          submission.video_urls
        ).map((playbackId) => ({
          playbackId,
          caption: trimCaption(submission.message),
          attribution: submitterName,
          source: "contributor" as const,
          submittedByName: submitterName || null,
          durationSeconds: null,
        }));
      });

    const videosToResolve = dedupeVideos([
      ...structuredVideos,
      ...legacyVideos,
      ...contributionVideos,
    ]);

    /*
     * Offline MP4 rendering needs the Mux Asset ID, while the existing
     * MyEMemorial stores Playback IDs. Resolve each existing Playback ID
     * back to its Asset ID without re-uploading or duplicating the video.
     */
    const resolvedVideos: ResolvedVideo[] = [];

    for (const video of videosToResolve) {
      resolvedVideos.push(
        await resolveMuxVideo(video)
      );
    }

    const canonicalFavoriteSongs =
      parseStringList(memorial.favorite_song_urls);

    const legacyFavoriteSong =
      normalizeText(memorial.favorite_song_url);

    const favoriteSongNotes =
      parseCaptionList(memorial.favorite_song_notes);

    const useFavoriteSongs =
      memorial.funeral_presentation_music_source !==
      "funeral_home";

    const favoriteSongs = useFavoriteSongs
      ? [
          ...new Set(
            (
              canonicalFavoriteSongs.length > 0
                ? canonicalFavoriteSongs
                : legacyFavoriteSong
                  ? [legacyFavoriteSong]
                  : []
            ).filter(Boolean)
          ),
        ].slice(0, MAX_MUSIC_TRACKS)
      : [];

    const now = new Date().toISOString();
    const editToken = createPrivateToken();
    const editTokenHash = hashToken(editToken);

    const {
      data: createdPresentation,
      error: createError,
    } = await supabaseAdmin
      .from("celebration_presentations")
      .insert({
        customer_email: user.email.trim().toLowerCase(),
        person_name:
          normalizeText(memorial.full_name) ||
          "MyEMemorial",
        birth_date: memorial.birth_date || null,
        death_date: memorial.death_date || null,
        featured_photo_url:
          normalizeText(memorial.featured_photo_url) ||
          null,
        theme: "classic",
        status: "active",
        payment_status: "paid",
        price_cents: 0,
        amount_paid_cents: 0,
        hosting_days: 60,
        edit_token_hash: editTokenHash,
        contributions_enabled: false,
        activated_at: now,
        expires_at: PRESERVED_EXPIRATION,
        claimed_by: user.id,
        claimed_at: now,
        memorial_id: memorialId,
        converted_memorial_id: memorialId,
        converted_at: now,
        offline_backup_status: "not_requested",
      })
      .select("id, public_id")
      .single();

    if (createError || !createdPresentation) {
      console.error(
        "CREATE INCLUDED PRESENTATION ERROR:",
        createError
      );

      /*
       * A simultaneous request may have created the same MyEMemorial's
       * Presentation first. Re-read before returning an error.
       */
      const { data: racedPresentation } =
        await supabaseAdmin
          .from("celebration_presentations")
          .select(
            "id, public_id, claimed_by, status, payment_status, expires_at"
          )
          .eq("memorial_id", memorialId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

      if (racedPresentation) {
        return reopenExistingPresentation(
          req,
          racedPresentation,
          user.id
        );
      }

      return NextResponse.json(
        {
          error:
            "The Celebration Presentation could not be created.",
        },
        { status: 500 }
      );
    }

    createdPresentationId = Number(
      createdPresentation.id
    );

    let sortOrder = 0;

    const itemRows = [
      ...photos.map((photo) => ({
        presentation_id: createdPresentationId,
        item_type: "photo",
        photo_url: photo.url,
        storage_path: null,
        mux_asset_id: null,
        mux_playback_id: null,
        caption: trimCaption(photo.caption),
        attribution: photo.attribution,
        submitted_by_name: photo.submittedByName,
        source: photo.source,
        approval_status: "approved",
        sort_order: sortOrder++,
        duration_seconds: null,
      })),
      ...resolvedVideos.map((video) => ({
        presentation_id: createdPresentationId,
        item_type: "video",
        photo_url: null,
        storage_path: null,
        mux_asset_id: video.assetId,
        mux_playback_id: video.playbackId,
        caption: trimCaption(video.caption),
        attribution: video.attribution,
        submitted_by_name: video.submittedByName,
        source: video.source,
        approval_status: "approved",
        sort_order: sortOrder++,
        duration_seconds: video.durationSeconds,
      })),
    ];

    if (itemRows.length > 0) {
      const { error: itemInsertError } =
        await supabaseAdmin
          .from("celebration_presentation_items")
          .insert(itemRows);

      if (itemInsertError) {
        throw itemInsertError;
      }
    }

    if (favoriteSongs.length > 0) {
      const musicRows = favoriteSongs.map(
        (sourceUrl, index) => ({
          presentation_id: createdPresentationId,
          source_type: isYoutubeUrl(sourceUrl)
            ? "youtube"
            : "uploaded",
          source_url: sourceUrl,
          storage_path: null,
          title:
            normalizeText(
              favoriteSongNotes[index]
            ) || `Favorite Song ${index + 1}`,
          artist: "",
          sort_order: index,
        })
      );

      const { error: musicInsertError } =
        await supabaseAdmin
          .from("celebration_presentation_music")
          .insert(musicRows);

      if (musicInsertError) {
        throw musicInsertError;
      }
    }

    const response = NextResponse.json({
      success: true,
      alreadyExists: false,
      publicId: createdPresentation.public_id,
      url:
        `/celebration-of-life-slideshow/create/` +
        `${createdPresentation.public_id}`,
      imported: {
        photos: photos.length,
        videos: resolvedVideos.length,
        music: favoriteSongs.length,
      },
    });

    setEditCookie(
      response,
      createdPresentation.public_id,
      editToken,
      req
    );

    return response;
  } catch (error) {
    console.error(
      "CREATE PRESENTATION FROM MYEMEMORIAL ERROR:",
      error
    );

    /*
     * If creation got as far as the parent row but a child import failed,
     * remove the new Presentation. Cascades remove imported items/music,
     * leaving the MyEMemorial untouched and allowing a clean retry.
     */
    if (createdPresentationId) {
      const { error: cleanupError } =
        await supabaseAdmin
          .from("celebration_presentations")
          .delete()
          .eq("id", createdPresentationId);

      if (cleanupError) {
        console.error(
          "INCLUDED PRESENTATION CLEANUP ERROR:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Celebration Presentation could not be created.",
      },
      { status: 500 }
    );
  }
}
