import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.json();

  const {
  plan,
  amount,
  quantity,
  returnUrl,
  advertiserId,
  isRenewal,
  billingPlan,
  memorialId,
  submissionId,
  checkoutType,
  fromPlan,
  toPlan,
} = body;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY in .env.local" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-04-22.dahlia",
  });

  try {
    const unitAmount = Number(amount);
    let safeUnitAmount = unitAmount;

if (plan === "extra_videos") {
  const safeQuantity = Number(quantity);

  if (!Number.isInteger(safeQuantity) || safeQuantity < 1 || safeQuantity > 20) {
    return NextResponse.json(
      { error: "Invalid extra video quantity." },
      { status: 400 }
    );
  }

  safeUnitAmount = safeQuantity * 1895;
}

if (checkoutType !== "upgrade") {
  if (plan === "basic") safeUnitAmount = 100;
  if (plan === "plus") safeUnitAmount = 12495;
  if (plan === "premium") safeUnitAmount = 100;
}

    

    const separator = returnUrl && returnUrl.includes("?") ? "&" : "?";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: isRenewal
                ? "Advertiser Renewal"
                : plan === "extra_videos"
                  ? "Extra Memorial Video Uploads"
                  : plan === "advertiser"
  ? "MyEMemorial Advertising"
  : "Create a Memorial",
              description: isRenewal
                ? "Renew advertising placement on MyEMemorial"
                : plan === "extra_videos"
                  ? "Additional video uploads for this memorial"
                  : plan === "advertiser"
  ? "Advertising placement on MyEMemorial"
  : "Permanent memorial page on MyEMemorial",
            },
            unit_amount: safeUnitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      metadata: {
        plan: plan || "",
        advertiserId: advertiserId || "",
        billingPlan: billingPlan || "",
        memorialId: memorialId ? String(memorialId) : "",
        submissionId: submissionId ? String(submissionId) : "",
        quantity: quantity ? String(quantity) : "",
        type: checkoutType
  ? String(checkoutType)
  : isRenewal
    ? "renewal"
    : plan === "extra_videos"
      ? "extra_videos"
      : "standard",
fromPlan: fromPlan || "",
toPlan: toPlan || "",
      },

      success_url: returnUrl
        ? `${returnUrl}${separator}success=true&session_id={CHECKOUT_SESSION_ID}`
        : "http://localhost:3000/advertise/success?success=true&session_id={CHECKOUT_SESSION_ID}",

      cancel_url: returnUrl
        ? `${returnUrl}${separator}success=false`
        : "http://localhost:3000/advertise/success?success=false",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Error creating Stripe checkout session" },
      { status: 500 }
    );
  }
}