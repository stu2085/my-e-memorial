import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PaidPlan = "basic" | "plus" | "premium";

const VALID_UPGRADE_AMOUNTS: Record<string, number> = {
  "free:basic": 4995,
  "free:plus": 6995,
  "free:premium": 8995,
  "basic:plus": 2000,
  "basic:premium": 4000,
  "plus:premium": 2000,
};

function isPaidPlan(value: string): value is PaidPlan {
  return (
    value === "basic" ||
    value === "plus" ||
    value === "premium"
  );
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body?.sessionId || "").trim();

    if (!sessionId) {
      return NextResponse.json(
        {
          paid: false,
          error: "Missing Stripe session ID.",
        },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          paid: false,
          error: "Stripe payment verification is not configured.",
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(
      sessionId
    );

    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false });
    }

    const checkoutType =
      session.metadata?.checkoutType ||
      session.metadata?.type ||
      "standard";

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    /*
     * Keep the existing advertiser-renewal behavior.
     */
    if (checkoutType === "renewal") {
      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
          {
            paid: false,
            error: "Payment verification storage is not configured.",
          },
          { status: 500 }
        );
      }

      const advertiserId = Number(
        session.metadata?.advertiserId || 0
      );

      if (advertiserId > 0) {
        const supabaseAdmin = createClient(
          supabaseUrl,
          serviceRoleKey
        );

        const newExpiration = new Date();
        newExpiration.setDate(
          newExpiration.getDate() + 30
        );

        const { error } = await supabaseAdmin
          .from("advertisers")
          .update({
            is_active: true,
            expired_at: null,
            expires_at: newExpiration.toISOString(),
            reminder_7_sent: false,
            reminder_3_sent: false,
            reminder_1_sent: false,
          })
          .eq("id", advertiserId);

        if (error) {
          console.error(
            "Renewal update error:",
            error
          );
        }
      }

      return NextResponse.json({
        paid: true,
        checkoutType: "renewal",
      });
    }

    /*
     * Existing MyEMemorial plan upgrades must work even when the Stripe
     * webhook has not reached localhost yet. The session metadata is the
     * authority for memorial ID/from-plan/to-plan and the Stripe subtotal
     * must exactly match the permitted upgrade price.
     *
     * This path also requires the currently signed-in memorial owner. That
     * prevents a valid Stripe session ID from being replayed by another user.
     */
    if (checkoutType === "upgrade") {
      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
          {
            paid: false,
            error: "Payment verification storage is not configured.",
          },
          { status: 500 }
        );
      }

      const memorialId = Number(
        session.metadata?.memorialId || 0
      );
      const fromPlan = String(
        session.metadata?.fromPlan || ""
      ).trim();
      const toPlan = String(
        session.metadata?.toPlan || ""
      ).trim();
      const sessionPlan = String(
        session.metadata?.plan || ""
      ).trim();

      if (
        !Number.isSafeInteger(memorialId) ||
        memorialId <= 0 ||
        !fromPlan ||
        !isPaidPlan(toPlan) ||
        sessionPlan !== toPlan
      ) {
        return NextResponse.json(
          {
            paid: false,
            error: "This Stripe upgrade session has invalid memorial metadata.",
          },
          { status: 400 }
        );
      }

      const upgradeKey = `${fromPlan}:${toPlan}`;
      const expectedSubtotal =
        VALID_UPGRADE_AMOUNTS[upgradeKey];

      if (!expectedSubtotal) {
        return NextResponse.json(
          {
            paid: false,
            error: "This memorial plan upgrade is not valid.",
          },
          { status: 400 }
        );
      }

      if (
        Number(session.amount_subtotal || 0) !==
        expectedSubtotal
      ) {
        console.error(
          "VERIFY PAYMENT UPGRADE AMOUNT MISMATCH:",
          {
            memorialId,
            fromPlan,
            toPlan,
            expectedSubtotal,
            actualSubtotal: session.amount_subtotal,
            actualTotal: session.amount_total,
          }
        );

        return NextResponse.json(
          {
            paid: false,
            error: "The upgrade payment amount could not be verified.",
          },
          { status: 400 }
        );
      }

      const accessToken = getBearerToken(req);

      if (!accessToken) {
        return NextResponse.json(
          {
            paid: false,
            error: "Please sign in again before applying this plan upgrade.",
          },
          { status: 401 }
        );
      }

      const supabaseAdmin = createClient(
        supabaseUrl,
        serviceRoleKey
      );

      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(
        accessToken
      );

      if (userError || !user) {
        return NextResponse.json(
          {
            paid: false,
            error: "Please sign in again before applying this plan upgrade.",
          },
          { status: 401 }
        );
      }

      const {
        data: currentMemorial,
        error: memorialLookupError,
      } = await supabaseAdmin
        .from("memorials")
        .select(
          "id, owner_id, plan, payment_status, payment_source"
        )
        .eq("id", memorialId)
        .maybeSingle();

      if (memorialLookupError) {
        console.error(
          "VERIFY PAYMENT MEMORIAL LOOKUP ERROR:",
          memorialLookupError
        );

        return NextResponse.json(
          {
            paid: false,
            error: "The MyEMemorial could not be loaded for this upgrade.",
          },
          { status: 500 }
        );
      }

      if (!currentMemorial) {
        return NextResponse.json(
          {
            paid: false,
            error: "The MyEMemorial for this upgrade could not be found.",
          },
          { status: 404 }
        );
      }

      if (currentMemorial.owner_id !== user.id) {
        return NextResponse.json(
          {
            paid: false,
            error: "Only the MyEMemorial owner can apply this plan upgrade.",
          },
          { status: 403 }
        );
      }

      /*
       * Idempotency: the production webhook may have already applied the
       * upgrade before the browser calls this route. In that case, confirm
       * the same paid result instead of treating the second application as
       * an error.
       */
      if (currentMemorial.plan === toPlan) {
        if (
          fromPlan === "free" &&
          currentMemorial.payment_status !== "paid"
        ) {
          const { error: paymentStateError } =
            await supabaseAdmin
              .from("memorials")
              .update({
                payment_status: "paid",
                payment_source: "stripe",
                updated_at: new Date().toISOString(),
              })
              .eq("id", memorialId)
              .eq("owner_id", user.id);

          if (paymentStateError) {
            console.error(
              "VERIFY PAYMENT UPGRADE STATE ERROR:",
              paymentStateError
            );

            return NextResponse.json(
              {
                paid: false,
                error: "The paid plan could not be activated.",
              },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({
          paid: true,
          checkoutType: "upgrade",
          memorialId,
          plan: toPlan,
          alreadyApplied: true,
        });
      }

      if (currentMemorial.plan !== fromPlan) {
        return NextResponse.json(
          {
            paid: false,
            error:
              "The MyEMemorial plan changed after this checkout began. Please return to MyEMemorials and review the current plan.",
          },
          { status: 409 }
        );
      }

      const upgradeFields: Record<string, unknown> = {
        plan: toPlan,
        updated_at: new Date().toISOString(),
      };

      if (fromPlan === "free") {
        upgradeFields.payment_status = "paid";
        upgradeFields.payment_source = "stripe";
      }

      const {
        data: upgradedMemorial,
        error: upgradeError,
      } = await supabaseAdmin
        .from("memorials")
        .update(upgradeFields)
        .eq("id", memorialId)
        .eq("owner_id", user.id)
        .eq("plan", fromPlan)
        .select("id, plan, payment_status")
        .maybeSingle();

      if (upgradeError) {
        console.error(
          "VERIFY PAYMENT PLAN UPGRADE ERROR:",
          upgradeError
        );

        return NextResponse.json(
          {
            paid: false,
            error: "The paid plan could not be activated.",
          },
          { status: 500 }
        );
      }

      if (!upgradedMemorial) {
        /*
         * A second browser verification request can race the first one
         * (for example React development-mode effects). If another valid
         * request applied the same Stripe upgrade between our initial read
         * and conditional update, treat the target plan as success.
         */
        const {
          data: racedMemorial,
          error: racedLookupError,
        } = await supabaseAdmin
          .from("memorials")
          .select("id, owner_id, plan, payment_status")
          .eq("id", memorialId)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (racedLookupError) {
          console.error(
            "VERIFY PAYMENT UPGRADE RACE LOOKUP ERROR:",
            racedLookupError
          );

          return NextResponse.json(
            {
              paid: false,
              error: "The paid plan could not be confirmed.",
            },
            { status: 500 }
          );
        }

        if (
          racedMemorial?.plan === toPlan &&
          (
            fromPlan !== "free" ||
            racedMemorial.payment_status === "paid"
          )
        ) {
          return NextResponse.json({
            paid: true,
            checkoutType: "upgrade",
            memorialId,
            plan: toPlan,
            alreadyApplied: true,
          });
        }

        return NextResponse.json(
          {
            paid: false,
            error:
              "The plan upgrade could not be applied because the MyEMemorial changed after checkout began.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        paid: true,
        checkoutType: "upgrade",
        memorialId,
        plan: upgradedMemorial.plan,
        alreadyApplied: false,
      });
    }

    return NextResponse.json({
      paid: true,
      checkoutType,
      plan: isPaidPlan(
        String(session.metadata?.plan || "")
      )
        ? String(session.metadata?.plan)
        : null,
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);

    return NextResponse.json(
      {
        paid: false,
        error: "The payment could not be verified.",
      },
      { status: 500 }
    );
  }
}
