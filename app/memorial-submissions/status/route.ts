import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function parseVideoUrls(value: string[] | string | null | undefined): string[] {
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

function getBaseVideoLimit(plan: string | null | undefined) {
  if (plan === "premium") return 10;
  if (plan === "plus") return 5;
  return 2;
}

export async function POST(req: Request) {
  
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
    }

    const { submissionId, status } = await req.json();

    if (!submissionId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("memorial_submissions")
      .select("id, memorial_id, video_urls")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select("id, owner_id, plan, extra_video_minutes, video_urls")
      .eq("id", submission.memorial_id)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json({ error: "Memorial not found." }, { status: 404 });
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to review this submission." },
        { status: 403 }
      );
    }

    if (status === "approved") {
      const existingMemorialVideos = parseVideoUrls(memorial.video_urls);
      const submittedVideos = parseVideoUrls(submission.video_urls);

      const { data: approvedSubmissions, error: approvedError } =
        await supabaseAdmin
          .from("memorial_submissions")
          .select("id, video_urls")
          .eq("memorial_id", submission.memorial_id)
          .eq("status", "approved")
          .neq("id", submissionId);

      if (approvedError) {
        return NextResponse.json(
          { error: approvedError.message },
          { status: 500 }
        );
      }

      const approvedContributorVideoCount =
        approvedSubmissions?.reduce((total, approvedSubmission) => {
          return total + parseVideoUrls(approvedSubmission.video_urls).length;
        }, 0) || 0;

      const baseLimit = getBaseVideoLimit(memorial.plan);
      const extraSlots = Number(memorial.extra_video_minutes || 0);
      const effectiveLimit = baseLimit + extraSlots;

      const projectedTotal =
        existingMemorialVideos.length +
        approvedContributorVideoCount +
        submittedVideos.length;

      if (submittedVideos.length > 0 && projectedTotal > effectiveLimit) {
        const extraVideosNeeded = projectedTotal - effectiveLimit;

        return NextResponse.json(
          {
            error: `This memorial has reached its video limit. Purchase ${extraVideosNeeded} extra video slot${
              extraVideosNeeded === 1 ? "" : "s"
            } to approve this submission.`,
            needsExtraVideoPurchase: true,
            extraVideosNeeded,
          },
          { status: 402 }
        );
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("memorial_submissions")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", submissionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SUBMISSION STATUS API ERROR:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}