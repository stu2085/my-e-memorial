import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type MemorialRow = {
  id: number;
  owner_id: string | null;
  plan: string | null;
  extra_video_minutes: number | null;
  is_living_preplan: boolean | null;
  video_urls?: string[] | string | null;
};

function parseVideoUrls(
  value: string[] | string | null | undefined
): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getBaseVideoMinutes(
  plan: string | null | undefined
) {
  switch ((plan || "").trim().toLowerCase()) {
    case "basic":
      return 15;
    case "plus":
      return 30;
    case "premium":
      return 60;
    default:
      return 0;
  }
}

function uniquePlaybackIds(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

function formatVideoMinutes(seconds: number) {
  const minutes = Math.max(0, seconds) / 60;
  const rounded = Math.round(minutes * 10) / 10;

  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
}

async function getMuxVideoDurationSeconds(
  playbackId: string
) {
  const tokenId = process.env.MUX_TOKEN_ID || "";
  const tokenSecret =
    process.env.MUX_TOKEN_SECRET || "";

  if (!tokenId || !tokenSecret) {
    throw new Error(
      "Mux is not configured, so video duration could not be verified."
    );
  }

  const authorization =
    "Basic " +
    Buffer.from(
      `${tokenId}:${tokenSecret}`
    ).toString("base64");

  const playbackLookupResponse = await fetch(
    `https://api.mux.com/video/v1/playback-ids/${encodeURIComponent(
      playbackId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const playbackLookupResult =
    await playbackLookupResponse.json();

  if (!playbackLookupResponse.ok) {
    throw new Error(
      `Could not look up Mux playback ID ${playbackId}.`
    );
  }

  const assetId =
    playbackLookupResult?.data?.object?.type ===
    "asset"
      ? String(
          playbackLookupResult?.data?.object?.id ||
            ""
        ).trim()
      : "";

  if (!assetId) {
    throw new Error(
      `Mux playback ID ${playbackId} is not associated with a video asset.`
    );
  }

  const assetResponse = await fetch(
    `https://api.mux.com/video/v1/assets/${encodeURIComponent(
      assetId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const assetResult = await assetResponse.json();

  if (!assetResponse.ok) {
    throw new Error(
      `Could not retrieve the Mux asset for playback ID ${playbackId}.`
    );
  }

  const durationSeconds = Number(
    assetResult?.data?.duration || 0
  );

  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    throw new Error(
      `Mux did not return a valid duration for playback ID ${playbackId}.`
    );
  }

  return durationSeconds;
}

async function getAuthenticatedUser(req: Request) {
  const authHeader =
    req.headers.get("authorization") || "";

  const token =
    authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

  if (!token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

async function hasAuthorizedPostDeathBackupAccess(
  req: Request,
  memorial: MemorialRow
) {
  try {
    const accessCheckUrl = new URL(
      `/api/backup-access?memorialId=${encodeURIComponent(
        String(memorial.id)
      )}`,
      req.url
    );

    const accessCheckResponse = await fetch(
      accessCheckUrl,
      {
        method: "GET",
        headers: {
          cookie:
            req.headers.get("cookie") || "",
        },
        cache: "no-store",
      }
    );

    const accessCheckResult =
      await accessCheckResponse.json();

    const hasActiveBackupSession =
      accessCheckResponse.ok &&
      accessCheckResult?.valid === true;

    if (!hasActiveBackupSession) {
      return false;
    }

    /*
     * After publication, is_living_preplan is false and the
     * hardened /api/backup-access validator already requires
     * independent death verification plus explicit post-death
     * activation for a former Living MyEMemorial.
     */
    if (memorial.is_living_preplan !== true) {
      return true;
    }

    /*
     * Before publication, the Living MyEMemorial still has
     * is_living_preplan=true. The active Backup Person may review
     * contributions only after death has been independently
     * verified and post-death access has been explicitly unlocked.
     *
     * While the owner is living, moderation remains owner-only.
     */
    const {
      data: legacyAccess,
      error: legacyAccessError,
    } = await supabaseAdmin
      .from("memorial_legacy_handoff")
      .select(
        "death_verified_at, post_death_access_unlocked_at"
      )
      .eq("memorial_id", memorial.id)
      .maybeSingle();

    if (legacyAccessError) {
      console.error(
        "SUBMISSION MODERATION POST-DEATH LOOKUP ERROR:",
        legacyAccessError
      );
      return false;
    }

    return (
      Boolean(legacyAccess?.death_verified_at) &&
      Boolean(
        legacyAccess?.post_death_access_unlocked_at
      )
    );
  } catch (error) {
    console.error(
      "SUBMISSION MODERATION BACKUP ACCESS ERROR:",
      error
    );
    return false;
  }
}

async function getReviewerAuthorization(
  req: Request,
  memorial: MemorialRow
) {
  const user =
    await getAuthenticatedUser(req);

  if (
    user &&
    memorial.owner_id === user.id
  ) {
    return {
      authorized: true,
      role: "owner" as const,
    };
  }

  const hasBackupAccess =
    await hasAuthorizedPostDeathBackupAccess(
      req,
      memorial
    );

  if (hasBackupAccess) {
    return {
      authorized: true,
      role: "backup" as const,
    };
  }

  return {
    authorized: false,
    role: null,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const memorialId = Number(
      url.searchParams.get("memorialId")
    );

    if (
      !Number.isSafeInteger(memorialId) ||
      memorialId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid memorial ID is required.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const {
      data: memorial,
      error: memorialError,
    } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, owner_id, plan, extra_video_minutes, is_living_preplan, video_urls"
      )
      .eq("id", memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const authorization =
      await getReviewerAuthorization(
        req,
        memorial as MemorialRow
      );

    if (!authorization.authorized) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to review visitor contributions for this memorial.",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const {
      data: submissions,
      error: submissionsError,
    } = await supabaseAdmin
      .from("memorial_submissions")
      .select(
        "id, submitter_name, submitter_email, message, photo_urls, video_urls, status, created_at"
      )
      .eq("memorial_id", memorialId)
      .eq("status", "pending")
      .order("created_at", {
        ascending: false,
      });

    if (submissionsError) {
      return NextResponse.json(
        {
          error:
            submissionsError.message,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reviewerRole: authorization.role,
        submissions: submissions || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "SUBMISSION LIST API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      submissionId,
      status,
    } = await req.json();

    if (
      !submissionId ||
      !["approved", "rejected"].includes(
        status
      )
    ) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const {
      data: submission,
      error: submissionError,
    } = await supabaseAdmin
      .from("memorial_submissions")
      .select(
        "id, memorial_id, video_urls"
      )
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      );
    }

    const {
      data: memorial,
      error: memorialError,
    } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, owner_id, plan, extra_video_minutes, is_living_preplan, video_urls"
      )
      .eq(
        "id",
        submission.memorial_id
      )
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    const authorization =
      await getReviewerAuthorization(
        req,
        memorial as MemorialRow
      );

    if (!authorization.authorized) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to review this submission.",
        },
        { status: 403 }
      );
    }

    if (status === "approved") {
      const submittedVideos = uniquePlaybackIds(
        parseVideoUrls(
          submission.video_urls
        )
      );

      if (submittedVideos.length > 0) {
        const {
          data: approvedSubmissions,
          error: approvedError,
        } = await supabaseAdmin
          .from("memorial_submissions")
          .select("id, video_urls")
          .eq(
            "memorial_id",
            submission.memorial_id
          )
          .eq("status", "approved")
          .neq("id", submissionId);

        if (approvedError) {
          return NextResponse.json(
            {
              error:
                approvedError.message,
            },
            { status: 500 }
          );
        }

        const {
          data: memorialVideoRows,
          error: memorialVideosError,
        } = await supabaseAdmin
          .from("memorial_videos")
          .select(
            "playback_id, duration_seconds"
          )
          .eq(
            "memorial_id",
            submission.memorial_id
          );

        if (memorialVideosError) {
          return NextResponse.json(
            {
              error:
                memorialVideosError.message,
            },
            { status: 500 }
          );
        }

        const ownerPlaybackIds =
          uniquePlaybackIds([
            ...parseVideoUrls(
              memorial.video_urls
            ),
            ...(memorialVideoRows || [])
              .map((video) =>
                String(
                  video.playback_id || ""
                ).trim()
              )
              .filter(Boolean),
          ]);

        const approvedContributorPlaybackIds =
          uniquePlaybackIds(
            (approvedSubmissions || []).flatMap(
              (approvedSubmission) =>
                parseVideoUrls(
                  approvedSubmission.video_urls
                )
            )
          );

        const currentPlaybackIds =
          uniquePlaybackIds([
            ...ownerPlaybackIds,
            ...approvedContributorPlaybackIds,
          ]);

        const projectedPlaybackIds =
          uniquePlaybackIds([
            ...currentPlaybackIds,
            ...submittedVideos,
          ]);

        const durationByPlaybackId =
          new Map<string, number>();

        for (const video of memorialVideoRows || []) {
          const playbackId = String(
            video.playback_id || ""
          ).trim();
          const durationSeconds = Number(
            video.duration_seconds || 0
          );

          if (
            playbackId &&
            Number.isFinite(durationSeconds) &&
            durationSeconds > 0
          ) {
            durationByPlaybackId.set(
              playbackId,
              durationSeconds
            );
          }
        }

        const playbackIdsNeedingDuration =
          projectedPlaybackIds.filter(
            (playbackId) =>
              !durationByPlaybackId.has(
                playbackId
              )
          );

        try {
          const muxDurations =
            await Promise.all(
              playbackIdsNeedingDuration.map(
                async (playbackId) => ({
                  playbackId,
                  durationSeconds:
                    await getMuxVideoDurationSeconds(
                      playbackId
                    ),
                })
              )
            );

          for (const {
            playbackId,
            durationSeconds,
          } of muxDurations) {
            durationByPlaybackId.set(
              playbackId,
              durationSeconds
            );
          }
        } catch (error) {
          console.error(
            "SUBMISSION VIDEO DURATION LOOKUP ERROR:",
            error
          );

          return NextResponse.json(
            {
              error:
                "Could not verify the submitted video duration. Please try again.",
            },
            { status: 502 }
          );
        }

        const overLengthSubmittedVideo =
          submittedVideos.find(
            (playbackId) =>
              Number(
                durationByPlaybackId.get(
                  playbackId
                ) || 0
              ) > 300
          );

        if (overLengthSubmittedVideo) {
          return NextResponse.json(
            {
              error:
                "Each submitted video must be 5 minutes or less.",
            },
            { status: 400 }
          );
        }

        const sumPlaybackDurations = (
          playbackIds: string[]
        ) =>
          playbackIds.reduce(
            (total, playbackId) =>
              total +
              Number(
                durationByPlaybackId.get(
                  playbackId
                ) || 0
              ),
            0
          );

        const currentVideoSeconds =
          sumPlaybackDurations(
            currentPlaybackIds
          );

        const submittedVideoSeconds =
          sumPlaybackDurations(
            submittedVideos
          );

        const projectedVideoSeconds =
          sumPlaybackDurations(
            projectedPlaybackIds
          );

        const baseVideoMinutes =
          getBaseVideoMinutes(
            memorial.plan
          );

        const extraVideoMinutes = Math.max(
          0,
          Number(
            memorial.extra_video_minutes || 0
          )
        );

        const availableVideoMinutes =
          baseVideoMinutes +
          extraVideoMinutes;

        const availableVideoSeconds =
          availableVideoMinutes * 60;

        if (
          projectedVideoSeconds >
          availableVideoSeconds
        ) {
          const excessSeconds =
            projectedVideoSeconds -
            availableVideoSeconds;

          const extraMinutesNeeded =
            Math.ceil(
              excessSeconds / 60
            );

          const extraPacksNeeded =
            Math.ceil(
              excessSeconds / (10 * 60)
            );

          return NextResponse.json(
            {
              error:
                `Approving this submission would use ${formatVideoMinutes(
                  projectedVideoSeconds
                )} of ${availableVideoMinutes} available video minutes. Purchase ${extraPacksNeeded} 10-minute Video Memory Pack${
                  extraPacksNeeded === 1
                    ? ""
                    : "s"
                } to approve it.`,
              needsExtraVideoPurchase: true,
              extraMinutesNeeded,
              extraPacksNeeded,
              currentVideoSeconds,
              submittedVideoSeconds,
              projectedVideoSeconds,
              availableVideoSeconds,
            },
            { status: 402 }
          );
        }
      }
    }

    const { error: updateError } =
      await supabaseAdmin
        .from("memorial_submissions")
        .update({
          status,
          approved_at:
            status === "approved"
              ? new Date().toISOString()
              : null,
        })
        .eq("id", submissionId)
        .eq(
          "memorial_id",
          submission.memorial_id
        );

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviewerRole: authorization.role,
    });
  } catch (error) {
    console.error(
      "SUBMISSION STATUS API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
