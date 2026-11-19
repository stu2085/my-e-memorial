import { randomUUID, timingSafeEqual } from "node:crypto";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cleanCelebrationSources } from "../../../../lib/celebration-source-cleanup";
import { getR2Client, getR2Config } from "../../../../lib/r2-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorized(request: Request, secret = process.env.MEDIA_BACKUP_TEST_SECRET?.trim()) {
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
  if (new URL(request.url).searchParams.get("scheduled") === "1") {
    return runScheduledCleanup(request);
  }
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

async function runScheduledCleanup(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || !authorized(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.VERCEL_ENV !== "production" ||
      process.env.CELEBRATION_STORAGE_CLEANUP_ENABLED !== "true") {
    return NextResponse.json({ enabled: false });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!url || !serviceKey || !stripeKey) {
    return NextResponse.json({ error: "Cleanup configuration missing" }, { status: 503 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const stripe = new Stripe(stripeKey, { timeout: 5000, maxNetworkRetries: 1 });

  const lease = randomUUID();
  const { data: publicId, error: claimError } = await db.rpc("claim_celebration_storage_cleanup", { p_lease: lease });
  if (claimError) {
    console.error("Celebration cleanup claim failed");
    return NextResponse.json({ status: "claim_failed" }, { status: 502 });
  }
  if (publicId == null) return NextResponse.json({ status: "idle" });
  if (typeof publicId !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(publicId)) {
    return NextResponse.json({ status: "claim_invalid" }, { status: 502 });
  }

  async function saveProgress(result: "complete" | "held" | "pending") {
    const nextAttempt = new Date(Date.now() + (result === "held" ? 7 * 24 * 60 : 10) * 60000);
    const { data, error } = await db.from("celebration_presentations")
      .update({
        storage_cleanup_lease: null,
        storage_cleanup_next_attempt_at: nextAttempt.toISOString(),
        ...(result === "complete" ? {
          storage_cleanup_completed_at: new Date().toISOString(),
          offline_r2_storage_key: null,
          offline_r2_content_hash: null,
          offline_r2_size_bytes: null,
          offline_r2_stored_at: null,
        } : {}),
      })
      .eq("public_id", publicId).eq("storage_cleanup_lease", lease)
      .select("id").maybeSingle();
    if (error || !data) throw new Error("Could not record cleanup progress");
  }

  async function loadPresentation() {
    const { data, error } = await db.from("celebration_presentations")
      .select("id,status,memorial_id,converted_memorial_id,converted_at,activated_at,expires_at,payment_status,amount_paid_cents,stripe_checkout_session_id,offline_r2_storage_key,updated_at")
      .eq("public_id", publicId).eq("storage_cleanup_lease", lease).maybeSingle();
    if (error) throw error;
    if (!data || data.converted_memorial_id !== null || data.converted_at !== null ||
        !["active", "expired"].includes(data.status) || data.payment_status !== "paid" ||
        !(data.amount_paid_cents > 0) || !data.stripe_checkout_session_id?.startsWith("cs_live_")) {
      return null;
    }

    const activated = Date.parse(data.activated_at ?? "");
    const expires = Date.parse(data.expires_at ?? "");
    if (!Number.isFinite(activated) || !Number.isFinite(expires) || expires < activated ||
        Date.now() < Math.max(activated + 1800 * 3600000, expires + 360 * 3600000)) return null;

    if (data.memorial_id !== null) {
      const { data: memorial, error: lookupError } = await db.from("memorials")
        .select("plan,payment_status").eq("id", data.memorial_id).maybeSingle();
      if (lookupError) throw lookupError;
      if (!memorial || memorial.plan !== "free" || memorial.payment_status === "paid") return null;
    }
    return data;
  }

  let deleted = 0;
  try {
    const presentation = await loadPresentation();
    if (!presentation || await verifyPayment(
      stripe, presentation.stripe_checkout_session_id, presentation.amount_paid_cents,
    ) !== "confirmed_live_payment") {
      await saveProgress("held");
      return NextResponse.json({ status: "not_eligible" });
    }

    const { bucket } = getR2Config();
    if (bucket !== "myememorial-presentations") throw new Error("Unexpected render bucket");
    const r2 = getR2Client();
    const prefix = `celebration-presentations/${publicId}/`;
    const list = () => r2.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 101 }));
    const listed = await list();
    const keys = (listed.Contents ?? []).map(({ Key }) => Key ?? "");
    const validKey = (key: string) => key.startsWith(prefix) &&
      /^[A-Za-z0-9_-]+\.mp4$/.test(key.slice(prefix.length));
    if (listed.IsTruncated || keys.length > 100 || keys.some((key) => !validKey(key)) ||
        (presentation.offline_r2_storage_key && !validKey(presentation.offline_r2_storage_key))) {
      return NextResponse.json({ status: "render_keys_need_review" }, { status: 409 });
    }

    const { count: pending, error: transferError } = await db.from("celebration_r2_transfers")
      .select("render_job_id", { count: "exact", head: true }).eq("presentation_public_id", publicId)
      .in("status", ["queued", "uploading"]);
    if (transferError || pending === null) throw new Error("Transfer lookup failed");
    if (pending > 0) return NextResponse.json({ status: "transfer_in_progress" }, { status: 409 });

    if (keys.length) {
      const [otherPresentation, otherTransfer] = await Promise.all([
        db.from("celebration_presentations").select("id", { count: "exact", head: true })
          .neq("id", presentation.id).in("offline_r2_storage_key", keys),
        db.from("celebration_r2_transfers").select("render_job_id", { count: "exact", head: true })
          .neq("presentation_public_id", publicId).in("storage_key", keys),
      ]);
      if (otherPresentation.error || otherTransfer.error ||
          otherPresentation.count === null || otherTransfer.count === null) {
        throw new Error("Reference lookup failed");
      }
      if (otherPresentation.count || otherTransfer.count) {
        return NextResponse.json({ status: "render_shared" }, { status: 409 });
      }
    }

    const recheck = async () => {
      const current = await loadPresentation();
      if (!current || current.updated_at !== presentation.updated_at ||
          current.stripe_checkout_session_id !== presentation.stripe_checkout_session_id) {
        throw new Error("Presentation changed during cleanup");
      }
    };
    await recheck();

    for (const key of keys) {
      await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      deleted += 1;
    }
    const remaining = await list();
    if (remaining.IsTruncated || remaining.Contents?.length) {
      throw new Error("Render objects remain after cleanup");
    }
    const sources = await cleanCelebrationSources(db, presentation.id, publicId, recheck);
    await recheck();
    await saveProgress(sources.complete ? "complete" : "pending");
    return NextResponse.json({
      status: sources.complete ? "complete" : "more_uploads_pending",
      renderedMp4sRemoved: deleted,
      uploadsRemoved: sources.uploadsRemoved,
    });
  } catch {
    console.error("Celebration R2 cleanup did not complete", { deleted });
    return NextResponse.json({ status: "retry_required", deleted }, { status: 502 });
  }
}
