import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const MAX_VIDEO_SIZE_BYTES = 1000 * 1000 * 1000;
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

    const contentType = String(body?.contentType || "")
      .trim()
      .toLowerCase();

    const fileSize = Number(body?.fileSize || 0);
    const durationSeconds = Number(body?.durationSeconds || 0);

    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        {
          error: "Please choose a video.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_VIDEO_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          error: "Videos must be 1 GB or smaller.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0 ||
      durationSeconds > MAX_VIDEO_SECONDS
    ) {
      return NextResponse.json(
        {
          error: "Videos must be 5 minutes or less.",
        },
        { status: 400 }
      );
    }

    const tokenId = process.env.MUX_TOKEN_ID || "";
    const tokenSecret = process.env.MUX_TOKEN_SECRET || "";

    if (!tokenId || !tokenSecret) {
      return NextResponse.json(
        {
          error: "Video service is not configured.",
        },
        { status: 500 }
      );
    }

    const muxResponse = await fetch(
      "https://api.mux.com/video/v1/uploads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`${tokenId}:${tokenSecret}`).toString(
              "base64"
            ),
        },
        body: JSON.stringify({
          new_asset_settings: {
            playback_policy: ["public"],
            passthrough: `celebration:${publicId}`,
          },
          cors_origin: req.nextUrl.origin,
        }),
      }
    );

    const muxResult = await muxResponse.json();

    if (!muxResponse.ok) {
      console.error(
        "CELEBRATION MUX UPLOAD ERROR:",
        muxResult
      );

      return NextResponse.json(
        {
          error: "The video upload could not be prepared.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: muxResult.data.url,
      uploadId: muxResult.data.id,
    });
  } catch (error) {
    console.error(
      "CELEBRATION VIDEO UPLOAD ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "The video upload could not be prepared.",
      },
      { status: 500 }
    );
  }
}
