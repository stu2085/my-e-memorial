import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const INTRO_FRAMES = 5 * FPS;
const PHOTO_FRAMES = 7 * FPS;
const CLOSING_FRAMES = 8 * FPS;
const RENDER_CONFIG_VERSION = "celebration-offline-v3";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

type PresentationRow = {
  id: number;
  public_id: string;
  person_name: string;
  birth_date: string | null;
  death_date: string | null;
  featured_photo_url: string | null;
  edit_token_hash: string;
  status: string;
  payment_status: string;
  expires_at: string | null;
  offline_backup_status: string | null;
  offline_backup_storage_path: string | null;
  offline_backup_created_at: string | null;
};

type ItemRow = {
  id: number;
  item_type: "photo" | "video";
  photo_url: string | null;
  storage_path: string | null;
  mux_asset_id: string | null;
  caption: string | null;
  attribution: string | null;
  source: string;
  approval_status: string;
  sort_order: number;
  duration_seconds: number | null;
  updated_at: string | null;
};

type MusicRow = {
  id: number;
  source_type: string;
  source_url: string | null;
  storage_path: string | null;
  title: string | null;
  artist: string | null;
  sort_order: number;
  updated_at: string | null;
};

type TimelineItem = {
  item: ItemRow;
  sourceUrl: string;
  from: number;
  durationInFrames: number;
};

type MusicDuration = {
  id: number;
  durationSeconds: number;
};

type RenderlyStatus = {
  status: string;
  progressPercentage?: number;
  outputUrl?: string;
  errorMessage?: string;
  creditsUsed?: number;
};

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

function presentationIsEligible(presentation: PresentationRow) {
  if (
    presentation.payment_status !== "paid" ||
    presentation.status !== "active"
  ) {
    return false;
  }

  if (
    presentation.expires_at &&
    new Date(presentation.expires_at).getTime() <= Date.now()
  ) {
    return false;
  }

  return true;
}

function safeDownloadName(value: string) {
  const name = value
    .replace(/\s+\(Sample Presentation\)$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);

  return `Celebration of Life - ${name || "Presentation"}.mp4`;
}

function displayPersonName(value: string) {
  return value.replace(/\s+\(Sample Presentation\)$/i, "").trim();
}

function isSamplePresentation(value: string) {
  return /\s+\(Sample Presentation\)$/i.test(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return "";
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function dateLine(presentation: PresentationRow) {
  return [formatDate(presentation.birth_date), formatDate(presentation.death_date)]
    .filter(Boolean)
    .join(" — ");
}

async function getAuthorizedPresentation(
  req: NextRequest,
  publicId: string
): Promise<PresentationRow | null> {
  if (!isValidPublicId(publicId)) {
    return null;
  }

  const { data: presentation, error } = await supabaseAdmin
    .from("celebration_presentations")
    .select(`
      id,
      public_id,
      person_name,
      birth_date,
      death_date,
      featured_photo_url,
      edit_token_hash,
      status,
      payment_status,
      expires_at,
      offline_backup_status,
      offline_backup_storage_path,
      offline_backup_created_at
    `)
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !presentation) {
    return null;
  }

  const editToken =
    req.cookies.get(`celebration_edit_${publicId}`)?.value || "";

  if (!editToken || !presentation.edit_token_hash) {
    return null;
  }

  if (
    !hashesMatch(
      hashToken(editToken),
      String(presentation.edit_token_hash)
    )
  ) {
    return null;
  }

  return presentation as PresentationRow;
}

async function loadPresentationMedia(presentationId: number) {
  const [itemsResult, musicResult] = await Promise.all([
    supabaseAdmin
      .from("celebration_presentation_items")
      .select(`
        id,
        item_type,
        photo_url,
        storage_path,
        mux_asset_id,
        caption,
        attribution,
        source,
        approval_status,
        sort_order,
        duration_seconds,
        updated_at
      `)
      .eq("presentation_id", presentationId)
      .eq("approval_status", "approved")
      .is("removed_at", null)
      .order("sort_order", { ascending: true })
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
        updated_at
      `)
      .eq("presentation_id", presentationId)
      .is("removed_at", null)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  if (musicResult.error) {
    throw musicResult.error;
  }

  return {
    items: (itemsResult.data || []) as ItemRow[],
    music: (musicResult.data || []) as MusicRow[],
  };
}

function contentHash(
  presentation: PresentationRow,
  items: ItemRow[],
  music: MusicRow[]
) {
  const fingerprint = {
    version: RENDER_CONFIG_VERSION,
    personName: presentation.person_name,
    birthDate: presentation.birth_date,
    deathDate: presentation.death_date,
    featuredPhotoUrl: presentation.featured_photo_url,
    items: items.map((item) => ({
      id: item.id,
      type: item.item_type,
      photoUrl: item.photo_url,
      muxAssetId: item.mux_asset_id,
      caption: String(item.caption || "").slice(0, 35),
      attribution: item.attribution,
      sortOrder: item.sort_order,
      durationSeconds: item.duration_seconds,
      updatedAt: item.updated_at,
    })),
    music: music
      .filter(
        (track) =>
          track.source_type !== "youtube" && Boolean(track.source_url)
      )
      .map((track) => ({
        id: track.id,
        sourceType: track.source_type,
        sourceUrl: track.source_url,
        sortOrder: track.sort_order,
        updatedAt: track.updated_at,
      })),
  };

  return createHash("sha256")
    .update(JSON.stringify(fingerprint))
    .digest("hex");
}

function renderMarker(hash: string, jobId: string) {
  return `renderly|${RENDER_CONFIG_VERSION}|${hash}|${jobId}`;
}

function parseRenderMarker(value: string | null | undefined) {
  const parts = String(value || "").split("|");

  if (
    parts.length !== 4 ||
    parts[0] !== "renderly" ||
    parts[1] !== RENDER_CONFIG_VERSION
  ) {
    return null;
  }

  const [, , hash, jobId] = parts;

  if (!/^[a-f0-9]{64}$/i.test(hash) || !jobId) {
    return null;
  }

  return { hash, jobId };
}

async function requestTemporaryMasterAccess(assetId: string) {
  const tokenId = process.env.MUX_TOKEN_ID || "";
  const tokenSecret = process.env.MUX_TOKEN_SECRET || "";

  if (!tokenId || !tokenSecret) {
    throw new Error("Mux credentials are not configured.");
  }

  const authorization = Buffer.from(
    `${tokenId}:${tokenSecret}`,
    "utf8"
  ).toString("base64");

  const response = await fetch(
    `https://api.mux.com/video/v1/assets/${encodeURIComponent(
      assetId
    )}/master-access`,
    {
      method: "PUT",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        master_access: "temporary",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Mux master access request failed (${response.status})${
        detail ? `: ${detail.slice(0, 200)}` : ""
      }`
    );
  }
}

async function prepareTimeline(items: ItemRow[]) {
  const timeline: TimelineItem[] = [];
  let currentFrame = INTRO_FRAMES;
  let preparingVideos = 0;

  for (const item of items) {
    if (item.item_type === "photo") {
      if (!item.photo_url) {
        throw new Error(
          "One or more photos are not ready. Make sure every photo appears in the presentation, then try again."
        );
      }

      timeline.push({
        item,
        sourceUrl: item.photo_url,
        from: currentFrame,
        durationInFrames: PHOTO_FRAMES,
      });

      currentFrame += PHOTO_FRAMES;
      continue;
    }

    if (!item.mux_asset_id) {
      throw new Error(
        "One or more videos are not ready. Make sure every video plays in the presentation, then try again."
      );
    }

    const assetId = String(item.mux_asset_id);
    const asset = await mux.video.assets.retrieve(assetId);
    const master = (asset as any)?.master;

    if (master?.status === "errored") {
      throw new Error(
        "One of the presentation videos could not be prepared for the offline copy."
      );
    }

    if (master?.status !== "ready" || !master?.url) {
      preparingVideos += 1;

      if ((asset as any)?.master_access !== "temporary") {
        await requestTemporaryMasterAccess(assetId);
      }

      continue;
    }

    const seconds = Math.max(
      1,
      Math.round(Number(item.duration_seconds || (asset as any)?.duration || 1))
    );

    const durationInFrames = seconds * FPS;

    timeline.push({
      item,
      sourceUrl: String(master.url),
      from: currentFrame,
      durationInFrames,
    });

    currentFrame += durationInFrames;
  }

  return {
    timeline,
    preparingVideos,
    closingFrom: currentFrame,
    totalFrames: currentFrame + CLOSING_FRAMES,
  };
}

function normalizeMusicDurations(body: any) {
  const source = Array.isArray(body?.musicDurations)
    ? body.musicDurations
    : [];

  const result = new Map<number, number>();

  for (const entry of source) {
    const id = Number(entry?.id);
    const durationSeconds = Number(entry?.durationSeconds);

    if (
      Number.isFinite(id) &&
      id > 0 &&
      Number.isFinite(durationSeconds) &&
      durationSeconds > 0 &&
      durationSeconds <= 60 * 60 * 3
    ) {
      result.set(id, durationSeconds);
    }
  }

  return result;
}

function addMusicOverlays(
  overlays: Array<Record<string, unknown>>,
  nextId: () => number,
  music: MusicRow[],
  durations: Map<number, number>,
  timeline: TimelineItem[],
  closingFrom: number
) {
  const tracks = music.filter(
    (track) =>
      track.source_type !== "youtube" &&
      Boolean(track.source_url) &&
      durations.has(track.id)
  );

  if (tracks.length === 0) {
    return;
  }

  const activeIntervals: Array<{ start: number; end: number }> = [];

  for (const entry of timeline) {
    if (entry.item.item_type !== "photo") {
      continue;
    }

    const start = entry.from;
    const end = entry.from + entry.durationInFrames;
    const previous = activeIntervals.at(-1);

    if (previous && previous.end === start) {
      previous.end = end;
    } else {
      activeIntervals.push({ start, end });
    }
  }

  const closingEnd = closingFrom + CLOSING_FRAMES;
  const previous = activeIntervals.at(-1);

  if (previous && previous.end === closingFrom) {
    previous.end = closingEnd;
  } else {
    activeIntervals.push({ start: closingFrom, end: closingEnd });
  }

  let trackIndex = 0;
  let trackOffsetSeconds = 0;
  let firstMusicSegment = true;

  for (const interval of activeIntervals) {
    let cursorFrame = interval.start;
    let remainingFrames = interval.end - interval.start;

    while (remainingFrames > 0) {
      const track = tracks[trackIndex % tracks.length];
      const trackDurationSeconds = durations.get(track.id) || 0;
      const remainingTrackSeconds = Math.max(
        0,
        trackDurationSeconds - trackOffsetSeconds
      );

      if (remainingTrackSeconds <= 0.02) {
        trackIndex = (trackIndex + 1) % tracks.length;
        trackOffsetSeconds = 0;
        continue;
      }

      const remainingTrackFrames = Math.max(
        1,
        Math.round(remainingTrackSeconds * FPS)
      );

      const segmentFrames = Math.min(
        remainingFrames,
        remainingTrackFrames
      );

      overlays.push({
        id: nextId(),
        type: "sound",
        src: track.source_url,
        from: cursorFrame,
        durationInFrames: segmentFrames,
        row: 5,
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        startFromSound: trackOffsetSeconds,
        speed: 1,
        styles: {
          volume: 0.45,
          fadeIn: firstMusicSegment ? 0.5 : 0.25,
          fadeOut: 0.4,
        },
      });

      firstMusicSegment = false;
      cursorFrame += segmentFrames;
      remainingFrames -= segmentFrames;
      trackOffsetSeconds += segmentFrames / FPS;

      if (trackOffsetSeconds + 0.02 >= trackDurationSeconds) {
        trackIndex = (trackIndex + 1) % tracks.length;
        trackOffsetSeconds = 0;
      }
    }
  }
}

function buildRenderPayload(
  presentation: PresentationRow,
  items: ItemRow[],
  music: MusicRow[],
  timeline: TimelineItem[],
  closingFrom: number,
  totalFrames: number,
  musicDurations: Map<number, number>
) {
  const overlays: Array<Record<string, unknown>> = [];
  let id = 0;
  const nextId = () => {
    id += 1;
    return id;
  };

  const featuredPhoto = presentation.featured_photo_url;
  const personName = displayPersonName(presentation.person_name);
  const sample = isSamplePresentation(presentation.person_name);
  const dates = dateLine(presentation);

  const addText = (
    content: string,
    from: number,
    durationInFrames: number,
    top: number,
    height: number,
    fontSize: string,
    fontWeight: string,
    color: string
  ) => {
    if (!content) {
      return;
    }

    overlays.push({
      id: nextId(),
      type: "text",
      content,
      from,
      durationInFrames,
      row: 0,
      top,
      left: 260,
      width: 1400,
      height,
      styles: {
        fontFamily: "Roboto",
        fontSize,
        fontWeight,
        color,
        textAlign: "center",
      },
    });
  };

  const addBackground = (
    from: number,
    durationInFrames: number,
    portraitTop: number,
    portraitLeft: number,
    portraitWidth: number,
    portraitHeight: number
  ) => {
    if (featuredPhoto) {
      overlays.push({
        id: nextId(),
        type: "image",
        src: featuredPhoto,
        from,
        durationInFrames,
        row: 4,
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        styles: {
          objectFit: "cover",
          opacity: 0.22,
        },
      });
    }

    overlays.push({
      id: nextId(),
      type: "shape",
      content: "rectangle",
      from,
      durationInFrames,
      row: 3,
      top: 0,
      left: 0,
      width: WIDTH,
      height: HEIGHT,
      styles: {
        fill: "rgba(2,6,23,0.58)",
      },
    });

    if (featuredPhoto) {
      overlays.push({
        id: nextId(),
        type: "image",
        src: featuredPhoto,
        from,
        durationInFrames,
        row: 2,
        top: portraitTop,
        left: portraitLeft,
        width: portraitWidth,
        height: portraitHeight,
        styles: {
          objectFit: "cover",
          borderRadius: "24px",
          opacity: 1,
        },
      });
    }
  };

  const addCaption = (
    caption: string,
    from: number,
    durationInFrames: number
  ) => {
    const safeCaption = String(caption || "").trim().slice(0, 35);

    if (!safeCaption) {
      return;
    }

    overlays.push({
      id: nextId(),
      type: "shape",
      content: "rectangle",
      from,
      durationInFrames,
      row: 1,
      top: 850,
      left: 0,
      width: WIDTH,
      height: 230,
      styles: {
        fill: "rgba(0,0,0,0.68)",
      },
    });

    overlays.push({
      id: nextId(),
      type: "text",
      content: safeCaption,
      from,
      durationInFrames,
      row: 0,
      top: 890,
      left: 120,
      width: 1680,
      height: 130,
      styles: {
        fontFamily: "Roboto",
        fontSize: "44px",
        fontWeight: "500",
        color: "#FFFFFF",
        textAlign: "center",
        whiteSpace: "nowrap",
      },
    });
  };

  // Opening: 5 seconds.
  addBackground(0, INTRO_FRAMES, 175, 770, 380, 500);
  addText(
    "CELEBRATION OF LIFE",
    0,
    INTRO_FRAMES,
    65,
    90,
    "38px",
    "600",
    "#FDE68A"
  );
  addText(
    personName,
    0,
    INTRO_FRAMES,
    dates || sample ? 690 : 735,
    110,
    "64px",
    "600",
    "#FFFFFF"
  );

  if (dates) {
    addText(
      dates,
      0,
      INTRO_FRAMES,
      795,
      65,
      "30px",
      "500",
      "#FFFFFF"
    );
  }

  if (sample) {
    addText(
      "Sample Presentation",
      0,
      INTRO_FRAMES,
      dates ? 865 : 825,
      70,
      "30px",
      "600",
      "#FEF3C7"
    );
  }

  // Photos and videos.
  for (const entry of timeline) {
    if (entry.item.item_type === "photo") {
      overlays.push({
        id: nextId(),
        type: "image",
        src: entry.sourceUrl,
        from: entry.from,
        durationInFrames: entry.durationInFrames,
        row: 4,
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        styles: {
          objectFit: "cover",
          opacity: 0.28,
        },
      });

      overlays.push({
        id: nextId(),
        type: "shape",
        content: "rectangle",
        from: entry.from,
        durationInFrames: entry.durationInFrames,
        row: 3,
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        styles: {
          fill: "rgba(0,0,0,0.55)",
        },
      });

      overlays.push({
        id: nextId(),
        type: "image",
        src: entry.sourceUrl,
        from: entry.from,
        durationInFrames: entry.durationInFrames,
        row: 2,
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        styles: {
          objectFit: "contain",
          opacity: 1,
          animation: {
            enter: "fade",
            exit: "fade",
            enterDuration: 0.35,
            exitDuration: 0.35,
          },
        },
      });
    } else {
      overlays.push({
        id: nextId(),
        type: "video",
        src: entry.sourceUrl,
        from: entry.from,
        durationInFrames: entry.durationInFrames,
        row: 2,
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        videoStartTime: 0,
        speed: 1,
        styles: {
          objectFit: "contain",
          opacity: 1,
          volume: 1,
        },
      });
    }

    addCaption(
      String(entry.item.caption || ""),
      entry.from,
      entry.durationInFrames
    );
  }

  // Closing: 8 seconds.
  addBackground(closingFrom, CLOSING_FRAMES, 155, 790, 340, 450);
  addText(
    "IN LOVING MEMORY",
    closingFrom,
    CLOSING_FRAMES,
    65,
    90,
    "38px",
    "600",
    "#FDE68A"
  );
  addText(
    personName,
    closingFrom,
    CLOSING_FRAMES,
    dates ? 625 : 650,
    110,
    "64px",
    "600",
    "#FFFFFF"
  );

  if (dates) {
    addText(
      dates,
      closingFrom,
      CLOSING_FRAMES,
      745,
      65,
      "30px",
      "500",
      "#FFFFFF"
    );
  }

  addText(
    "Where Life's Stories Are Told.",
    closingFrom,
    CLOSING_FRAMES,
    dates ? 835 : 790,
    90,
    "38px",
    "500",
    "#FEF3C7"
  );

  addMusicOverlays(
    overlays,
    nextId,
    music,
    musicDurations,
    timeline,
    closingFrom
  );

  return {
    inputProps: {
      backgroundColor: "#000000",
      overlays,
      durationInFrames: totalFrames,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
    },
  };
}

async function renderlyRequest(
  path: string,
  init?: RequestInit
) {
  const key = process.env.RENDERLY_API_KEY || "";

  if (!key) {
    throw new Error("Renderly is not configured.");
  }

  const response = await fetch(`https://renderly.video/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      response.status === 402
        ? "The offline-copy service is temporarily unavailable. Please try again shortly."
        : String(
            body?.error ||
              body?.message ||
              "The offline copy could not be prepared."
          )
    );

    (error as any).status = response.status;
    throw error;
  }

  return body;
}

async function getRenderlyStatus(jobId: string): Promise<RenderlyStatus> {
  const result = await renderlyRequest(
    `/renders/${encodeURIComponent(jobId)}`
  );

  return (result?.data || {}) as RenderlyStatus;
}

async function normalizeExistingJob(
  presentation: PresentationRow,
  currentHash: string
) {
  const marker = parseRenderMarker(
    presentation.offline_backup_storage_path
  );

  if (!marker || marker.hash !== currentHash) {
    return null;
  }

  // Renderly keeps generated videos for 30 days. Refresh a ready copy
  // after 28 days so the customer does not receive an expired file.
  if (
    presentation.offline_backup_status === "ready" &&
    presentation.offline_backup_created_at
  ) {
    const ageMs =
      Date.now() -
      new Date(presentation.offline_backup_created_at).getTime();

    if (ageMs > 28 * 24 * 60 * 60 * 1000) {
      return null;
    }
  }

  try {
    const status = await getRenderlyStatus(marker.jobId);

    if (status.status === "COMPLETED" && status.outputUrl) {
      if (presentation.offline_backup_status !== "ready") {
        await supabaseAdmin
          .from("celebration_presentations")
          .update({
            offline_backup_status: "ready",
            offline_backup_created_at: new Date().toISOString(),
            offline_backup_error: null,
          })
          .eq("id", presentation.id);
      }

      return {
        status: "ready",
        progress: 100,
        outputUrl: status.outputUrl,
        filename: safeDownloadName(presentation.person_name),
      };
    }

    if (status.status === "FAILED") {
      return null;
    }

    return {
      status: "rendering",
      progress: Number(status.progressPercentage || 0),
    };
  } catch (error) {
    console.error(
      "CELEBRATION OFFLINE VIDEO EXISTING JOB CHECK ERROR:",
      error
    );
    return null;
  }
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ publicId: string }>;
  }
) {
  try {
    const { publicId } = await context.params;
    const presentation = await getAuthorizedPresentation(req, publicId);

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "Only the presentation purchaser can create an offline copy.",
        },
        { status: 403 }
      );
    }

    if (!presentationIsEligible(presentation)) {
      return NextResponse.json(
        {
          error:
            "Offline Copy is available only while a paid presentation is active.",
        },
        { status: 409 }
      );
    }

    const { items, music } = await loadPresentationMedia(presentation.id);

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Add at least one photo or video before creating an Offline Copy.",
        },
        { status: 409 }
      );
    }

    const hash = contentHash(presentation, items, music);
    const existing = await normalizeExistingJob(presentation, hash);

    if (existing) {
      return NextResponse.json({
        success: true,
        ...existing,
      });
    }

    const body = await req.json().catch(() => ({}));
    const musicDurations = normalizeMusicDurations(body);

    const renderableMusic = music.filter(
      (track) =>
        track.source_type !== "youtube" && Boolean(track.source_url)
    );

    const missingMusicDuration = renderableMusic.find(
      (track) => !musicDurations.has(track.id)
    );

    if (missingMusicDuration) {
      return NextResponse.json(
        {
          error:
            "The presentation music is still loading. Please wait a moment and try Download Offline Copy again.",
        },
        { status: 409 }
      );
    }

    const prepared = await prepareTimeline(items);

    if (prepared.preparingVideos > 0) {
      await supabaseAdmin
        .from("celebration_presentations")
        .update({
          offline_backup_status: "processing",
          offline_backup_error: null,
        })
        .eq("id", presentation.id);

      return NextResponse.json(
        {
          success: true,
          status: "preparing_media",
          preparingVideos: prepared.preparingVideos,
        },
        { status: 202 }
      );
    }

    const payload = buildRenderPayload(
      presentation,
      items,
      music,
      prepared.timeline,
      prepared.closingFrom,
      prepared.totalFrames,
      musicDurations
    );

    const previewResult = await renderlyRequest("/previews", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const warnings = Array.isArray(previewResult?.data?.warnings)
      ? previewResult.data.warnings
      : [];

    const blockingWarning = warnings.find(
      (warning: any) => warning?.severity === "error"
    );

    if (blockingWarning) {
      console.error(
        "CELEBRATION OFFLINE VIDEO PREVIEW BLOCKED:",
        blockingWarning
      );

      return NextResponse.json(
        {
          error:
            "One of the presentation files could not be prepared for the Offline Copy. Please make sure the online presentation plays correctly, then try again.",
        },
        { status: 409 }
      );
    }

    const renderResult = await renderlyRequest("/renders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const jobId = String(renderResult?.data?.jobId || "");

    if (!jobId) {
      throw new Error(
        "The offline-copy service did not return a render job."
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("celebration_presentations")
      .update({
        offline_backup_status: "processing",
        offline_backup_storage_path: renderMarker(hash, jobId),
        offline_backup_created_at: null,
        offline_backup_error: null,
      })
      .eq("id", presentation.id);

    if (updateError) {
      console.error(
        "CELEBRATION OFFLINE VIDEO JOB SAVE ERROR:",
        updateError
      );
    }

    return NextResponse.json({
      success: true,
      status: "rendering",
      progress: 0,
    });
  } catch (error) {
    console.error("CELEBRATION OFFLINE VIDEO POST ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Offline Copy could not be prepared.",
      },
      { status: Number((error as any)?.status || 500) }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ publicId: string }>;
  }
) {
  try {
    const { publicId } = await context.params;
    const presentation = await getAuthorizedPresentation(req, publicId);

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "Only the presentation purchaser can access the Offline Copy.",
        },
        { status: 403 }
      );
    }

    if (!presentationIsEligible(presentation)) {
      return NextResponse.json(
        {
          error:
            "Offline Copy is available only while a paid presentation is active.",
        },
        { status: 409 }
      );
    }

    const wantsDownload =
      req.nextUrl.searchParams.get("download") === "1";

    const { items, music } = await loadPresentationMedia(presentation.id);
    const hash = contentHash(presentation, items, music);
    const marker = parseRenderMarker(
      presentation.offline_backup_storage_path
    );

    if (!marker || marker.hash !== hash) {
      if (wantsDownload) {
        return NextResponse.json(
          {
            error:
              "This Offline Copy is no longer current. Please create a new Offline Copy.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "not_started",
      });
    }

    let renderStatus: RenderlyStatus;

    try {
      renderStatus = await getRenderlyStatus(marker.jobId);
    } catch (error) {
      console.error(
        "CELEBRATION OFFLINE VIDEO STATUS ERROR:",
        error
      );

      if (wantsDownload) {
        return NextResponse.json(
          {
            error:
              "The Offline Copy could not be retrieved. Please try again.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "not_started",
      });
    }

    if (renderStatus.status === "COMPLETED" && renderStatus.outputUrl) {
      const completedAt =
        presentation.offline_backup_created_at || new Date().toISOString();

      if (
        presentation.offline_backup_status !== "ready" ||
        !presentation.offline_backup_created_at
      ) {
        await supabaseAdmin
          .from("celebration_presentations")
          .update({
            offline_backup_status: "ready",
            offline_backup_created_at: completedAt,
            offline_backup_error: null,
          })
          .eq("id", presentation.id);
      }

      const ageMs =
        Date.now() -
        new Date(completedAt).getTime();

      if (ageMs > 28 * 24 * 60 * 60 * 1000) {
        if (wantsDownload) {
          return NextResponse.json(
            {
              error:
                "This Offline Copy has expired. Please create a new Offline Copy.",
            },
            { status: 410 }
          );
        }

        return NextResponse.json({
          success: true,
          status: "not_started",
        });
      }

      if (wantsDownload) {
        const outputUrl = String(renderStatus.outputUrl || "").trim();
        let parsedOutputUrl: URL;

        try {
          parsedOutputUrl = new URL(outputUrl);
        } catch {
          return NextResponse.json(
            {
              error:
                "The Offline Copy download address is invalid. Please try again.",
            },
            { status: 502 }
          );
        }

        if (parsedOutputUrl.protocol !== "https:") {
          return NextResponse.json(
            {
              error:
                "The Offline Copy download address is not secure. Please try again.",
            },
            { status: 502 }
          );
        }

        const videoResponse = await fetch(outputUrl, {
          method: "GET",
          cache: "no-store",
          redirect: "follow",
        });

        if (!videoResponse.ok || !videoResponse.body) {
          console.error(
            "CELEBRATION OFFLINE VIDEO DOWNLOAD FETCH ERROR:",
            videoResponse.status,
            videoResponse.statusText
          );

          return NextResponse.json(
            {
              error:
                "Your Offline Copy could not be downloaded. Please try again.",
            },
            { status: 502 }
          );
        }

        const downloadName = safeDownloadName(
          presentation.person_name
        );
        const headers = new Headers();

        headers.set(
          "Content-Type",
          videoResponse.headers.get("content-type") || "video/mp4"
        );
        const asciiDownloadName =
          downloadName
            .replace(/[^\x20-\x7E]/g, "")
            .trim() || "Celebration of Life - Presentation.mp4";

        headers.set(
          "Content-Disposition",
          `attachment; filename="${asciiDownloadName}"; filename*=UTF-8''${encodeURIComponent(
            downloadName
          )}`
        );
        headers.set("Cache-Control", "private, no-store");
        headers.set("X-Content-Type-Options", "nosniff");

        const contentLength =
          videoResponse.headers.get("content-length");

        if (contentLength) {
          headers.set("Content-Length", contentLength);
        }

        return new Response(videoResponse.body, {
          status: 200,
          headers,
        });
      }

      return NextResponse.json({
        success: true,
        status: "ready",
        progress: 100,
        outputUrl: renderStatus.outputUrl,
        filename: safeDownloadName(presentation.person_name),
      });
    }

    if (renderStatus.status === "FAILED") {
      const errorMessage =
        renderStatus.errorMessage ||
        "The Offline Copy could not be prepared.";

      await supabaseAdmin
        .from("celebration_presentations")
        .update({
          offline_backup_status: "failed",
          offline_backup_error: errorMessage,
        })
        .eq("id", presentation.id);

      return NextResponse.json(
        {
          success: false,
          status: "failed",
          error:
            "The Offline Copy could not be prepared. Please try again.",
        },
        { status: 500 }
      );
    }

    if (wantsDownload) {
      return NextResponse.json(
        {
          error:
            "Your Offline Copy is not ready to download yet.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "rendering",
      progress: Number(renderStatus.progressPercentage || 0),
    });
  } catch (error) {
    console.error("CELEBRATION OFFLINE VIDEO GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Offline Copy status could not be checked.",
      },
      { status: 500 }
    );
  }
}
