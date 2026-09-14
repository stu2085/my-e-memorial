import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const MAX_VIDEO_SECONDS = 300;

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

async function getAuthorizedPresentation(
  req: NextRequest,
  publicId: string
) {
  if (!isValidPublicId(publicId)) {
    return null;
  }

  const { data: presentation, error } = await supabaseAdmin
    .from("celebration_presentations")
    .select("id, public_id, edit_token_hash, status")
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

  if (
    presentation.status === "converted" ||
    presentation.status === "cancelled" ||
    presentation.status === "expired"
  ) {
    return null;
  }

  return presentation;
}

async function getNextSortOrder(presentationId: number) {
  const { data: lastItem, error } = await supabaseAdmin
    .from("celebration_presentation_items")
    .select("sort_order")
    .eq("presentation_id", presentationId)
    .is("removed_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "CELEBRATION VIDEO ITEM ORDER ERROR:",
      error
    );
  }

  return Number(lastItem?.sort_order ?? -1) + 1;
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

    const presentation = await getAuthorizedPresentation(
      req,
      publicId
    );

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "Editing access is not available for this presentation.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const uploadId = String(body?.uploadId || "").trim();

    if (!uploadId) {
      return NextResponse.json(
        {
          error: "Missing video upload ID.",
        },
        { status: 400 }
      );
    }

    const upload = await mux.video.uploads.retrieve(uploadId);

    const passthrough = String(
      (upload as any)?.new_asset_settings?.passthrough || ""
    );

    if (passthrough !== `celebration:${publicId}`) {
      return NextResponse.json(
        {
          error:
            "This video upload does not belong to this presentation.",
        },
        { status: 403 }
      );
    }

    const assetId = upload.asset_id;

    if (!assetId) {
      return NextResponse.json(
        {
          error: "Video is still processing.",
        },
        { status: 202 }
      );
    }

    const asset = await mux.video.assets.retrieve(assetId);

    const assetPassthrough = String(
      (asset as any)?.passthrough || ""
    );

    if (
      assetPassthrough &&
      assetPassthrough !== `celebration:${publicId}`
    ) {
      return NextResponse.json(
        {
          error:
            "This video does not belong to this presentation.",
        },
        { status: 403 }
      );
    }

    const durationSeconds = Number(asset.duration || 0);

    if (
      Number.isFinite(durationSeconds) &&
      durationSeconds > MAX_VIDEO_SECONDS
    ) {
      try {
        await mux.video.assets.delete(assetId);
      } catch (deleteError) {
        console.error(
          "CELEBRATION OVERLENGTH VIDEO DELETE ERROR:",
          deleteError
        );
      }

      return NextResponse.json(
        {
          error:
            "Videos must be 5 minutes or less.",
        },
        { status: 400 }
      );
    }

    const playbackId = asset.playback_ids?.[0]?.id;

    if (!playbackId) {
      return NextResponse.json(
        {
          error: "Video is still processing.",
        },
        { status: 202 }
      );
    }

    const {
      data: existingItem,
      error: existingError,
    } = await supabaseAdmin
      .from("celebration_presentation_items")
      .select(`
        id,
        item_type,
        photo_url,
        mux_asset_id,
        mux_playback_id,
        caption,
        attribution,
        source,
        approval_status,
        sort_order,
        duration_seconds,
        created_at,
        updated_at
      `)
      .eq("presentation_id", presentation.id)
      .eq("mux_asset_id", assetId)
      .is("removed_at", null)
      .maybeSingle();

    if (existingError) {
      console.error(
        "CELEBRATION EXISTING VIDEO ITEM ERROR:",
        existingError
      );
    }

    if (existingItem) {
      return NextResponse.json({
        success: true,
        item: existingItem,
      });
    }

    const nextSortOrder = await getNextSortOrder(
      presentation.id
    );

    const {
      data: item,
      error: insertError,
    } = await supabaseAdmin
      .from("celebration_presentation_items")
      .insert({
        presentation_id: presentation.id,
        item_type: "video",
        photo_url: null,
        storage_path: null,
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        caption: "",
        attribution: "",
        source: "creator",
        approval_status: "approved",
        sort_order: nextSortOrder,
        duration_seconds:
          Number.isFinite(durationSeconds) &&
          durationSeconds > 0
            ? Math.ceil(durationSeconds)
            : null,
      })
      .select(`
        id,
        item_type,
        photo_url,
        mux_asset_id,
        mux_playback_id,
        caption,
        attribution,
        source,
        approval_status,
        sort_order,
        duration_seconds,
        created_at,
        updated_at
      `)
      .single();

    if (insertError || !item) {
      console.error(
        "CREATE CELEBRATION VIDEO ITEM ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "The video could not be added to the presentation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error(
      "CELEBRATION VIDEO PLAYBACK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The video could not be prepared for playback.",
      },
      { status: 500 }
    );
  }
}
