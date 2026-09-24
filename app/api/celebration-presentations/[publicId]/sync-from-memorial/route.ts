import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

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

type ExistingItem = {
  id: number;
  item_type: "photo" | "video";
  photo_url: string | null;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  caption: string | null;
  attribution: string | null;
  submitted_by_name: string | null;
  source: "creator" | "contributor";
  approval_status: string;
  sort_order: number | null;
  duration_seconds: number | null;
  removed_at: string | null;
};

type ExistingMusic = {
  id: number;
  source_type: "uploaded" | "youtube" | "library";
  source_url: string;
  storage_path: string | null;
  title: string | null;
  artist: string | null;
  sort_order: number | null;
  removed_at: string | null;
};

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function trimCaption(value: unknown) {
  return normalizeText(value).slice(0, 35);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashesMatch(suppliedHash: string, expectedHash: string) {
  const suppliedBuffer = Buffer.from(suppliedHash, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

function isValidPublicId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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
  video: ImportedVideo,
  existingAssetId?: string | null,
  existingDuration?: number | null
) {
  if (existingAssetId) {
    return {
      assetId: existingAssetId,
      durationSeconds:
        existingDuration && existingDuration > 0
          ? existingDuration
          : video.durationSeconds,
    };
  }

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

  const duration = Number(assetResult?.data?.duration || 0);

  return {
    assetId,
    durationSeconds:
      Number.isFinite(duration) && duration > 0
        ? Math.ceil(duration)
        : video.durationSeconds,
  };
}

function stringsEqual(a: unknown, b: unknown) {
  return normalizeText(a) === normalizeText(b);
}

function nullableNumberEqual(a: unknown, b: unknown) {
  const left = Number(a || 0);
  const right = Number(b || 0);

  if (left <= 0 && right <= 0) {
    return true;
  }

  return left === right;
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  try {
    const { publicId } = await context.params;

    if (!isValidPublicId(publicId)) {
      return NextResponse.json(
        { error: "This Presentation could not be found." },
        { status: 404 }
      );
    }

    const { data: presentation, error: presentationError } =
      await supabaseAdmin
        .from("celebration_presentations")
        .select(`
          id,
          public_id,
          edit_token_hash,
          status,
          payment_status,
          expires_at,
          claimed_by,
          memorial_id,
          converted_memorial_id,
          featured_photo_url
        `)
        .eq("public_id", publicId)
        .maybeSingle();

    if (presentationError || !presentation) {
      return NextResponse.json(
        { error: "This Presentation could not be found." },
        { status: 404 }
      );
    }

    const editToken =
      req.cookies.get(`celebration_edit_${publicId}`)?.value || "";

    if (
      !editToken ||
      !presentation.edit_token_hash ||
      !hashesMatch(
        hashToken(editToken),
        String(presentation.edit_token_hash)
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Editing access is not available for this Presentation.",
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
            "This Presentation is not currently active.",
        },
        { status: 409 }
      );
    }

    const memorialId = Number(presentation.memorial_id || 0);
    const convertedMemorialId = Number(
      presentation.converted_memorial_id || 0
    );

    if (
      !Number.isInteger(memorialId) ||
      memorialId <= 0 ||
      convertedMemorialId !== memorialId ||
      !presentation.claimed_by
    ) {
      return NextResponse.json(
        {
          error:
            "Update from MyEMemorial is available only for a Presentation preserved with a paid Departed MyEMemorial.",
        },
        { status: 403 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select(`
          id,
          owner_id,
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
        { error: "The connected MyEMemorial could not be found." },
        { status: 404 }
      );
    }

    if (
      memorial.owner_id !== presentation.claimed_by ||
      memorial.is_living_preplan === true
    ) {
      return NextResponse.json(
        {
          error:
            "This Presentation is not connected to the correct Departed MyEMemorial.",
        },
        { status: 403 }
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

    const [
      memorialVideosResult,
      approvedSubmissionsResult,
      existingItemsResult,
      existingMusicResult,
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

      supabaseAdmin
        .from("celebration_presentation_items")
        .select(`
          id,
          item_type,
          photo_url,
          mux_asset_id,
          mux_playback_id,
          caption,
          attribution,
          submitted_by_name,
          source,
          approval_status,
          sort_order,
          duration_seconds,
          removed_at
        `)
        .eq("presentation_id", presentation.id)
        .order("id", { ascending: true }),

      supabaseAdmin
        .from("celebration_presentation_music")
        .select(`
          id,
          source_type,
          source_url,
          storage_path,
          title,
          artist,
          sort_order,
          removed_at
        `)
        .eq("presentation_id", presentation.id)
        .order("id", { ascending: true }),
    ]);

    if (memorialVideosResult.error) {
      throw memorialVideosResult.error;
    }

    if (approvedSubmissionsResult.error) {
      throw approvedSubmissionsResult.error;
    }

    if (existingItemsResult.error) {
      throw existingItemsResult.error;
    }

    if (existingMusicResult.error) {
      throw existingMusicResult.error;
    }

    const approvedSubmissions =
      approvedSubmissionsResult.data || [];

    const galleryPhotoUrls =
      parseStringList(memorial.gallery_photos);

    const galleryPhotoCaptions =
      parseCaptionList(memorial.gallery_photo_captions);

    const photos = dedupePhotos([
      ...galleryPhotoUrls.map((url, index) => ({
        url,
        caption: trimCaption(
          galleryPhotoCaptions[index] || ""
        ),
        attribution: "",
        source: "creator" as const,
        submittedByName: null,
      })),
      {
        url: normalizeText(memorial.featured_photo_url),
        caption: "",
        attribution: "",
        source: "creator",
        submittedByName: null,
      },
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

    const videos = dedupeVideos([
      ...structuredVideos,
      ...legacyVideos,
      ...contributionVideos,
    ]);

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

    const existingItems =
      (existingItemsResult.data || []) as ExistingItem[];

    const existingMusic =
      (existingMusicResult.data || []) as ExistingMusic[];

    let nextItemSortOrder =
      existingItems
        .filter((item) => !item.removed_at)
        .reduce(
          (max, item) =>
            Math.max(max, Number(item.sort_order ?? -1)),
          -1
        ) + 1;

    let nextMusicSortOrder =
      existingMusic
        .filter((track) => !track.removed_at)
        .reduce(
          (max, track) =>
            Math.max(max, Number(track.sort_order ?? -1)),
          -1
        ) + 1;

    let activeMusicCount = existingMusic.filter(
      (track) => !track.removed_at
    ).length;

    let photosAdded = 0;
    let photosUpdated = 0;
    let videosAdded = 0;
    let videosUpdated = 0;
    let musicAdded = 0;
    let musicUpdated = 0;
    let musicSkipped = 0;
    let featuredPhotoUpdated = 0;

    for (const photo of photos) {
      const matches = existingItems.filter(
        (item) =>
          item.item_type === "photo" &&
          normalizeText(item.photo_url) === photo.url
      );

      const item =
        matches.find((candidate) => !candidate.removed_at) ||
        matches[0];

      if (!item) {
        const { error } = await supabaseAdmin
          .from("celebration_presentation_items")
          .insert({
            presentation_id: presentation.id,
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
            sort_order: nextItemSortOrder++,
            duration_seconds: null,
          });

        if (error) {
          throw error;
        }

        photosAdded += 1;
        continue;
      }

      const wasRemoved = Boolean(item.removed_at);
      const needsUpdate =
        wasRemoved ||
        item.approval_status !== "approved" ||
        !stringsEqual(item.caption, photo.caption) ||
        !stringsEqual(item.attribution, photo.attribution) ||
        !stringsEqual(item.submitted_by_name, photo.submittedByName) ||
        item.source !== photo.source;

      if (needsUpdate) {
        const updates: Record<string, unknown> = {
          caption: trimCaption(photo.caption),
          attribution: photo.attribution,
          submitted_by_name: photo.submittedByName,
          source: photo.source,
          approval_status: "approved",
        };

        if (wasRemoved) {
          updates.removed_at = null;
          updates.sort_order = nextItemSortOrder++;
        }

        const { error } = await supabaseAdmin
          .from("celebration_presentation_items")
          .update(updates)
          .eq("id", item.id)
          .eq("presentation_id", presentation.id);

        if (error) {
          throw error;
        }

        if (wasRemoved) {
          photosAdded += 1;
        } else {
          photosUpdated += 1;
        }
      }
    }

    for (const video of videos) {
      const matches = existingItems.filter(
        (item) =>
          item.item_type === "video" &&
          normalizeText(item.mux_playback_id) === video.playbackId
      );

      const item =
        matches.find((candidate) => !candidate.removed_at) ||
        matches[0];

      const resolved = await resolveMuxVideo(
        video,
        item?.mux_asset_id || null,
        item?.duration_seconds || null
      );

      if (!item) {
        const { error } = await supabaseAdmin
          .from("celebration_presentation_items")
          .insert({
            presentation_id: presentation.id,
            item_type: "video",
            photo_url: null,
            storage_path: null,
            mux_asset_id: resolved.assetId,
            mux_playback_id: video.playbackId,
            caption: trimCaption(video.caption),
            attribution: video.attribution,
            submitted_by_name: video.submittedByName,
            source: video.source,
            approval_status: "approved",
            sort_order: nextItemSortOrder++,
            duration_seconds: resolved.durationSeconds,
          });

        if (error) {
          throw error;
        }

        videosAdded += 1;
        continue;
      }

      const wasRemoved = Boolean(item.removed_at);
      const needsUpdate =
        wasRemoved ||
        item.approval_status !== "approved" ||
        !stringsEqual(item.caption, video.caption) ||
        !stringsEqual(item.attribution, video.attribution) ||
        !stringsEqual(item.submitted_by_name, video.submittedByName) ||
        item.source !== video.source ||
        !stringsEqual(item.mux_asset_id, resolved.assetId) ||
        !nullableNumberEqual(
          item.duration_seconds,
          resolved.durationSeconds
        );

      if (needsUpdate) {
        const updates: Record<string, unknown> = {
          mux_asset_id: resolved.assetId,
          caption: trimCaption(video.caption),
          attribution: video.attribution,
          submitted_by_name: video.submittedByName,
          source: video.source,
          approval_status: "approved",
          duration_seconds: resolved.durationSeconds,
        };

        if (wasRemoved) {
          updates.removed_at = null;
          updates.sort_order = nextItemSortOrder++;
        }

        const { error } = await supabaseAdmin
          .from("celebration_presentation_items")
          .update(updates)
          .eq("id", item.id)
          .eq("presentation_id", presentation.id);

        if (error) {
          throw error;
        }

        if (wasRemoved) {
          videosAdded += 1;
        } else {
          videosUpdated += 1;
        }
      }
    }

    for (let index = 0; index < favoriteSongs.length; index += 1) {
      const sourceUrl = favoriteSongs[index];
      const desiredSourceType = isYoutubeUrl(sourceUrl)
        ? "youtube"
        : "uploaded";
      const desiredTitle =
        normalizeText(favoriteSongNotes[index]) ||
        `Favorite Song ${index + 1}`;

      const matches = existingMusic.filter(
        (track) => normalizeText(track.source_url) === sourceUrl
      );

      const track =
        matches.find((candidate) => !candidate.removed_at) ||
        matches[0];

      if (!track) {
        if (activeMusicCount >= MAX_MUSIC_TRACKS) {
          musicSkipped += 1;
          continue;
        }

        const { error } = await supabaseAdmin
          .from("celebration_presentation_music")
          .insert({
            presentation_id: presentation.id,
            source_type: desiredSourceType,
            source_url: sourceUrl,
            storage_path: null,
            title: desiredTitle,
            artist: "",
            sort_order: nextMusicSortOrder++,
          });

        if (error) {
          throw error;
        }

        activeMusicCount += 1;
        musicAdded += 1;
        continue;
      }

      const wasRemoved = Boolean(track.removed_at);

      if (wasRemoved && activeMusicCount >= MAX_MUSIC_TRACKS) {
        musicSkipped += 1;
        continue;
      }

      const needsUpdate =
        wasRemoved ||
        track.source_type !== desiredSourceType ||
        !stringsEqual(track.title, desiredTitle) ||
        !stringsEqual(track.artist, "");

      if (needsUpdate) {
        const updates: Record<string, unknown> = {
          source_type: desiredSourceType,
          title: desiredTitle,
          artist: "",
        };

        if (wasRemoved) {
          updates.removed_at = null;
          updates.sort_order = nextMusicSortOrder++;
        }

        const { error } = await supabaseAdmin
          .from("celebration_presentation_music")
          .update(updates)
          .eq("id", track.id)
          .eq("presentation_id", presentation.id);

        if (error) {
          throw error;
        }

        if (wasRemoved) {
          activeMusicCount += 1;
          musicAdded += 1;
        } else {
          musicUpdated += 1;
        }
      }
    }

    const memorialFeaturedPhoto =
      normalizeText(memorial.featured_photo_url) || null;

    if (
      normalizeText(presentation.featured_photo_url) !==
      normalizeText(memorialFeaturedPhoto)
    ) {
      const { error } = await supabaseAdmin
        .from("celebration_presentations")
        .update({
          featured_photo_url: memorialFeaturedPhoto,
        })
        .eq("id", presentation.id);

      if (error) {
        throw error;
      }

      featuredPhotoUpdated = 1;
    }

    const totalChanges =
      photosAdded +
      photosUpdated +
      videosAdded +
      videosUpdated +
      musicAdded +
      musicUpdated +
      featuredPhotoUpdated;

    let message =
      totalChanges === 0
        ? "Your Presentation is already up to date with MyEMemorial."
        : "Presentation updated from MyEMemorial.";

    if (musicSkipped > 0) {
      message +=
        " One or more favorite songs were not added because the Presentation already contains 5 music tracks.";
    }

    return NextResponse.json({
      success: true,
      message,
      changes: {
        photosAdded,
        photosUpdated,
        videosAdded,
        videosUpdated,
        musicAdded,
        musicUpdated,
        musicSkipped,
        featuredPhotoUpdated,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE PRESENTATION FROM MYEMEMORIAL ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Presentation could not be updated from MyEMemorial.",
      },
      { status: 500 }
    );
  }
}
