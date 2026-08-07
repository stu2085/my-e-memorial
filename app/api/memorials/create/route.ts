import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "crypto";
import Stripe from "stripe";
export const runtime = "nodejs";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function hashBackupPassword(password: string) {
  const trimmedPassword = String(password || "");

  if (!trimmedPassword) {
    return "";
  }

  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(
    trimmedPassword,
    salt,
    64
  ).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in to create a memorial." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your sign-in session could not be verified." },
        { status: 401 }
      );
    }

    const body = await req.json();

   const slug = String(body?.slug || "").trim();
const memorialData = body?.memorialData;
const giftToken = String(body?.giftToken || "").trim();
const sessionId = String(body?.sessionId || "").trim();
const promoCode = String(body?.promoCode || "")
  .trim()
  .toUpperCase();

    if (
      !slug ||
      !memorialData ||
      typeof memorialData !== "object" ||
      Array.isArray(memorialData)
    ) {
      return NextResponse.json(
        { error: "Missing memorial creation information." },
        { status: 400 }
      );
    }
    let verifiedStripePlan: string | null = null;

if (sessionId) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe payment verification is not configured." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-04-22.dahlia",
  });

  const session =
    await stripe.checkout.sessions.retrieve(sessionId);

  const stripePlan = session.metadata?.plan;
  const checkoutType =
    session.metadata?.checkoutType || "standard";

  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Payment has not been completed." },
      { status: 402 }
    );
  }

  if (checkoutType !== "standard") {
    return NextResponse.json(
      { error: "This payment session cannot be used to create a memorial." },
      { status: 403 }
    );
  }

  if (
    stripePlan !== "basic" &&
    stripePlan !== "plus" &&
    stripePlan !== "premium"
  ) {
    return NextResponse.json(
      { error: "This payment session has an invalid memorial plan." },
      { status: 400 }
    );
  }

  verifiedStripePlan = stripePlan;
}
let verifiedGiftPlan: string | null = null;

if (giftToken) {
  const { data: gift, error: giftError } =
    await supabaseAdmin
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
      .eq("claim_token", giftToken)
      .single();

  if (giftError || !gift) {
    return NextResponse.json(
      { error: "This gift could not be verified." },
      { status: 403 }
    );
  }

  if (
    String(gift.recipient_email || "").toLowerCase() !==
    String(user.email || "").toLowerCase()
  ) {
    return NextResponse.json(
      { error: "This gift belongs to a different account." },
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

  verifiedGiftPlan = gift.plan;
}
let verifiedPromoPlan: string | null = null;
let verifiedPromotionCategory: string | null = null;

if (promoCode) {
  const { data: promo, error: promoError } =
    await supabaseAdmin
      .from("promo_codes")
      .select(
        "code, allowed_plan, promotion_category, is_active, max_uses, uses_count, expires_at"
      )
      .eq("code", promoCode)
      .maybeSingle();

  if (promoError) {
    console.error(
      "PROMO CODE VERIFICATION ERROR:",
      promoError
    );

    return NextResponse.json(
      { error: "Could not verify promotional code." },
      { status: 500 }
    );
  }

  if (!promo || promo.is_active !== true) {
    return NextResponse.json(
      { error: "Invalid or inactive promotional code." },
      { status: 403 }
    );
  }

  if (
    promo.max_uses &&
    Number(promo.uses_count || 0) >=
      Number(promo.max_uses)
  ) {
    return NextResponse.json(
      {
        error:
          "This promotional code has reached its usage limit.",
      },
      { status: 403 }
    );
  }

  if (
    promo.expires_at &&
    new Date(promo.expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "This promotional code has expired." },
      { status: 403 }
    );
  }

  if (
    promo.allowed_plan !== "basic" &&
    promo.allowed_plan !== "plus" &&
    promo.allowed_plan !== "premium"
  ) {
    return NextResponse.json(
      { error: "This promotional code has an invalid plan." },
      { status: 400 }
    );
  }

  verifiedPromoPlan = promo.allowed_plan;
  verifiedPromotionCategory =
    promo.promotion_category || null;
}
const hasVerifiedEntitlement =
  Boolean(verifiedGiftPlan) ||
  Boolean(verifiedStripePlan) ||
  Boolean(verifiedPromoPlan);

const isDraft =
  memorialData.is_draft === true;

if (!hasVerifiedEntitlement && !isDraft) {
  return NextResponse.json(
    {
      error:
        "A valid payment, gift, or promotional code is required before completing this memorial.",
    },
    { status: 403 }
  );
}
    const backupPassword =
      typeof memorialData.backup_password === "string"
        ? memorialData.backup_password
        : "";

    const insertData = {
  ...memorialData,

  ...(!hasVerifiedEntitlement && isDraft
    ? {
        payment_status: null,
        payment_source: null,
        beta_code_used: null,
        promotion_category: null,
        is_published: false,
        needs_review: false,
      }
    : {}),

  ...(verifiedGiftPlan
  ? {
      plan: verifiedGiftPlan,
      payment_status: "paid",
      payment_source: "gift",
      beta_code_used: null,
      promotion_category: null,
    }
  : verifiedStripePlan
    ? {
        plan: verifiedStripePlan,
        payment_status: "paid",
        payment_source: "stripe",
        beta_code_used: null,
        promotion_category: null,
      }
    : verifiedPromoPlan
      ? {
          plan: verifiedPromoPlan,
          payment_status: "free_beta",
          payment_source: "beta_code",
          beta_code_used: promoCode,
          promotion_category:
            verifiedPromotionCategory,
        }
      : {}),

      /*
       * Never accept ownership from the browser.
       * The signed-in user becomes the owner.
       */
      owner_id: user.id,

      /*
       * Make sure the slug sent separately matches
       * the slug stored in the memorial record.
       */
      slug,

      /*
       * Never store a new backup password as plain text.
       */
      backup_password: hashBackupPassword(
        backupPassword
      ),
    };

    const { data: createdMemorial, error: insertError } =
      await supabase
        .from("memorials")
        .insert(insertData)
        .select("id")
        .single();

    if (insertError) {
      console.error(
        "MEMORIAL CREATE API INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    if (!createdMemorial) {
      return NextResponse.json(
        { error: "The memorial was not created." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      memorialId: createdMemorial.id,
      slug,
    });
  } catch (error) {
    console.error(
      "MEMORIAL CREATE API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}