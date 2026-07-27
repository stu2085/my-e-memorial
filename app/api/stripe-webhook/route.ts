import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
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
let eventId = "";

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    eventId = event.id;

const { data: existingWebhook } = await supabase
  .from("processed_webhooks")
  .select("id")
  .eq("event_id", eventId)
  .maybeSingle();

if (existingWebhook) {
  

  return NextResponse.json({ received: true });
}


  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

 if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

  console.log("Stripe checkout completed metadata:", session.metadata);

    const advertiserId = session.metadata?.advertiserId;
    const plan = session.metadata?.plan;
const billingPlanFromCheckout = session.metadata?.billingPlan;
const customerEmail = session.customer_details?.email;
const canSendCustomerEmail =
  customerEmail &&
  !customerEmail.toLowerCase().endsWith("@example.com");
const checkoutType =
  session.metadata?.checkoutType ||
  session.metadata?.type;
const fromPlan = session.metadata?.fromPlan;
const toPlan = session.metadata?.toPlan;

const memorialAmountPaid = session.amount_total
  ? `$${(session.amount_total / 100).toFixed(2)}`
  : "";
  const memorialId = session.metadata?.memorialId;
const quantity = Number(session.metadata?.quantity || 0);
if (
  plan === "extra_videos" &&
  canSendCustomerEmail
) {
  const recipientMailResult = await transporter.sendMail({
    from: `"MyEMemorial" <help@myememorial.com>`,
    to: customerEmail,

    subject: "Your Video Memory PackReceipt",

    html: `
      <p>Hello,</p>

      <p>
        Thank you for purchasing additional Video Memory time for your memorial.
      </p>

      <p><strong>Receipt Details:</strong></p>

    <ul>
  <li><strong>10-Minute Video Memory Packs Purchased:</strong> ${quantity}</li>
  <li><strong>Video Memory Added:</strong> ${quantity * 10} minutes</li>
  <li><strong>Amount Paid:</strong> ${memorialAmountPaid}</li>
  <li><strong>Status:</strong> Paid</li>
</ul>

      <p>
        Your additional video upload capacity is now active.
      </p>

      <p>Please keep this email for your records.</p>

      <p>Thank you,<br/>MyEMemorial</p>
    `,
  });
 console.log("Recipient email result:", {
  accepted: recipientMailResult.accepted,
  rejected: recipientMailResult.rejected,
  response: recipientMailResult.response,
  messageId: recipientMailResult.messageId,
}); 
}

if (plan === "extra_videos") {
  const { data: memorial, error: memorialError } =
    await supabase
      .from("memorials")
      .select("id, extra_video_minutes")
      .eq("id", memorialId)
      .single();

  if (memorialError || !memorial) {
    console.error(
  "Video Memory Pack memorial lookup error:",
  memorialError
);

    return NextResponse.json(
      { error: "Memorial not found." },
      { status: 404 }
    );
  }

  const currentMinutes = Number(
  memorial.extra_video_minutes || 0
);

const newTotal = currentMinutes + quantity * 10;

const { error: updateError } = await supabase
  .from("memorials")
  .update({
    extra_video_minutes: newTotal,
  })
  .eq("id", memorialId);

  if (updateError) {
    console.error(
  "Video Memory Pack update error:",
  updateError
);

    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  
}
    if (plan === "advertiser" && advertiserId) {
      

const advertiserIdNumber = Number(advertiserId);

if (!advertiserId || Number.isNaN(advertiserIdNumber)) {
  console.error("Missing or invalid advertiserId:", advertiserId);

  return NextResponse.json(
    { error: "Invalid advertiserId" },
    { status: 400 }
  );
}

const {
  data: existingAdvertiser,
  error: fetchAdvertiserError,
} = await supabase
  .from("advertisers")
  .select("billing_plan, expires_at")
  .eq("id", advertiserIdNumber)
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
  .eq("id", advertiserIdNumber)
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
  checkoutType === "upgrade" &&
  memorialId &&
  fromPlan &&
  toPlan
) {
  const { error: upgradeError } = await supabase
    .from("memorials")
    .update({
      plan: toPlan,
    })
    .eq("id", memorialId);

  if (upgradeError) {
    console.error("Plan upgrade error:", upgradeError);

    return NextResponse.json(
      { error: upgradeError.message },
      { status: 500 }
    );
  }

  if (canSendCustomerEmail) {
    const toPlanLabel =
      toPlan === "premium"
        ? "Premium"
        : toPlan === "plus"
          ? "Plus"
          : "Basic";

    await transporter.sendMail({
      from: `"MyEMemorial" <help@myememorial.com>`,
      to: customerEmail,
      subject: "Your Memorial Plan Upgrade Receipt",
      html: `
        <p>Hello,</p>

        <p>
          Your memorial plan has been successfully upgraded to
          <strong>${toPlanLabel}</strong>.
        </p>

        <ul>
          <li><strong>Previous Plan:</strong> ${fromPlan}</li>
          <li><strong>New Plan:</strong> ${toPlanLabel}</li>
          <li><strong>Amount Paid:</strong> ${memorialAmountPaid}</li>
        </ul>

        <p>
          Your new memorial features are now active.
        </p>

        <p>Thank you,<br/>MyEMemorial</p>
      `,
    });
  }
}
if (checkoutType === "gift") {
  const giftId = session.metadata?.giftId;

  if (!giftId) {
    console.error("Gift purchase missing giftId.");

    return NextResponse.json(
      { error: "Missing giftId." },
      { status: 400 }
    );
  }

  const { data: gift, error: giftError } = await supabase
  .from("memorial_gifts")
  .select("*")
  .eq("id", giftId)
  .single();




if (giftError || !gift) {
  console.error("Gift lookup error:", giftError);

  return NextResponse.json(
    { error: "Gift not found." },
    { status: 404 }
  );
}





const purchasedAt = new Date();
const expiresAt = new Date();

expiresAt.setFullYear(expiresAt.getFullYear() + 1);

const {
  data: processedGift,
  error: giftUpdateError,
} = await supabase
  .from("memorial_gifts")
  .update({
    status: "purchased",
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    amount_paid: session.amount_total || 0,
    purchased_at: purchasedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  })
  .eq("id", gift.id)
  .eq("status", "pending_payment")
  .eq("stripe_checkout_session_id", session.id)
  .select("id")
  .maybeSingle();

if (giftUpdateError) {
  console.error("Gift purchase update error:", giftUpdateError);

  return NextResponse.json(
    { error: "Could not update gift purchase." },
    { status: 500 }
  );
}

if (!processedGift) {
  console.log(
    `Gift ${gift.id} was already processed. Skipping duplicate webhook emails.`
  );

  return NextResponse.json({
    received: true,
    duplicate: true,
  });
}

const giftPlanLabel =
  gift.plan === "premium"
    ? "Premium Memorial"
    : gift.plan === "plus"
      ? "Plus Memorial"
      : "Basic Memorial";

const giftPurchaserEmail =
  gift.purchaser_email || customerEmail;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const giftLogoUrl =
  `${siteUrl}/images/myememorial-full-logo.jpg`;

if (giftPurchaserEmail) {
  await transporter.sendMail({
    from: `"MyEMemorial" <help@myememorial.com>`,
    to: giftPurchaserEmail,
    subject: "Your MyEMemorial Gift Purchase Confirmation",
    html: `
  
  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #f5f5f4;
      font-family: Arial, Helvetica, sans-serif;
      color: #172554;
    "
  >
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table
          role="presentation"
          width="620"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width: 620px;
            max-width: 620px;
            background-color: #ffffff;
            border: 1px solid #d6d3d1;
            border-collapse: collapse;
          "
        >
          <tr>
            <td
              style="
                padding: 12px 24px;
                background-color: #082454;
                color: #ffffff;
                text-align: center;
                font-size: 16px;
                font-weight: 700;
              "
            >
              Thank you for your thoughtful gift
            </td>
          </tr>

          <tr>
            <td style="padding: 18px 22px;">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td
                    align="center"
                    style="padding: 0 0 28px;"
                  >
                    <img
                      src="${giftLogoUrl}"
                      alt="MyEMemorial — The Story Between the Dates"
                      width="420"
                      style="
                        display: block;
                        width: 100%;
                        max-width: 420px;
                        height: auto;
                        margin: 0 auto;
                        border: 0;
                      "
                    />
                  </td>
                </tr>
              </table>

              <h1
                style="
                  margin: 0 0 24px;
                  color: #082454;
                  text-align: center;
                  font-size: 28px;
                  line-height: 1.25;
                "
              >
                Thank You for Your Purchase!
              </h1>

              <p
                style="
                  margin: 0 0 16px;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Hello${gift.purchaser_name ? ` ${gift.purchaser_name}` : ""},
              </p>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Thank you for gifting a MyEMemorial. Your gift is a meaningful
                way to help someone preserve and share the story of a life
                well lived.
              </p>

              <div
                style="
                  margin: 28px 0;
                  border-top: 1px solid #d59a18;
                "
              ></div>

              <h2
                style="
                  margin: 0 0 16px;
                  color: #b77900;
                  font-size: 21px;
                "
              >
                Gift Details
              </h2>

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 15px;
                "
              >
                <tr>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      font-weight: 700;
                      color: #334155;
                    "
                  >
                    Recipient
                  </td>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      text-align: right;
                      color: #0f172a;
                    "
                  >
                    ${gift.recipient_name}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      font-weight: 700;
                      color: #334155;
                    "
                  >
                    Recipient Email
                  </td>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      text-align: right;
                      color: #0f172a;
                    "
                  >
                    ${gift.recipient_email}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      font-weight: 700;
                      color: #334155;
                    "
                  >
                    Plan
                  </td>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      text-align: right;
                      color: #0f172a;
                    "
                  >
                    ${giftPlanLabel}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      font-weight: 700;
                      color: #334155;
                    "
                  >
                    Amount Paid
                  </td>
                  <td
                    style="
                      padding: 12px 8px;
                      border-bottom: 1px solid #e7e5e4;
                      text-align: right;
                      color: #0f172a;
                    "
                  >
                    ${memorialAmountPaid}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 12px 8px;
                      font-weight: 700;
                      color: #334155;
                    "
                  >
                    Status
                  </td>
                  <td
                    style="
                      padding: 12px 8px;
                      text-align: right;
                      color: #0f172a;
                    "
                  >
                    Purchased
                  </td>
                </tr>
              </table>

              <div
                style="
                  margin-top: 28px;
                  padding: 20px;
                  background-color: #faf7f2;
                  border: 1px solid #eee4d7;
                  border-radius: 10px;
                "
              >
                <h2
                  style="
                    margin: 0 0 10px;
                    color: #b77900;
                    font-size: 20px;
                  "
                >
                  What Happens Next?
                </h2>

                <p
                  style="
                    margin: 0;
                    color: #334155;
                    font-size: 15px;
                    line-height: 1.7;
                  "
                >
                  We have sent ${gift.recipient_name} an email with
                  ${gift.personal_message ? "your personal message and " : ""}
                  instructions for accepting the MyEMemorial gift. Once accepted,
                  the recipient can begin creating the memorial and preserving
                  meaningful memories.
                </p>
              </div>

              <div
                style="
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e7e5e4;
                  color: #64748b;
                  text-align: center;
                  font-size: 13px;
                  line-height: 1.6;
                "
              >
                Every life deserves to be remembered for more than two dates.<br />
                <strong style="color: #082454;">
                  MyEMemorial — The Story Between the Dates.
                </strong>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`,
  });
}

const giftRecipientEmail = gift.recipient_email;

if (giftRecipientEmail && gift.claim_token) {
  const claimUrl =
  `${siteUrl}/gift/claim/${gift.claim_token}`;

console.log("Recipient claim URL:", claimUrl);

  const personalMessageHtml = gift.personal_message
    ? `
      <div
        style="
          margin: 24px 0;
          padding: 18px 20px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        "
      >
        <p
          style="
            margin: 0 0 10px;
            color: #082454;
            font-size: 15px;
            font-weight: 700;
          "
        >
          A personal message from ${gift.purchaser_name}:
        </p>

        <p
          style="
            margin: 0;
            color: #334155;
            font-size: 16px;
            line-height: 1.7;
            white-space: pre-wrap;
          "
        >
          ${gift.personal_message}
        </p>
      </div>
    `
    : "";
    const recipientInstructions =
  gift.gift_type === "personal"
    ? "There is nothing to purchase. Simply accept your gift and begin creating your Personal E-Memorial whenever you're ready."
    : "There is nothing to purchase. Simply accept your gift and begin preserving the life story and memories of your loved one whenever you're ready.";
const recipientIntro =
  gift.gift_type === "personal"
    ? `
      <strong>${gift.purchaser_name}</strong> has gifted you a
      <strong>Personal E-Memorial</strong> — a beautiful way to preserve
      your memories, photos, videos, stories, and life experiences so
      future generations can truly know you.
    `
    : `
      <strong>${gift.purchaser_name}</strong> has gifted you a
      <strong>MyEMemorial</strong> — a beautiful way to preserve the life,
      memories, photos, videos, stories, and legacy of someone you love
      for future generations.
    `;
  const recipientMailResult = await transporter.sendMail({
    from: `"MyEMemorial" <help@myememorial.com>`,
    to: giftRecipientEmail,
    subject: `${gift.purchaser_name} gifted you a MyEMemorial`,
    html: `
      <table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width: 100%;
    background-color: #f5f5f4;
    font-family: Arial, Helvetica, sans-serif;
    color: #172554;
  "
>
  <tr>
    <td align="center" style="padding: 20px 10px;">
      <table
        role="presentation"
        width="620"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          width: 620px;
          max-width: 620px;
          background-color: #ffffff;
          border: 1px solid #d6d3d1;
        "
      >
        <tr>
          <td>
          <div
            style="
              padding: 12px 24px;
              background-color: #082454;
              color: #ffffff;
              text-align: center;
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            "
          >
            A Gift from MyEMemorial
          </div>

         <table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="width: 100%; border-collapse: collapse;"
>
  <tr>
    <td style="padding: 24px 48px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <img
                src="${giftLogoUrl}"
                alt="MyEMemorial — The Story Between the Dates"
                width="420"
                style="
                  display: block;
                  width: 100%;
                  max-width: 420px;
                  height: auto;
                  margin: 0 auto;
                  border: 0;
                "
              />
            </div>

            <h1
              style="
                margin: 0 0 26px;
                color: #082454;
                text-align: center;
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 32px;
                line-height: 1.3;
              "
            >
              ${gift.purchaser_name} has gifted you a MyEMemorial.
            </h1>

            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
              Hello${gift.recipient_name ? ` ${gift.recipient_name}` : ""},
            </p>

            <p
              style="
                margin: 0 0 24px;
                color: #172554;
                font-size: 17px;
                line-height: 1.7;
              "
            >
             ${recipientIntro} 
            </p>

            <table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width: 100%;
    border-collapse: separate;
    background-color: #faf7f2;
    border: 1px solid #eee4d7;
    border-radius: 12px;
  "
>
  <tr>
    <td
      style="
        padding: 22px 24px;
        color: #172554;
        font-family: Arial, Helvetica, sans-serif;
      "
    >
      <h2
        style="
          margin: 0 0 10px;
          color: #082454;
          font-size: 19px;
          line-height: 1.4;
        "
      >
        Your MyEMemorial has already been paid for.
      </h2>

      <p
        style="
          margin: 0;
          color: #334155;
          font-size: 15px;
          line-height: 1.7;
        "
      >
        ${recipientInstructions}
      </p>

      ${personalMessageHtml}

      <table
        role="presentation"
        cellpadding="0"
        cellspacing="0"
        border="0"
        align="center"
        style="margin: 28px auto 18px;"
      >
        <tr>
          <td
  align="center"
  bgcolor="#c98a00"
  style="
    background-color: #c98a00;
    border-radius: 8px;
  "
>
  <a
    href="${claimUrl}"
    style="
      display: inline-block;
      padding: 15px 32px;
      color: #ffffff;
      text-decoration: none;
      font-size: 17px;
      font-weight: 700;
      font-family: Arial, Helvetica, sans-serif;
      border-radius: 8px;
    "
  >
    Accept Your Gift
  </a>
</td>
        </tr>
      </table>

      <p
        style="
          margin: 0;
          color: #475569;
          text-align: center;
          font-size: 13px;
          line-height: 1.6;
        "
      >
        Secure. Private. Yours to keep forever.
      </p>
    </td>
  </tr>
</table>

            <p
              style="
                margin: 24px 0 0;
                color: #475569;
                text-align: center;
                font-size: 14px;
                line-height: 1.7;
              "
            >
              This gift must be claimed by
              <strong>${expiresAt.toLocaleDateString("en-US")}</strong>.
            </p>

            <p
              style="
                margin: 12px 0 0;
                color: #64748b;
                text-align: center;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              If you were not expecting this email, you may safely ignore it.
            </p>
    </td>
  </tr>
</table>

          <div
            style="
              padding: 22px 28px;
              background-color: #faf7f2;
              color: #334155;
              text-align: center;
              font-size: 14px;
              line-height: 1.7;
            "
          >
            Every life has a story worth remembering.<br />
            <strong style="color: #082454;">
              MyEMemorial — The Story Between the Dates.
            </strong>
          </div>
        </div>
      </div>
    `,
  });
console.log("Recipient gift email result:", {
  accepted: recipientMailResult.accepted,
  rejected: recipientMailResult.rejected,
  pending: recipientMailResult.pending,
  response: recipientMailResult.response,
  messageId: recipientMailResult.messageId,
});
  const { error: recipientEmailUpdateError } = await supabase
    .from("memorial_gifts")
    .update({
      recipient_email_sent_at: new Date().toISOString(),
    })
    .eq("id", gift.id);

  if (recipientEmailUpdateError) {
    console.error(
      "Recipient email timestamp update error:",
      recipientEmailUpdateError
    );
  }
}

}
if (
  canSendCustomerEmail &&
  checkoutType !== "upgrade" &&
checkoutType !== "gift" &&
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

const { error: processedError } = await supabase
  .from("processed_webhooks")
  .upsert(
    {
      event_id: eventId,
    },
    {
      onConflict: "event_id",
      ignoreDuplicates: true,
    }
  );

if (processedError) {
  console.error("Processed webhook insert error:", processedError);

  return NextResponse.json(
    { error: "Could not record processed webhook." },
    { status: 500 }
  );
}

}

return NextResponse.json({ received: true });
}