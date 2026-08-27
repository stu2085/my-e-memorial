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

function getBaseVideoLimit(
  plan: string | null | undefined
) {
  if (plan === "premium") return 10;
  if (plan === "plus") return 5;
  return 2;
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
        "id, owner_id, plan, extra_video_minutes, is_living_preplan"
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
        "id, owner_id, plan, extra_video_minutes, is_living_preplan"
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
      const submittedVideos =
        parseVideoUrls(
          submission.video_urls
        );

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

      const approvedContributorVideoCount =
        approvedSubmissions?.reduce(
          (
            total,
            approvedSubmission
          ) => {
            return (
              total +
              parseVideoUrls(
                approvedSubmission.video_urls
              ).length
            );
          },
          0
        ) || 0;

      const baseLimit =
        getBaseVideoLimit(memorial.plan);

      const extraMinutes = Number(
        memorial.extra_video_minutes || 0
      );

      const effectiveLimit =
        baseLimit + extraMinutes;

      const projectedTotal =
        approvedContributorVideoCount +
        submittedVideos.length;

      if (
        submittedVideos.length > 0 &&
        projectedTotal > effectiveLimit
      ) {
        const extraVideosNeeded =
          projectedTotal -
          effectiveLimit;

        return NextResponse.json(
          {
            error:
              `This memorial has reached its video limit. Purchase ${extraVideosNeeded} additional video minute${
                extraVideosNeeded === 1
                  ? ""
                  : "s"
              } to approve this submission.`,
            needsExtraVideoPurchase: true,
            extraVideosNeeded,
          },
          { status: 402 }
        );
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
