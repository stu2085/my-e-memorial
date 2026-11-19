import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorized(request: Request) {
  const secret = process.env.MEDIA_BACKUP_TEST_SECRET?.trim();
  if (!secret) return false;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function verifyPayment(stripe: Stripe, sessionId: string, expectedAmount: number) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge"],
  });
  const intent = session.payment_intent;
  if (!session.livemode || session.mode !== "payment" || session.status !== "complete" ||
      session.payment_status !== "paid" || session.amount_total !== expectedAmount ||
      !intent || typeof intent === "string" || !intent.livemode || intent.status !== "succeeded") {
    return "payment_needs_review";
  }

  const charge = intent.latest_charge;
  if (!charge || typeof charge === "string" || !charge.livemode) return "payment_needs_review";
  if (charge.refunded || charge.amount_refunded > 0 || charge.disputed) return "reversed_or_disputed";
  if (!charge.paid || !charge.captured || charge.status !== "succeeded" ||
      charge.amount_captured !== expectedAmount) return "payment_needs_review";

  const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100 });
  if (refunds.has_more || refunds.data.some(({ status }) => status !== "failed" && status !== "canceled")) {
    return "reversed_or_disputed";
  }
  return "confirmed_live_payment";
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!url || !serviceKey || !stripeKey) {
    return NextResponse.json({ error: "Preview configuration missing" }, { status: 503 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const stripe = new Stripe(stripeKey, { timeout: 5000, maxNetworkRetries: 1 });
  const now = Date.now();
  const hour = 3600000;
  const records = [];
  let cursor = 0;

  try {
    for (;;) {
      const { data, error } = await supabase.from("celebration_presentations")
        .select("id,status,memorial_id,converted_memorial_id,converted_at,activated_at,expires_at,amount_paid_cents,stripe_checkout_session_id")
        .eq("payment_status", "paid").gt("amount_paid_cents", 0)
        .like("stripe_checkout_session_id", "cs_live_%")
        .gt("id", cursor).order("id", { ascending: true }).limit(25);
      if (error) throw new Error("Presentation lookup failed");
      if (!data?.length) break;

      for (const row of data) {
        cursor = row.id;
        if (!row.stripe_checkout_session_id.startsWith("cs_live_")) continue;
        const activated = Date.parse(row.activated_at ?? "");
        const expires = Date.parse(row.expires_at ?? "");
        const base = { activated_at: row.activated_at, amount_paid_cents: row.amount_paid_cents };
        let protectedLink = row.converted_memorial_id !== null || row.converted_at !== null ||
          row.status === "converted";
        if (!protectedLink && row.memorial_id !== null) {
          const { data: memorial, error: memorialError } = await supabase.from("memorials")
            .select("plan").eq("id", row.memorial_id).maybeSingle();
          if (memorialError) throw new Error("Memorial lookup failed");
          protectedLink = memorial?.plan !== "free";
        }
        if (protectedLink) {
          records.push({ ...base, status: "protected_or_link_needs_review" });
          continue;
        }

        if (!Number.isFinite(activated) || !Number.isFinite(expires) || expires < activated ||
            !["active", "expired"].includes(row.status)) {
          records.push({ ...base, status: "incomplete_purchase_record" });
          continue;
        }

        let payment;
        try {
          payment = await verifyPayment(stripe, row.stripe_checkout_session_id, row.amount_paid_cents);
        } catch {
          records.push({ ...base, status: "stripe_verification_failed" });
          continue;
        }
        if (payment !== "confirmed_live_payment") {
          records.push({ ...base, status: payment });
          continue;
        }

        const earliest = Math.max(activated + 1800 * hour, expires + 360 * hour);
        records.push({
          ...base,
          status: earliest > now ? "retention_window_open" : "candidate_requires_shared_asset_checks",
          earliest_cleanup_at: new Date(earliest).toISOString(),
        });
      }
    }

    return NextResponse.json({ preview: true, records }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Cleanup preview could not complete" }, { status: 502 });
  }
}
