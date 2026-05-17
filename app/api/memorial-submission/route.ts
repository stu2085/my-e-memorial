import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "../../lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
const submissionAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
export async function POST(req: Request) {
  try {
    const {
  memorialId,
  memorialSlug,
  memorialName,
  submitterName,
  submitterEmail,
  message,
  photoUrls,
  videoUrls,
} = await req.json();
const ip = getClientIp(req);

const rateLimitKey = `${ip}:${memorialId || "unknown"}`;
const now = Date.now();

const existingAttempt = submissionAttempts.get(rateLimitKey);

if (existingAttempt && existingAttempt.resetAt > now) {
  if (existingAttempt.count >= 10) {
    return NextResponse.json(
      {
        error:
          "Too many contribution submissions. Please try again later.",
      },
      { status: 429 }
    );
  }

  submissionAttempts.set(rateLimitKey, {
    count: existingAttempt.count + 1,
    resetAt: existingAttempt.resetAt,
  });
} else {
  submissionAttempts.set(rateLimitKey, {
    count: 1,
    resetAt: now + 15 * 60 * 1000,
  });
}

    if (
  !memorialId ||
  !memorialSlug ||
  (
    !message &&
    (!photoUrls || photoUrls.length === 0) &&
    (!videoUrls || videoUrls.length === 0)
  )
) {
      return NextResponse.json(
        { error: "Missing required submission information." },
        { status: 400 }
      );
    }

    const cleanPhotoUrls = Array.isArray(photoUrls)
      ? photoUrls.filter((url) => typeof url === "string" && url.trim() !== "")
      : [];
const cleanVideoUrls = Array.isArray(videoUrls)
  ? videoUrls.filter((url) => typeof url === "string" && url.trim() !== "")
  : [];
  if ((message || "").length > 5000) {
  return NextResponse.json(
    { error: "Message is too long." },
    { status: 400 }
  );
}

if (cleanPhotoUrls.length > 20) {
  return NextResponse.json(
    { error: "Too many photos submitted." },
    { status: 400 }
  );
}

if (cleanVideoUrls.length > 10) {
  return NextResponse.json(
    { error: "Too many videos submitted." },
    { status: 400 }
  );
}
    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select("id, slug, full_name, owner_id, backup_email")
      .eq("id", memorialId)
      .maybeSingle();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    const { data: submission, error: insertError } = await supabaseAdmin
      .from("memorial_submissions")
      .insert({
        memorial_id: memorialId,
        memorial_slug: memorialSlug,
        submitter_name: submitterName || "",
        submitter_email: submitterEmail || "",
        message: message || "",
        photo_urls: cleanPhotoUrls,
video_urls: cleanVideoUrls,
status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("SUBMISSION INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    let ownerEmail = memorial.backup_email || "";

    if (memorial.owner_id) {
      const { data: ownerData, error: ownerError } =
        await supabaseAdmin.auth.admin.getUserById(memorial.owner_id);

      if (!ownerError && ownerData?.user?.email) {
        ownerEmail = ownerData.user.email;
      }
    }

    if (ownerEmail) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const photoListHtml =
        cleanPhotoUrls.length > 0
          ? `
            <p><strong>Submitted Photos:</strong></p>
            <ul>
              ${cleanPhotoUrls
                .map(
                  (url) => `
                    <li>
                      <a href="${url}" target="_blank" rel="noopener noreferrer">
                        ${url}
                      </a>
                    </li>
                  `
                )
                .join("")}
            </ul>
          `
          : "";
const videoListHtml =
  cleanVideoUrls.length > 0
    ? `
      <p><strong>Submitted Videos:</strong></p>
      <ul>
        ${cleanVideoUrls
          .map(
            (playbackId) => `
              <li>
                Mux playback ID: ${playbackId}
              </li>
            `
          )
          .join("")}
      </ul>
    `
    : "";
      await transporter.sendMail({
        from: `"MyEMemorial" <${process.env.EMAIL_USER}>`,
        to: ownerEmail,
        subject: `New contribution submitted for ${
          memorialName || memorial.full_name || "a memorial"
        }`,
        html: `
          <p>Hello,</p>

          <p>
            A visitor submitted a new contribution for
            <strong>${memorialName || memorial.full_name || "this memorial"}</strong>.
          </p>

          <p><strong>Submitted by:</strong> ${submitterName || "Not provided"}</p>
          <p><strong>Email:</strong> ${submitterEmail || "Not provided"}</p>

          <p><strong>Message:</strong></p>
          <p style="white-space: pre-line;">${message || "No message provided."}</p>

          ${photoListHtml}
${videoListHtml}
          <p>
            This contribution is pending review and has not been published.
          </p>

          <p>
            Review this contribution:<br />
<a href="${baseUrl}/memorial/${memorialSlug}/edit">
  ${baseUrl}/memorial/${memorialSlug}/edit
</a>
          </p>

          <p>
            Submission ID: ${submission.id}
          </p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("MEMORIAL SUBMISSION ERROR:", error);

    return NextResponse.json(
      { error: "Could not submit contribution." },
      { status: 500 }
    );
  }
}