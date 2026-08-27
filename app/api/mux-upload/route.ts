import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function hasAuthorizedOwnerAccess(
  req: NextRequest,
  memorialId: number | null
): Promise<boolean> {
  const authorization =
    req.headers.get("authorization") || "";

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

  /*
   * A logged-in user may create a Mux upload before a
   * brand-new memorial has an ID. If an existing memorial
   * ID is supplied, however, it must belong to that user.
   */
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

  const accessCheckResult =
    await accessCheckResponse.json();

  return accessCheckResult?.valid === true;
}


const visitorUploadAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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

function visitorUploadRateLimitPassed(
  req: NextRequest,
  memorialId: number
): boolean {
  const key = `${getClientIp(req)}:${memorialId}`;
  const now = Date.now();
  const existing = visitorUploadAttempts.get(key);

  if (existing && existing.resetAt > now) {
    if (existing.count >= 5) {
      return false;
    }

    visitorUploadAttempts.set(key, {
      count: existing.count + 1,
      resetAt: existing.resetAt,
    });
    return true;
  }

  visitorUploadAttempts.set(key, {
    count: 1,
    resetAt: now + 15 * 60 * 1000,
  });

  return true;
}

export async function POST(req: NextRequest) {
  try {
    let memorialId: number | null = null;
    let uploadPurpose = "owner";

    try {
      const body = await req.json();
      const parsedMemorialId = Number(body?.memorialId);

      if (
        Number.isFinite(parsedMemorialId) &&
        parsedMemorialId > 0
      ) {
        memorialId = parsedMemorialId;
      }

      if (body?.uploadPurpose === "visitor_submission") {
        uploadPurpose = "visitor_submission";
      }
    } catch {
      /*
       * Keep owner creation compatible with any older
       * caller that still sends an empty POST body.
       */
    }

    const isVisitorSubmission =
      uploadPurpose === "visitor_submission";

    const visitorAuthorized = isVisitorSubmission
      ? await hasAuthorizedVisitorSubmissionAccess(memorialId)
      : false;

    if (isVisitorSubmission && visitorAuthorized && memorialId) {
      if (!visitorUploadRateLimitPassed(req, memorialId)) {
        return NextResponse.json(
          {
            error:
              "Too many visitor video upload attempts. Please try again later.",
          },
          { status: 429 }
        );
      }
    }

    const ownerAuthorized = visitorAuthorized
      ? false
      : await hasAuthorizedOwnerAccess(
          req,
          memorialId
        );

    const backupAuthorized =
      visitorAuthorized || ownerAuthorized
        ? false
        : await hasAuthorizedBackupAccess(
            req,
            memorialId
          );

    if (
      !visitorAuthorized &&
      !ownerAuthorized &&
      !backupAuthorized
    ) {
      return NextResponse.json(
        {
          error: isVisitorSubmission
            ? "This memorial is not available for visitor video submissions."
            : "Authorized memorial access is required to upload video.",
        },
        { status: 403 }
      );
    }

    const tokenId =
      process.env.MUX_TOKEN_ID || "";
    const tokenSecret =
      process.env.MUX_TOKEN_SECRET || "";

    if (!tokenId || !tokenSecret) {
      return NextResponse.json(
        { error: "Mux is not configured." },
        { status: 500 }
      );
    }

    const allowedOrigin = req.nextUrl.origin;

    const res = await fetch(
      "https://api.mux.com/video/v1/uploads",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(
              `${tokenId}:${tokenSecret}`
            ).toString("base64"),
        },
        body: JSON.stringify({
          new_asset_settings: {
            playback_policy: ["public"],
          },
          cors_origin: allowedOrigin,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("MUX UPLOAD ERROR:", data);

      return NextResponse.json(
        { error: "Failed to create Mux upload." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: data.data.url,
      uploadId: data.data.id,
    });
  } catch (error) {
    console.error(
      "MUX UPLOAD ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error creating Mux upload." },
      { status: 500 }
    );
  }
}
