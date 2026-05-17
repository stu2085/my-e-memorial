import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../lib/supabase";
import { transporter } from "../../lib/email";

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook settings" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-04-22.dahlia",
  });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const eventId = event.id;

const { data: existingWebhook } = await supabase
  .from("processed_webhooks")
  .select("id")
  .eq("event_id", eventId)
  .maybeSingle();

if (existingWebhook) {
  

  return NextResponse.json({ received: true });
}

await supabase.from("processed_webhooks").insert({
  event_id: eventId,
});
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const advertiserId = session.metadata?.advertiserId;
    const plan = session.metadata?.plan;
const billingPlanFromCheckout = session.metadata?.billingPlan;
const customerEmail = session.customer_details?.email;

const memorialAmountPaid = session.amount_total
  ? `$${(session.amount_total / 100).toFixed(2)}`
  : "";
  const memorialId = session.metadata?.memorialId;
const quantity = Number(session.metadata?.quantity || 0);
if (
  plan === "extra_videos" &&
  memorialId &&
  quantity > 0
) {
  const { data: memorial, error: memorialError } =
    await supabase
      .from("memorials")
      .select("id, extra_video_slots")
      .eq("id", memorialId)
      .single();

  if (memorialError || !memorial) {
    console.error(
      "Extra video memorial lookup error:",
      memorialError
    );

    return NextResponse.json(
      { error: "Memorial not found." },
      { status: 404 }
    );
  }

  const currentSlots = Number(
    memorial.extra_video_slots || 0
  );

  const newTotal = currentSlots + quantity;

  const { error: updateError } = await supabase
    .from("memorials")
    .update({
      extra_video_slots: newTotal,
    })
    .eq("id", memorialId);

  if (updateError) {
    console.error(
      "Extra video slot update error:",
      updateError
    );

    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  
}
    if (plan === "advertiser" && advertiserId) {
      

const { data: existingAdvertiser, error: fetchAdvertiserError } = await supabase
  .from("advertisers")
  .select("billing_plan, expires_at")
  .eq("id", advertiserId)
  .single();

if (fetchAdvertiserError) {
  console.error("Advertiser fetch error:", fetchAdvertiserError);
  return NextResponse.json(
    { error: fetchAdvertiserError.message },
    { status: 500 }
  );
}

const now = new Date();

const currentExpiration = existingAdvertiser?.expires_at
  ? new Date(existingAdvertiser.expires_at)
  : null;

const expiresAt =
  currentExpiration && currentExpiration > now
    ? new Date(currentExpiration)
    : new Date();

const billingPlan =
  billingPlanFromCheckout ||
  existingAdvertiser?.billing_plan ||
  "monthly";

if (billingPlan === "yearly") {
  expiresAt.setMonth(expiresAt.getMonth() + 12);
} else if (billingPlan === "quarterly") {
  expiresAt.setMonth(expiresAt.getMonth() + 3);
} else {
  expiresAt.setMonth(expiresAt.getMonth() + 1);
}

const editToken =
  crypto.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const { data: advertiser, error } = await supabase
  .from("advertisers")
  .update({
    active: true,
    is_active: true,
    billing_plan: billingPlan,
    expires_at: expiresAt.toISOString(),
    reminder_7_sent: false,
    reminder_3_sent: false,
    reminder_1_sent: false,
    edit_token: editToken,
  })
  .eq("id", advertiserId)
  .select("*")
  .single();

if (error) {
  console.error("Advertiser activation error:", error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}
const amountPaid =
  billingPlan === "yearly"
    ? "$999.00"
    : billingPlan === "quarterly"
      ? "$279.00"
      : "$99.00";

const billingPlanLabel =
  billingPlan === "yearly"
    ? "Yearly"
    : billingPlan === "quarterly"
      ? "Quarterly"
      : "Monthly";
      await transporter.sendMail({
        from: `"MyEMemorial" <help@myememorial.com>`,
        to: advertiser.advertiser_email,
        subject: "Your MyEMemorial Advertising is Active",
        html: `
          <p>Hello ${advertiser.contact_name || advertiser.business_name || "Advertiser"},</p>

          <p>Thank you for your payment. Your advertising on <strong>MyEMemorial</strong> is now active.</p>

          <p><strong>Advertising Details:</strong></p>
          <ul>
            <li><strong>Business:</strong> ${advertiser.business_name}</li>
            <li><strong>ZIP Code:</strong> ${advertiser.service_zip}</li>
            <li><strong>Category:</strong> ${advertiser.business_type}</li>
            <li><strong>Billing Plan:</strong> ${billingPlanLabel}</li>
<li><strong>Amount Paid:</strong> ${amountPaid}</li>
            <li><strong>Expires:</strong> ${expiresAt.toLocaleDateString()}</li>
          </ul>

          <p>
  Your advertising will remain active until
  <strong>${expiresAt.toLocaleDateString()}</strong>.
</p>

<p>
  Renewal reminder emails will be sent before expiration so you can continue reserving your ZIP code placement.
</p>

<p>
  You can manage your advertisement here:
  <br />
  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/advertiser/${advertiser.id}/edit?token=${editToken}">
    Edit Your Advertisement
  </a>
</p>

<p>
  You can view your advertiser dashboard here:
  <br />
  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/advertiser/${advertiser.id}/dashboard">
    View Advertiser Dashboard
  </a>
</p>

<p>Please keep this email for your records.</p>

          <p>Thank you,<br/>MyEMemorial</p>
        `,
      });
    }
    if (
  customerEmail &&
  (plan === "basic" || plan === "plus" || plan === "premium")
) {
  const planLabel =
    plan === "premium"
      ? "Premium Memorial"
      : plan === "plus"
        ? "Plus Memorial"
        : "Basic Memorial";

  await transporter.sendMail({
    from: `"MyEMemorial" <help@myememorial.com>`,
    to: customerEmail,

    subject: "Your MyEMemorial Memorial Purchase Receipt",
    html: `
      <p>Hello,</p>

      <p>
        Thank you for your payment. Your
        <strong>${planLabel}</strong>
        purchase on <strong>MyEMemorial</strong> has been received.
      </p>

      <p><strong>Receipt Details:</strong></p>

      <ul>
        <li><strong>Plan:</strong> ${planLabel}</li>
        <li><strong>Amount Paid:</strong> ${memorialAmountPaid}</li>
        <li><strong>Status:</strong> Paid</li>
      </ul>

      <p>
        You may now continue creating and saving your memorial.
      </p>

      <p>Please keep this email for your records.</p>

      <p>Thank you,<br/>MyEMemorial</p>
    `,
  });
}
  return NextResponse.json({ received: true });
}
  }
