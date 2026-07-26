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

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be signed in to claim this gift." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user?.email) {
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
  gift_type,
  status,
  claimed_at,
  expires_at
`)
      .eq("claim_token", token)
      .single();

    if (giftError || !gift) {
      return NextResponse.json(
        { error: "This gift invitation could not be found." },
        { status: 404 }
      );
    }

    if (
      user.email.toLowerCase() !==
      gift.recipient_email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This gift was sent to a different email address." },
        { status: 403 }
      );
    }

    if (gift.claimed_at || gift.status === "claimed") {
      return NextResponse.json(
        { error: "This gift has already been claimed." },
        { status: 409 }
      );
    }

    if (gift.status !== "purchased") {
      return NextResponse.json(
        { error: "This gift is not ready to be claimed." },
        { status: 400 }
      );
    }

    if (
      gift.expires_at &&
      new Date(gift.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "This gift invitation has expired." },
        { status: 410 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("memorial_gifts")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        claimed_by: user.id,
      })
      .eq("id", gift.id)
      .is("claimed_at", null);

    if (updateError) {
      console.error("Gift claim update error:", updateError);

      return NextResponse.json(
        { error: "Could not claim this gift." },
        { status: 500 }
      );
    }

    return NextResponse.json({
  success: true,
  plan: gift.plan,
  giftType:
    gift.gift_type === "personal" ? "personal" : "memorial",
});
  } catch (error) {
    console.error("Gift claim error:", error);

    return NextResponse.json(
      { error: "Could not claim this gift." },
      { status: 500 }
    );
  }
}