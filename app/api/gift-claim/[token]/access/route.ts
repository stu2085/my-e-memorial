import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be signed in to use this gift." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your sign-in session could not be verified." },
        { status: 401 }
      );
    }

    const { data: gift, error: giftError } = await supabaseAdmin
      .from("memorial_gifts")
      .select(`
        id,
        recipient_email,
        plan,
        status,
        claimed_at,
        claimed_by,
        expires_at
      `)
      .eq("claim_token", token)
      .single();

    if (giftError || !gift) {
      return NextResponse.json(
        { error: "This gift could not be found." },
        { status: 404 }
      );
    }

    if (
      gift.recipient_email.toLowerCase() !==
      user.email?.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This gift belongs to a different email address." },
        { status: 403 }
      );
    }

    if (
      gift.status !== "claimed" ||
      !gift.claimed_at ||
      gift.claimed_by !== user.id
    ) {
      return NextResponse.json(
        { error: "This gift has not been claimed by your account." },
        { status: 403 }
      );
    }

    if (
      gift.expires_at &&
      new Date(gift.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "This gift has expired." },
        { status: 410 }
      );
    }

    if (
      gift.plan !== "basic" &&
      gift.plan !== "plus" &&
      gift.plan !== "premium"
    ) {
      return NextResponse.json(
        { error: "This gift has an invalid memorial plan." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      giftId: gift.id,
      plan: gift.plan,
    });
  } catch (error) {
    console.error("Gift access verification error:", error);

    return NextResponse.json(
      { error: "Could not verify Gift access." },
      { status: 500 }
    );
  }
}