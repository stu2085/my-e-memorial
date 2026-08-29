import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);


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

  let verifiedFromPlan = fromPlan;

  if (checkoutType === "upgrade") {


  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "You must be signed in to upgrade this memorial." },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Your sign-in session could not be verified." },
      { status: 401 }
    );
  }

  if (!memorialId) {
    return NextResponse.json(
      { error: "Missing memorial ID." },
      { status: 400 }
    );
  }

  const { data: memorial, error: memorialError } =
    await supabaseAdmin
      .from("memorials")
      .select("id, owner_id, plan")
      .eq("id", memorialId)
      .single();

  if (memorialError || !memorial) {
    return NextResponse.json(
      { error: "Memorial not found." },
      { status: 404 }
    );
  }

  if (memorial.owner_id !== user.id) {
    return NextResponse.json(
      { error: "You do not have permission to upgrade this memorial." },
      { status: 403 }
    );
  }

  verifiedFromPlan = memorial.plan;
}
if (plan === "extra_videos" && memorialId) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      {
        error:
          "You must be signed in to purchase additional Video Memory time.",
      },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Your sign-in session could not be verified." },
      { status: 401 }
    );
  }

  const { data: memorial, error: memorialError } =
    await supabaseAdmin
      .from("memorials")
      .select("id, owner_id")
      .eq("id", memorialId)
      .single();

  if (memorialError || !memorial) {
    return NextResponse.json(
      { error: "Memorial not found." },
      { status: 404 }
    );
  }

  if (memorial.owner_id !== user.id) {
    return NextResponse.json(
      {
        error:
          "You do not have permission to purchase additional Video Memory time for this memorial.",
      },
      { status: 403 }
    );
  }
}
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

  if (
    !Number.isInteger(safeQuantity) ||
    safeQuantity < 1 ||
    safeQuantity > 20
  ) {
    return NextResponse.json(
      { error: "Invalid Video Memory Pack quantity." },
      { status: 400 }
    );
  }

  safeUnitAmount = safeQuantity * 995;
}

if (checkoutType === "upgrade") {
  const validUpgradeAmounts: Record<string, number> = {
    "free:basic": 4995,
    "free:plus": 6995,
    "free:premium": 8995,
    "basic:plus": 2000,
    "basic:premium": 4000,
    "plus:premium": 2000,
  };

  const upgradeKey = `${verifiedFromPlan}:${toPlan}`;
  const serverCalculatedAmount =
    validUpgradeAmounts[upgradeKey];

  if (!serverCalculatedAmount) {
    return NextResponse.json(
      { error: "Invalid memorial plan upgrade." },
      { status: 400 }
    );
  }

  safeUnitAmount = serverCalculatedAmount;
} else {
  if (plan === "basic") {
    safeUnitAmount = 4995;
  }

  if (plan === "plus") {
    safeUnitAmount = 6995;
  }

  if (plan === "premium") {
    safeUnitAmount = 8995;
  }
}

    

    const productionSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://myememorial.com";

const allowedOrigins = new Set([
  new URL(productionSiteUrl).origin,
  "http://localhost:3000",
]);

let safeReturnUrl = productionSiteUrl;

if (returnUrl) {
  try {
    const parsedReturnUrl = new URL(
      returnUrl,
      productionSiteUrl
    );

    if (allowedOrigins.has(parsedReturnUrl.origin)) {
      safeReturnUrl = parsedReturnUrl.toString();
    }
  } catch {
    safeReturnUrl = productionSiteUrl;
  }
}

const separator =
  safeReturnUrl.includes("?") ? "&" : "?";

const isPersonalCheckout = (() => {
  try {
    const parsedReturnUrl = new URL(
      safeReturnUrl,
      productionSiteUrl
    );

    return (
      parsedReturnUrl.searchParams.get("mode") === "personal"
    );
  } catch {
    return false;
  }
})();

const normalizedPlanLabel =
  plan === "premium"
    ? "Premium"
    : plan === "plus"
      ? "Plus"
      : "Basic";

const memorialProductName =
  isPersonalCheckout
    ? `${normalizedPlanLabel} Living MyEMemorial`
    : `${normalizedPlanLabel} Departed MyEMemorial`;

const memorialProductDescription =
  isPersonalCheckout
    ? "Living MyEMemorial plan on MyEMemorial"
    : "Departed MyEMemorial plan on MyEMemorial";

    const shouldCollectTax =
      plan !== "advertiser" && !isRenewal;

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
                  ? "10-Minute Video Memory Pack"
                  : plan === "advertiser"
                    ? "MyEMemorial Advertising"
                    : memorialProductName,
              description: isRenewal
                ? "Renew advertising placement on MyEMemorial"
                : plan === "extra_videos"
                  ? "Additional Video Memory time for this memorial"
                  : plan === "advertiser"
                    ? "Advertising placement on MyEMemorial"
                    : memorialProductDescription,
            },
            unit_amount: safeUnitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      automatic_tax: {
        enabled: shouldCollectTax,
      },

      metadata: {
        plan: plan || "",
        advertiserId: advertiserId || "",
        billingPlan: billingPlan || "",
        memorialId: memorialId ? String(memorialId) : "",
        submissionId: submissionId ? String(submissionId) : "",
        quantity: quantity ? String(quantity) : "",
        checkoutType: checkoutType
  ? String(checkoutType)
  : isRenewal
    ? "renewal"
    : plan === "extra_videos"
      ? "extra_videos"
      : "standard",
fromPlan: verifiedFromPlan || "",
toPlan: toPlan || "",
      },

      success_url:
  `${safeReturnUrl}${separator}success=true&session_id={CHECKOUT_SESSION_ID}`,

cancel_url:
  `${safeReturnUrl}${separator}success=false`,
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