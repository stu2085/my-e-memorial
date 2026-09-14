import { randomUUID, createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "memorial-audio";
const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;

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

function getExtension(
  contentType: string,
  originalFileName: string
) {
  const normalizedType = contentType.trim().toLowerCase();

  if (normalizedType === "audio/mpeg") return "mp3";
  if (normalizedType === "audio/mp4") return "m4a";
  if (normalizedType === "audio/x-m4a") return "m4a";
  if (normalizedType === "audio/aac") return "aac";
  if (normalizedType === "audio/wav") return "wav";
  if (normalizedType === "audio/x-wav") return "wav";

  const extension = originalFileName
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return extension || "mp3";
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

    const originalFileName = String(
      body?.fileName || "music.mp3"
    ).trim();

    const contentType = String(body?.contentType || "")
      .trim()
      .toLowerCase();

    const fileSize = Number(body?.fileSize || 0);

    const originalExtension =
      originalFileName
        .split(".")
        .pop()
        ?.toLowerCase() || "";

    const allowedExtensions = new Set([
      "mp3",
      "m4a",
      "aac",
      "wav",
    ]);

    if (
      !contentType.startsWith("audio/") &&
      !allowedExtensions.has(originalExtension)
    ) {
      return NextResponse.json(
        {
          error:
            "Please choose an MP3, M4A, AAC, or WAV audio file.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_AUDIO_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          error:
            "This audio file is too large. Please choose a file under 100 MB.",
        },
        { status: 400 }
      );
    }

    const extension = getExtension(
      contentType,
      originalFileName
    );

    const fileName =
      `${Date.now()}-${randomUUID()}.${extension}`;

    const filePath =
      `celebration-presentations/${publicId}/music/${fileName}`;

    const {
      data: signedUpload,
      error: signedUploadError,
    } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(filePath);

    if (
      signedUploadError ||
      !signedUpload?.signedUrl
    ) {
      console.error(
        "CELEBRATION MUSIC SIGNED UPLOAD ERROR:",
        signedUploadError
      );

      return NextResponse.json(
        {
          error:
            "The music upload could not be prepared.",
        },
        { status: 500 }
      );
    }

    const token =
      signedUpload.token ||
      new URL(signedUpload.signedUrl).searchParams.get(
        "token"
      );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "The secure music upload token was not returned.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bucket: BUCKET,
      path: signedUpload.path || filePath,
      token,
    });
  } catch (error) {
    console.error(
      "CELEBRATION MUSIC UPLOAD TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The music upload could not be prepared.",
      },
      { status: 500 }
    );
  }
}
