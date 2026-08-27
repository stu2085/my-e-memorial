import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const MAX_BACKUP_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

function normalizeStorageFolder(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

function extensionForImage(
  contentType: string,
  originalName: string
) {
  const normalizedType = contentType
    .trim()
    .toLowerCase();

  if (normalizedType === "image/jpeg") return "jpg";
  if (normalizedType === "image/png") return "png";
  if (normalizedType === "image/webp") return "webp";
  if (normalizedType === "image/gif") return "gif";
  if (normalizedType === "image/heic") return "heic";
  if (normalizedType === "image/heif") return "heif";

  const originalExtension = originalName
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return originalExtension || "jpg";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const memorialId = Number(body?.memorialId);
    const bucket = String(body?.bucket || "").trim();
    const requestedFolder = normalizeStorageFolder(
      body?.folder
    );
    const originalFileName = String(
      body?.fileName || "image.jpg"
    ).trim();
    const contentType = String(
      body?.contentType || ""
    )
      .trim()
      .toLowerCase();
    const fileSize = Number(body?.fileSize || 0);

    if (
      !Number.isFinite(memorialId) ||
      memorialId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid memorial ID is required." },
        { status: 400 }
      );
    }

    if (bucket !== "memorial-photos") {
      return NextResponse.json(
        {
          error:
            "Backup Person uploads are limited to permitted memorial photos.",
        },
        { status: 403 }
      );
    }

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files may be uploaded here." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_BACKUP_IMAGE_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          error:
            "This image is too large to upload. Please choose a smaller image.",
        },
        { status: 400 }
      );
    }

    /*
     * Delegate identity, role, session age, authority version,
     * failover and revocation checks to the hardened central
     * Backup Person validator.
     */
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${encodeURIComponent(
        String(memorialId)
      )}`,
      req.url
    );

    const accessCheckResponse = await fetch(
      accessCheckUrl,
      {
        method: "GET",
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
        cache: "no-store",
      }
    );

    const accessCheckResult =
      await accessCheckResponse.json();

    if (
      !accessCheckResponse.ok ||
      accessCheckResult?.valid !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Authorized Backup Person access is required to upload this image.",
        },
        { status: 403 }
      );
    }

    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select("id, slug")
        .eq("id", memorialId)
        .maybeSingle();

    if (memorialError || !memorial?.slug) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    /*
     * A valid Backup Person session while the owner is living is
     * intentionally view-only. Media upload authority begins only
     * after independent death verification AND explicit post-death
     * activation.
     */
    const { data: handoff, error: handoffError } =
      await supabaseAdmin
        .from("memorial_legacy_handoff")
        .select(
          "death_verified_at, post_death_access_unlocked_at"
        )
        .eq("memorial_id", memorialId)
        .maybeSingle();

    if (handoffError) {
      console.error(
        "BACKUP MEDIA HANDOFF CHECK ERROR:",
        handoffError
      );

      return NextResponse.json(
        {
          error:
            "Post-death Backup Person access could not be verified.",
        },
        { status: 500 }
      );
    }

    if (
      !handoff?.death_verified_at ||
      !handoff?.post_death_access_unlocked_at
    ) {
      return NextResponse.json(
        {
          error:
            "Media uploads remain locked until the death is independently verified and post-death access is activated.",
        },
        { status: 403 }
      );
    }

    const memorialSlug = normalizeStorageFolder(
      memorial.slug
    );

    const permittedFolders = new Set([
      memorialSlug,
      `${memorialSlug}/gallery`,
    ]);

    if (
      !requestedFolder ||
      !permittedFolders.has(requestedFolder)
    ) {
      return NextResponse.json(
        {
          error:
            "This Backup Person session cannot upload to the requested memorial folder.",
        },
        { status: 403 }
      );
    }

    const extension = extensionForImage(
      contentType,
      originalFileName
    );

    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const filePath = `${requestedFolder}/${fileName}`;

    /*
     * Issue a short-lived signed token for this exact object path.
     * The browser uploads directly to Supabase Storage, avoiding a
     * large image body passing through the Next.js/Vercel function.
     */
    const {
      data: signedUpload,
      error: signedUploadError,
    } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (
      signedUploadError ||
      !signedUpload?.signedUrl
    ) {
      console.error(
        "BACKUP MEDIA SIGNED UPLOAD ERROR:",
        signedUploadError
      );

      return NextResponse.json(
        {
          error:
            "The secure image upload could not be prepared.",
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
            "The secure image upload token was not returned.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path: signedUpload.path || filePath,
      token,
    });
  } catch (error) {
    console.error(
      "BACKUP MEDIA UPLOAD TICKET ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
