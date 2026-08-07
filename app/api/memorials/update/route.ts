import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import Stripe from "stripe";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
   const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");

let user = null;

if (token) {
  const {
    data: { user: authenticatedUser },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (!userError && authenticatedUser) {
    user = authenticatedUser;
  }
}

    

    const {
  memorialId,
  updatePayload,
  giftToken,
  sessionId,
  promoCode,
} = await req.json();

    if (!memorialId || !updatePayload) {
      return NextResponse.json(
        { error: "Missing memorial update information." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select(
  "id, owner_id, is_living_preplan, is_draft, plan, payment_status"
)
      .eq("id", memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    const isOwner =
  !!user && memorial.owner_id === user.id;

let hasBackupAccess = false;

if (!isOwner && memorial.is_living_preplan) {
  const cookieValue = req.cookies.get(
    "myememorial_backup_access"
  )?.value;

  if (cookieValue) {
    const [cookieMemorialId, suppliedSignature] =
      cookieValue.split(":");

    if (
      cookieMemorialId === String(memorialId) &&
      suppliedSignature
    ) {
      const backupAccessSecret =
        process.env.SUPABASE_SERVICE_ROLE_KEY || "";

      const expectedSignature = createHmac(
        "sha256",
        backupAccessSecret
      )
        .update(String(memorialId))
        .digest("hex");

      const suppliedBuffer = Buffer.from(
        suppliedSignature,
        "utf8"
      );

      const expectedBuffer = Buffer.from(
        expectedSignature,
        "utf8"
      );

      if (
        suppliedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(
          suppliedBuffer,
          expectedBuffer
        )
      ) {
        hasBackupAccess = true;
      }
    }
  }
}

if (!isOwner && !hasBackupAccess) {
  return NextResponse.json(
    { error: "You do not have permission to edit this memorial." },
    { status: 403 }
  );
}
const isFinalizingDraft =
  memorial.is_draft === true &&
  updatePayload.is_draft === false;

let verifiedFinalizationFields: Record<string, unknown> = {};

if (isFinalizingDraft) {
  /*
   * Initial draft completion must be performed
   * by the memorial owner.
   */
  if (!isOwner) {
    return NextResponse.json(
      {
        error:
          "Only the memorial owner can complete this draft.",
      },
      { status: 403 }
    );
  }

  /*
   * If the draft already has a server-verified
   * paid/free entitlement, preserve it.
   */
  const alreadyEntitled =
    memorial.payment_status === "paid" ||
    memorial.payment_status === "free_beta";

  if (alreadyEntitled) {
    verifiedFinalizationFields = {
      is_draft: false,
      is_published:
        memorial.is_living_preplan
          ? false
          : updatePayload.needs_review === true
            ? false
            : true,
      needs_review:
        updatePayload.needs_review === true,
    };
  } else {
    const normalizedGiftToken = String(
      giftToken || ""
    ).trim();

    const normalizedSessionId = String(
      sessionId || ""
    ).trim();

    const normalizedPromoCode = String(
      promoCode || ""
    )
      .trim()
      .toUpperCase();

    let verifiedPlan: string | null = null;
    let verifiedPaymentStatus: string | null = null;
    let verifiedPaymentSource: string | null = null;
    let verifiedBetaCode: string | null = null;
    let verifiedPromotionCategory: string | null = null;

    /*
     * Verify a claimed Gift.
     */
    if (normalizedGiftToken) {
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
          .eq("claim_token", normalizedGiftToken)
          .single();

      if (giftError || !gift) {
        return NextResponse.json(
          { error: "This gift could not be verified." },
          { status: 403 }
        );
      }

      if (
        String(gift.recipient_email || "")
          .toLowerCase() !==
        String(user?.email || "")
          .toLowerCase()
      ) {
        return NextResponse.json(
          {
            error:
              "This gift belongs to a different account.",
          },
          { status: 403 }
        );
      }

      if (
        gift.status !== "claimed" ||
        !gift.claimed_at ||
        gift.claimed_by !== user?.id
      ) {
        return NextResponse.json(
          {
            error:
              "This gift has not been claimed by your account.",
          },
          { status: 403 }
        );
      }

      if (
        gift.expires_at &&
        new Date(gift.expires_at).getTime() <
          Date.now()
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

      verifiedPlan = gift.plan;
      verifiedPaymentStatus = "paid";
      verifiedPaymentSource = "gift";
    }

    /*
     * Verify a Stripe memorial purchase.
     */
    if (!verifiedPlan && normalizedSessionId) {
      const stripeSecretKey =
        process.env.STRIPE_SECRET_KEY;

      if (!stripeSecretKey) {
        return NextResponse.json(
          {
            error:
              "Stripe payment verification is not configured.",
          },
          { status: 500 }
        );
      }

      const stripe = new Stripe(
        stripeSecretKey,
        {
          apiVersion: "2026-04-22.dahlia",
        }
      );

      const stripeSession =
        await stripe.checkout.sessions.retrieve(
          normalizedSessionId
        );

      const stripePlan =
        stripeSession.metadata?.plan;

      const checkoutType =
        stripeSession.metadata?.checkoutType ||
        "standard";

      if (
        stripeSession.payment_status !== "paid" ||
        checkoutType !== "standard"
      ) {
        return NextResponse.json(
          {
            error:
              "This payment session cannot be used to complete this memorial.",
          },
          { status: 403 }
        );
      }

      if (
        stripePlan !== "basic" &&
        stripePlan !== "plus" &&
        stripePlan !== "premium"
      ) {
        return NextResponse.json(
          {
            error:
              "This payment session has an invalid memorial plan.",
          },
          { status: 400 }
        );
      }

      verifiedPlan = stripePlan;
      verifiedPaymentStatus = "paid";
      verifiedPaymentSource = "stripe";
    }

    /*
     * Verify promotional access.
     */
    if (!verifiedPlan && normalizedPromoCode) {
      const { data: promo, error: promoError } =
        await supabaseAdmin
          .from("promo_codes")
          .select(
            "code, allowed_plan, promotion_category, is_active, max_uses, uses_count, expires_at"
          )
          .eq("code", normalizedPromoCode)
          .maybeSingle();

      if (promoError) {
        return NextResponse.json(
          {
            error:
              "Could not verify promotional code.",
          },
          { status: 500 }
        );
      }

      if (!promo || promo.is_active !== true) {
        return NextResponse.json(
          {
            error:
              "Invalid or inactive promotional code.",
          },
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
        new Date(promo.expires_at).getTime() <
          Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "This promotional code has expired.",
          },
          { status: 403 }
        );
      }

      if (
        promo.allowed_plan !== "basic" &&
        promo.allowed_plan !== "plus" &&
        promo.allowed_plan !== "premium"
      ) {
        return NextResponse.json(
          {
            error:
              "This promotional code has an invalid plan.",
          },
          { status: 400 }
        );
      }

      verifiedPlan = promo.allowed_plan;
      verifiedPaymentStatus = "free_beta";
      verifiedPaymentSource = "beta_code";
      verifiedBetaCode = normalizedPromoCode;
      verifiedPromotionCategory =
        promo.promotion_category || null;
    }

    if (
      !verifiedPlan ||
      !verifiedPaymentStatus ||
      !verifiedPaymentSource
    ) {
      return NextResponse.json(
        {
          error:
            "A valid payment, gift, or promotional code is required before completing this memorial.",
        },
        { status: 403 }
      );
    }

    verifiedFinalizationFields = {
      is_draft: false,
      plan: verifiedPlan,
      payment_status: verifiedPaymentStatus,
      payment_source: verifiedPaymentSource,
      beta_code_used: verifiedBetaCode,
      promotion_category:
        verifiedPromotionCategory,
      is_published:
        memorial.is_living_preplan
          ? false
          : updatePayload.needs_review === true
            ? false
            : true,
      needs_review:
        updatePayload.needs_review === true,
    };
  }
}
    const protectedFields = new Set([
  "id",
  "owner_id",
  "plan",
  "payment_status",
  "payment_source",
  "beta_code_used",
  "promotion_category",
  "is_living_preplan",
  "is_published",
  "needs_review",
  "created_at",
  "updated_at",
]);

const safeUpdatePayload = Object.fromEntries(
  Object.entries(updatePayload).filter(
    ([key]) => !protectedFields.has(key)
  )
);

const { error: updateError } = await supabaseAdmin
  .from("memorials")
  .update({
  ...safeUpdatePayload,
  ...verifiedFinalizationFields,
  updated_at: new Date().toISOString(),
})
  .eq("id", memorialId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MEMORIAL UPDATE API ERROR:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}