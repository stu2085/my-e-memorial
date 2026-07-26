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
  _request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: "Missing gift claim token." },
        { status: 400 }
      );
    }

    const { data: gift, error } = await supabaseAdmin
      .from("memorial_gifts")
     .select(`
  id,
  purchaser_name,
  recipient_name,
  recipient_email,
  personal_message,
  plan,
  gift_type,
  status,
  expires_at,
  claimed_at
`)
      .eq("claim_token", token)
      .single();

    if (error || !gift) {
      return NextResponse.json(
        { error: "This gift invitation could not be found." },
        { status: 404 }
      );
    }

    

    if (
  gift.status !== "purchased" &&
  gift.status !== "claimed"
) {
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

    return NextResponse.json({
  gift: {
    purchaserName: gift.purchaser_name,
    recipientName: gift.recipient_name,
    recipientEmail: gift.recipient_email,
    personalMessage: gift.personal_message,
    plan: gift.plan,
    giftType:
  gift.gift_type === "personal" ? "personal" : "memorial",
    expiresAt: gift.expires_at,
    claimed: Boolean(
      gift.claimed_at || gift.status === "claimed"
    ),
  },
});
  } catch (error) {
    console.error("GIFT CLAIM LOOKUP ERROR:", error);

    return NextResponse.json(
      { error: "Could not load this gift invitation." },
      { status: 500 }
    );
  }
}