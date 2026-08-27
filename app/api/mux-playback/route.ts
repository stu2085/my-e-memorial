import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

async function hasAuthorizedOwnerAccess(
  req: NextRequest,
  memorialId: number | null
): Promise<boolean> {
  const authorization = req.headers.get("authorization") || "";

  const accessToken = authorization
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!accessToken) {
    return false;
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return false;
  }

  if (!memorialId) {
    return true;
  }

  const { data: memorial, error: memorialError } =
    await supabaseAdmin
      .from("memorials")
      .select("owner_id")
      .eq("id", memorialId)
      .maybeSingle();

  if (memorialError || !memorial) {
    return false;
  }

  return memorial.owner_id === user.id;
}

async function hasAuthorizedBackupAccess(
  req: NextRequest,
  memorialId: number | null
): Promise<boolean> {
  if (!memorialId) {
    return false;
  }

  const accessCheckUrl = new URL(
    `/api/backup-access?memorialId=${encodeURIComponent(
      String(memorialId)
    )}`,
    req.url
  );

  const accessCheckResponse = await fetch(accessCheckUrl, {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  if (!accessCheckResponse.ok) {
    return false;
  }

  const accessCheckResult = await accessCheckResponse.json();

  return accessCheckResult?.valid === true;
}

async function hasAuthorizedVisitorSubmissionAccess(
  memorialId: number | null
): Promise<boolean> {
  if (!memorialId) {
    return false;
  }

  const { data: memorial, error: memorialError } =
    await supabaseAdmin
      .from("memorials")
      .select("id, is_published, is_draft")
      .eq("id", memorialId)
      .maybeSingle();

  if (memorialError || !memorial) {
    return false;
  }

  return memorial.is_published === true && memorial.is_draft !== true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const uploadId = String(body?.uploadId || "").trim();

    const parsedMemorialId = Number(body?.memorialId);

    const memorialId =
      Number.isFinite(parsedMemorialId) && parsedMemorialId > 0
        ? parsedMemorialId
        : null;

    const isVisitorSubmission =
      body?.uploadPurpose === "visitor_submission";

    if (!uploadId) {
      return NextResponse.json(
        { error: "Missing uploadId." },
        { status: 400 }
      );
    }

    const visitorAuthorized = isVisitorSubmission
      ? await hasAuthorizedVisitorSubmissionAccess(memorialId)
      : false;

    const ownerAuthorized = visitorAuthorized
      ? false
      : await hasAuthorizedOwnerAccess(req, memorialId);

    const backupAuthorized =
      visitorAuthorized || ownerAuthorized
        ? false
        : await hasAuthorizedBackupAccess(req, memorialId);

    if (
      !visitorAuthorized &&
      !ownerAuthorized &&
      !backupAuthorized
    ) {
      return NextResponse.json(
        {
          error: isVisitorSubmission
            ? "This memorial is not available for visitor video submissions."
            : "Authorized memorial access is required to retrieve video playback information.",
        },
        { status: 403 }
      );
    }

    const upload = await mux.video.uploads.retrieve(uploadId);
    const assetId = upload.asset_id;

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset not ready yet." },
        { status: 202 }
      );
    }

    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;

    if (!playbackId) {
      return NextResponse.json(
        { error: "No playbackId yet." },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { playbackId },
      { status: 200 }
    );
  } catch (error) {
    console.error("MUX PLAYBACK ERROR:", error);

    return NextResponse.json(
      { error: "Server error retrieving video playback information." },
      { status: 500 }
    );
  }
}
