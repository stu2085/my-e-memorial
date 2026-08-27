import crypto from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_PRICES: Record<string, number> = {
  basic: 4995,
  plus: 6995,
  premium: 8995,
};

export async function POST(req: Request) {
  try {
    const {
      purchaserName,
      purchaserEmail,
      recipientName,
      recipientEmail,
                  personalMessage,
      plan,
      giftType,
    } = await req.json();

    const cleanPurchaserName =
      typeof purchaserName === "string" ? purchaserName.trim() : "";

    const cleanPurchaserEmail =
      typeof purchaserEmail === "string"
        ? purchaserEmail.trim().toLowerCase()
        : "";

    const cleanRecipientName =
      typeof recipientName === "string" ? recipientName.trim() : "";

    const cleanRecipientEmail =
      typeof recipientEmail === "string"
        ? recipientEmail.trim().toLowerCase()
        : "";

    const cleanMessage =
      typeof personalMessage === "string"
        ? personalMessage.trim().slice(0, 2000)
        : "";

    const cleanPlan =
      typeof plan === "string" ? plan.trim().toLowerCase() : "";
    const cleanGiftType =
      giftType === "personal" ? "personal" : "memorial";
    if (
      !cleanPurchaserName ||
      !cleanPurchaserEmail ||
      !cleanRecipientName ||
      !cleanRecipientEmail ||
      !PLAN_PRICES[cleanPlan]
    ) {
      return NextResponse.json(
        { error: "Missing or invalid gift information." },
        { status: 400 }
      );
    }
const claimToken = crypto.randomBytes(32).toString("hex");
    const { data: gift, error: giftError } = await supabaseAdmin
      .from("memorial_gifts")
      .insert({
        purchaser_name: cleanPurchaserName,
        purchaser_email: cleanPurchaserEmail,
        recipient_name: cleanRecipientName,
        recipient_email: cleanRecipientEmail,
        personal_message: cleanMessage,
        plan: cleanPlan,
        gift_type: cleanGiftType,
        status: "pending_payment",
        claim_token: claimToken,
      })
      .select("id")
      .single();

    if (giftError || !gift) {
      console.error("GIFT INSERT ERROR:", giftError);

      return NextResponse.json(
        { error: "Could not create the gift purchase." },
        { status: 500 }
      );
    }

    const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: cleanPurchaserEmail,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PLAN_PRICES[cleanPlan],
            product_data: {
              name: `${
  cleanGiftType === "personal"
    ? "Gift a Living MyEMemorial"
    : "Gift a Deceased MyEMemorial"
} — ${cleanPlan.charAt(0).toUpperCase() + cleanPlan.slice(1)} Plan`,

description:
  cleanGiftType === "personal"
    ? `A Living MyEMemorial gift for ${cleanRecipientName}`
    : `A Deceased MyEMemorial gift for ${cleanRecipientName}`,
            },
          },
        },
      ],

      metadata: {
  checkoutType: "gift",
  giftId: gift.id,
  plan: cleanPlan,
  giftType: cleanGiftType,
},

      success_url: `${baseUrl}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
  cleanGiftType === "personal"
    ? `${baseUrl}/gift?type=personal&cancelled=true`
    : `${baseUrl}/gift?cancelled=true`,
    });

    const { error: updateError } = await supabaseAdmin
      .from("memorial_gifts")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", gift.id);

    if (updateError) {
      console.error("GIFT SESSION UPDATE ERROR:", updateError);

      return NextResponse.json(
        { error: "Could not save the Stripe Checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      giftId: gift.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("GIFT CHECKOUT ERROR:", error);

    return NextResponse.json(
      { error: "Could not begin gift checkout." },
      { status: 500 }
    );
  }
}