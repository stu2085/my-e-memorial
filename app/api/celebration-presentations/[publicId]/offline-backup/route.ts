import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

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

async function getAuthorizedPresentation(req: NextRequest, publicId: string) {
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
      expires_at
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

  return presentation;
}

function presentationIsEligible(presentation: {
  status: string;
  payment_status: string;
  expires_at: string | null;
}) {
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
        duration_seconds
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
        sort_order
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
    items: itemsResult.data || [],
    music: musicResult.data || [],
  };
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
            "Only the presentation purchaser can create an offline backup.",
        },
        { status: 403 }
      );
    }

    if (!presentationIsEligible(presentation)) {
      return NextResponse.json(
        {
          error:
            "Offline backup is available only while a paid presentation is active.",
        },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "prepare");

    if (action === "complete") {
      const completedAt = new Date().toISOString();

      const { error: updateError } = await supabaseAdmin
        .from("celebration_presentations")
        .update({
          offline_backup_status: "ready",
          offline_backup_created_at: completedAt,
          offline_backup_error: null,
        })
        .eq("id", presentation.id);

      if (updateError) {
        console.error(
          "CELEBRATION OFFLINE BACKUP COMPLETE UPDATE ERROR:",
          updateError
        );
      }

      return NextResponse.json({
        success: true,
        status: "ready",
        completedAt,
      });
    }

    if (action !== "prepare") {
      return NextResponse.json(
        { error: "Invalid offline backup action." },
        { status: 400 }
      );
    }

    const { items } = await loadPresentationMedia(presentation.id);

    const incompleteVideoCount = items.filter(
      (item) =>
        item.item_type === "video" && !item.mux_asset_id
    ).length;

    if (incompleteVideoCount > 0) {
      throw new Error(
        "One or more videos are not ready for offline backup. Make sure every video plays in the presentation, then try again."
      );
    }

    const missingPhotoCount = items.filter(
      (item) => item.item_type === "photo" && !item.photo_url
    ).length;

    if (missingPhotoCount > 0) {
      throw new Error(
        "One or more photos are not ready for offline backup. Make sure every photo appears in the presentation, then try again."
      );
    }

    const videoAssetIds = items
      .filter((item) => item.item_type === "video")
      .map((item) => String(item.mux_asset_id));

    for (const assetId of videoAssetIds) {
      const asset = await mux.video.assets.retrieve(assetId);
      const master = (asset as any)?.master;

      if (master?.status === "ready" && master?.url) {
        continue;
      }

      if (master?.status === "errored") {
        throw new Error(
          "One of the presentation videos could not be prepared for offline backup."
        );
      }

      if ((asset as any)?.master_access !== "temporary") {
        await requestTemporaryMasterAccess(assetId);
      }
    }

    const nextStatus = videoAssetIds.length > 0 ? "processing" : "ready";

    const { error: updateError } = await supabaseAdmin
      .from("celebration_presentations")
      .update({
        offline_backup_status: nextStatus,
        offline_backup_error: null,
      })
      .eq("id", presentation.id);

    if (updateError) {
      console.error(
        "CELEBRATION OFFLINE BACKUP PREPARE UPDATE ERROR:",
        updateError
      );
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      videoCount: videoAssetIds.length,
    });
  } catch (error) {
    console.error("CELEBRATION OFFLINE BACKUP POST ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The offline backup could not be prepared.",
      },
      { status: 500 }
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
            "Only the presentation purchaser can create an offline backup.",
        },
        { status: 403 }
      );
    }

    if (!presentationIsEligible(presentation)) {
      return NextResponse.json(
        {
          error:
            "Offline backup is available only while a paid presentation is active.",
        },
        { status: 409 }
      );
    }

    const { items, music } = await loadPresentationMedia(presentation.id);

    const incompleteVideoCount = items.filter(
      (item) =>
        item.item_type === "video" && !item.mux_asset_id
    ).length;
    const missingPhotoCount = items.filter(
      (item) => item.item_type === "photo" && !item.photo_url
    ).length;

    if (incompleteVideoCount > 0 || missingPhotoCount > 0) {
      return NextResponse.json(
        {
          success: false,
          status: "failed",
          error:
            "Some presentation media is not ready for offline backup. Make sure every photo and video plays online, then try again.",
        },
        { status: 409 }
      );
    }

    let preparingVideos = 0;
    let failedVideos = 0;

    const preparedItems = [] as Array<Record<string, unknown>>;

    for (const item of items) {
      if (item.item_type === "photo") {
        if (!item.photo_url) {
          continue;
        }

        preparedItems.push({
          id: item.id,
          itemType: "photo",
          sourceUrl: item.photo_url,
          storagePath: item.storage_path,
          caption: item.caption || "",
          attribution: item.attribution || "",
          sortOrder: item.sort_order,
        });
        continue;
      }

      if (!item.mux_asset_id) {
        continue;
      }

      const asset = await mux.video.assets.retrieve(
        String(item.mux_asset_id)
      );
      const master = (asset as any)?.master;

      if (master?.status === "errored") {
        failedVideos += 1;
        continue;
      }

      if (master?.status !== "ready" || !master?.url) {
        preparingVideos += 1;
        continue;
      }

      preparedItems.push({
        id: item.id,
        itemType: "video",
        sourceUrl: master.url,
        storagePath: null,
        caption: item.caption || "",
        attribution: item.attribution || "",
        sortOrder: item.sort_order,
        durationSeconds: item.duration_seconds,
      });
    }

    if (failedVideos > 0) {
      await supabaseAdmin
        .from("celebration_presentations")
        .update({
          offline_backup_status: "failed",
          offline_backup_error:
            "One or more videos could not be prepared for offline backup.",
        })
        .eq("id", presentation.id);

      return NextResponse.json(
        {
          success: false,
          status: "failed",
          error:
            "One or more videos could not be prepared for offline backup.",
        },
        { status: 500 }
      );
    }

    if (preparingVideos > 0) {
      return NextResponse.json({
        success: true,
        status: "processing",
        preparingVideos,
      });
    }

    await supabaseAdmin
      .from("celebration_presentations")
      .update({
        offline_backup_status: "ready",
        offline_backup_error: null,
      })
      .eq("id", presentation.id);

    return NextResponse.json({
      success: true,
      status: "ready",
      manifest: {
        presentation: {
          publicId: presentation.public_id,
          personName: presentation.person_name,
          birthDate: presentation.birth_date,
          deathDate: presentation.death_date,
          featuredPhotoUrl: presentation.featured_photo_url,
        },
        items: preparedItems,
        music: music
          .filter(
            (track) =>
              track.source_type !== "youtube" && Boolean(track.source_url)
          )
          .map((track) => ({
            id: track.id,
            sourceType: track.source_type,
            sourceUrl: track.source_url,
            storagePath: track.storage_path,
            title: track.title,
            artist: track.artist,
            sortOrder: track.sort_order,
          })),
      },
    });
  } catch (error) {
    console.error("CELEBRATION OFFLINE BACKUP GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The offline backup could not be prepared.",
      },
      { status: 500 }
    );
  }
}
