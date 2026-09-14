import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "memorial-audio";
const MAX_MUSIC_TRACKS = 5;

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

    const storagePath = String(
      body?.storagePath || ""
    ).trim();

    const title = String(
      body?.title || "Music"
    )
      .trim()
      .slice(0, 200);

    const expectedPrefix =
      `celebration-presentations/${publicId}/music/`;

    if (
      !storagePath ||
      !storagePath.startsWith(expectedPrefix)
    ) {
      return NextResponse.json(
        {
          error:
            "This music file does not belong to this presentation.",
        },
        { status: 400 }
      );
    }

    const {
      count,
      error: countError,
    } = await supabaseAdmin
      .from("celebration_presentation_music")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("presentation_id", presentation.id)
      .is("removed_at", null);

    if (countError) {
      console.error(
        "CELEBRATION MUSIC COUNT ERROR:",
        countError
      );
    }

    if ((count || 0) >= MAX_MUSIC_TRACKS) {
      return NextResponse.json(
        {
          error:
            "You can add up to 5 music files.",
        },
        { status: 400 }
      );
    }

    const {
      data: publicUrlData,
    } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const sourceUrl = String(
      publicUrlData?.publicUrl || ""
    ).trim();

    if (!sourceUrl) {
      return NextResponse.json(
        {
          error:
            "The uploaded music file could not be found.",
        },
        { status: 500 }
      );
    }

    const {
      data: lastMusic,
      error: orderError,
    } = await supabaseAdmin
      .from("celebration_presentation_music")
      .select("sort_order")
      .eq("presentation_id", presentation.id)
      .is("removed_at", null)
      .order("sort_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error(
        "CELEBRATION MUSIC ORDER ERROR:",
        orderError
      );
    }

    const nextSortOrder =
      Number(lastMusic?.sort_order ?? -1) + 1;

    const {
      data: music,
      error: insertError,
    } = await supabaseAdmin
      .from("celebration_presentation_music")
      .insert({
        presentation_id: presentation.id,
        source_type: "uploaded",
        source_url: sourceUrl,
        storage_path: storagePath,
        title: title || "Music",
        artist: "",
        sort_order: nextSortOrder,
      })
      .select(`
        id,
        source_type,
        source_url,
        storage_path,
        title,
        artist,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (insertError || !music) {
      console.error(
        "CREATE CELEBRATION MUSIC ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "The music could not be added to the presentation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      music,
    });
  } catch (error) {
    console.error(
      "CREATE CELEBRATION MUSIC ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The music could not be added to the presentation.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const musicId = Number(body?.musicId);

    if (
      !Number.isFinite(musicId) ||
      musicId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Music not found.",
        },
        { status: 400 }
      );
    }

    const {
      data: removed,
      error: removeError,
    } = await supabaseAdmin
      .from("celebration_presentation_music")
      .update({
        removed_at:
          new Date().toISOString(),
      })
      .eq("id", musicId)
      .eq("presentation_id", presentation.id)
      .is("removed_at", null)
      .select("id")
      .maybeSingle();

    if (
      removeError ||
      !removed
    ) {
      return NextResponse.json(
        {
          error:
            "The music could not be removed.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "REMOVE CELEBRATION MUSIC ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The music could not be removed.",
      },
      { status: 500 }
    );
  }
}
