import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

const publicIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_CELEBRATION_PRICE_ID;

  if (!publicIdPattern.test(publicId)) {
    return NextResponse.json({ error: "Presentation not found." }, { status: 404 });
  }
  if (!stripeKey || !priceId) {
    return NextResponse.json({ error: "Presentation payments are not available yet." }, { status: 503 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { data: presentation, error } = await admin.from("celebration_presentations")
    .select("id, public_id, customer_email, person_name, price_cents, hosting_days, edit_token_hash, status, payment_status, stripe_checkout_session_id")
    .eq("public_id", publicId).maybeSingle();

  if (error || !presentation) {
    return NextResponse.json({ error: "Presentation not found." }, { status: 404 });
  }
  const token = req.cookies.get(`celebration_edit_${publicId}`)?.value || "";
  const supplied = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const expected = Buffer.from(String(presentation.edit_token_hash || ""));
  if (!token || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Editing access is required to purchase this presentation." }, { status: 403 });
  }
  if (presentation.payment_status === "paid") {
    return NextResponse.json({ error: "This presentation has already been purchased." }, { status: 409 });
  }
  if (presentation.status !== "draft" || presentation.price_cents !== 2995 || presentation.hosting_days !== 60) {
    return NextResponse.json({ error: "This presentation is not available for checkout." }, { status: 409 });
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });
    if (presentation.stripe_checkout_session_id) {
      const previous = await stripe.checkout.sessions.retrieve(presentation.stripe_checkout_session_id);
      if (previous.status === "open" && previous.url) {
        return NextResponse.json({ url: previous.url }, { headers: { "Cache-Control": "no-store" } });
      }
      if (previous.status === "complete") {
        return NextResponse.json({ error: "Your recent payment is being confirmed. Please refresh the builder in a moment." }, { status: 409 });
      }
    }
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.type !== "one_time" || price.currency !== "usd" || price.unit_amount !== presentation.price_cents) {
      return NextResponse.json({ error: "The presentation price is not configured correctly." }, { status: 503 });
    }
    const origin = req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: presentation.customer_email,
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      metadata: { checkoutType: "celebration_presentation", presentationId: String(presentation.id), publicId },
      success_url: `${origin}/celebration-of-life-slideshow/create/${publicId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/celebration-of-life-slideshow/create/${publicId}?payment=cancelled`,
    });
    let update = admin.from("celebration_presentations")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", presentation.id).eq("payment_status", "unpaid");
    update = presentation.stripe_checkout_session_id
      ? update.eq("stripe_checkout_session_id", presentation.stripe_checkout_session_id)
      : update.is("stripe_checkout_session_id", null);
    const { data: saved, error: sessionError } = await update.select("id").maybeSingle();
    if (sessionError || !saved) {
      await stripe.checkout.sessions.expire(session.id).catch(() => null);
      return NextResponse.json({ error: "Another checkout was opened. Please try again." }, { status: 409 });
    }
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (checkoutError) {
    console.error("CELEBRATION CHECKOUT ERROR:", checkoutError);
    return NextResponse.json({ error: "Checkout could not be started. Please try again." }, { status: 500 });
  }
}
