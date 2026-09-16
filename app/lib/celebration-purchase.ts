import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { transporter } from "./email";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export async function activateCelebrationPurchase(stripe: Stripe, session: Stripe.Checkout.Session, eventCreated: number, originOverride?: string) {
  const publicId = session.metadata?.publicId || "";
  const presentationId = Number(session.metadata?.presentationId);
  const configuredPriceId = process.env.STRIPE_CELEBRATION_PRICE_ID;
  if (!configuredPriceId || !Number.isSafeInteger(presentationId) || presentationId < 1 ||
      session.payment_status !== "paid" || session.currency !== "usd" || session.amount_subtotal !== 2995) {
    throw new Error("Celebration payment failed validation.");
  }
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  if (lineItems.data.length !== 1 || lineItems.data[0].price?.id !== configuredPriceId || lineItems.data[0].quantity !== 1) {
    throw new Error("Celebration payment does not match the configured price.");
  }
  const { data: presentation, error } = await admin.from("celebration_presentations")
    .select("id, public_id, person_name, customer_email, price_cents, hosting_days, payment_status, stripe_checkout_session_id, credit_coupon_id, credit_promotion_code_id, credit_code")
    .eq("id", presentationId).eq("public_id", publicId).maybeSingle();
  if (error || !presentation || presentation.price_cents !== 2995 || presentation.hosting_days !== 60 ||
      presentation.customer_email.toLowerCase() !== (session.customer_details?.email || "").toLowerCase()) {
    throw new Error("Celebration presentation or purchaser could not be verified.");
  }
  if (presentation.payment_status === "paid" && presentation.stripe_checkout_session_id !== session.id) {
    throw new Error("This presentation has already been activated by a different payment.");
  }
  if (presentation.payment_status !== "paid" && presentation.stripe_checkout_session_id !== session.id) {
    throw new Error("This checkout session is no longer current for this presentation.");
  }

  if (presentation.payment_status !== "paid") {
    const activatedAt = new Date(eventCreated * 1000);
    const expiresAt = new Date(activatedAt.getTime() + 60 * 24 * 60 * 60 * 1000);
    const { data: activated, error: updateError } = await admin.from("celebration_presentations")
      .update({ status: "active", payment_status: "paid", amount_paid_cents: session.amount_total || 2995,
        stripe_checkout_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
        activated_at: activatedAt.toISOString(), expires_at: expiresAt.toISOString() })
      .eq("id", presentation.id).eq("payment_status", "unpaid").select("id").maybeSingle();
    if (updateError || !activated) throw new Error("Celebration payment could not be activated.");
  }

  // Stripe enforces a single redemption for this code across paid plan checkouts.
  let creditCode = presentation.credit_code as string | null;
  let couponId = presentation.credit_coupon_id as string | null;
  if (!couponId) {
    const coupon = await stripe.coupons.create({ amount_off: 2995, currency: "usd", duration: "once",
      max_redemptions: 1, name: "Celebration Presentation $29.95 Credit",
      metadata: { presentationId: String(presentation.id) } });
    couponId = coupon.id;
    const { error: couponError } = await admin.from("celebration_presentations")
      .update({ credit_coupon_id: couponId }).eq("id", presentation.id).eq("stripe_checkout_session_id", session.id);
    if (couponError) throw couponError;
  }
  if (!creditCode) {
    const promotion = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: couponId }, max_redemptions: 1,
      metadata: { presentationId: String(presentation.id) },
    });
    creditCode = promotion.code;
    const { error: creditError } = await admin.from("celebration_presentations")
      .update({ credit_promotion_code_id: promotion.id, credit_code: creditCode })
      .eq("id", presentation.id).eq("stripe_checkout_session_id", session.id);
    if (creditError) throw creditError;
  }

  // Retry-safe delivery: a webhook retry can issue a fresh single-use link.
  const accessToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(accessToken).digest("hex");
  const deliveryExpiry = new Date(eventCreated * 1000 + 60 * 24 * 60 * 60 * 1000);
  const { error: deliveryError } = await admin.from("celebration_presentations")
    .update({ email_access_token_hash: tokenHash, email_access_expires_at: deliveryExpiry.toISOString() })
    .eq("id", presentation.id).eq("stripe_checkout_session_id", session.id);
  if (deliveryError) throw deliveryError;

  const origin = new URL(originOverride || process.env.NEXT_PUBLIC_SITE_URL || "https://www.myememorial.com").origin;
  const link = `${origin}/celebration-of-life-slideshow/access/${publicId}?token=${accessToken}`;
  const viewingLink = `${origin}/celebration-of-life-slideshow/${publicId}`;
  const thankYou = "As a thank you for purchasing a Celebration of Life Presentation, your purchase includes a single-use $29.95 credit toward a new Basic, Plus, or Premium MyEMemorial.";
  await transporter.sendMail({
    from: '"MyEMemorial" <help@myememorial.com>', to: presentation.customer_email,
    subject: "Your Celebration of Life Presentation is ready",
    html: `<p>Thank you for your purchase.</p><p>Your Celebration of Life Presentation for <strong>${escapeHtml(presentation.person_name)}</strong> is ready to edit and share for 60 days.</p><p><a href="${viewingLink}">View and share the presentation</a></p><p>Share this viewing link with family or the event venue: ${viewingLink}</p><p><a href="${link}">Open your private presentation builder</a></p><p>This private edit link may be used once during your 60-day hosting period. Do not share it with viewers.</p><p>${escapeHtml(thankYou)}</p><p>Enter your single-use credit code <strong>${escapeHtml(creditCode)}</strong> when purchasing a new paid MyEMemorial in Stripe Checkout.</p><p>MyEMemorial</p>`,
    text: `Your Celebration of Life Presentation for ${presentation.person_name} is ready to edit and share for 60 days.\n\nView and share the presentation: ${viewingLink}\n\nYour private builder link: ${link}\nThis private edit link may be used once during your 60-day hosting period. Do not share it with viewers.\n\n${thankYou}\nEnter your single-use credit code when purchasing a new paid MyEMemorial in Stripe Checkout: ${creditCode}`,
  });
}

export async function cancelFullyRefundedCelebration(stripe: Stripe, charge: Stripe.Charge) {
  if (!charge.payment_intent || charge.amount_refunded < charge.amount) return;
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;
  const { data: presentation, error } = await admin.from("celebration_presentations")
    .select("id, credit_promotion_code_id, payment_status")
    .eq("stripe_payment_intent_id", paymentIntentId).maybeSingle();
  if (error) throw error;
  if (!presentation || presentation.payment_status === "refunded") return;
  if (presentation.credit_promotion_code_id) {
    await stripe.promotionCodes.update(presentation.credit_promotion_code_id, { active: false });
  }
  const { error: updateError } = await admin.from("celebration_presentations")
    .update({ status: "cancelled", payment_status: "refunded", email_access_token_hash: null,
      email_access_expires_at: null })
    .eq("id", presentation.id).eq("payment_status", "paid");
  if (updateError) throw updateError;
}
