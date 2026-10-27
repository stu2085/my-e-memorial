import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "../../../lib/email";
import { announcementMessage } from "../../../../lib/owner-announcement";
import { cleanReminderName } from "../../../../lib/reminder-names";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ADMIN_EMAIL = "mike@realchoicerealestate.com";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, secret = process.env.OWNER_ANNOUNCEMENT_SECRET;
  if (!url || !key || !secret || secret.length < 32 || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return NextResponse.json({ error: "Announcement email is not configured." }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: authData, error: authError } = await db.auth.getUser(auth.slice(7));
  if (authError || authData.user?.email?.toLowerCase() !== ADMIN_EMAIL) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  let payload: { action?: string; subject?: string; body?: string; campaignId?: string };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const action = payload.action, subject = typeof payload.subject === "string" ? payload.subject.trim() : "", body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (action === "load") {
    if (!uuid.test(payload.campaignId || "")) return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    const campaign = await db.from("owner_announcement_campaigns").select("subject,body").eq("id", payload.campaignId!).maybeSingle();
    if (campaign.error || !campaign.data) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    return NextResponse.json({ subject: campaign.data.subject, body: campaign.data.body });
  }
  if (!["preview", "test", "send"].includes(action || "") || !subject || subject.length > 180 || /[\r\n]/.test(subject) || !body || body.length > 12000) return NextResponse.json({ error: "Enter a subject and message." }, { status: 400 });
  if (action === "test") {
    const content = announcementMessage("Mike", body, authData.user.id, secret);
    try { await transporter.sendMail({ from: '"MyEMemorial" <info@myememorial.com>', to: authData.user.email!, subject: `[TEST] ${subject}`, ...content }); }
    catch { return NextResponse.json({ error: "The test email could not be sent." }, { status: 502 }); }
    return NextResponse.json({ testSent: true });
  }
  const owners = new Set<string>();
  for (let start = 0; ; start += 500) {
    const result = await db.from("memorials").select("owner_id").not("owner_id", "is", null).order("id").range(start, start + 499);
    if (result.error) return NextResponse.json({ error: "Could not load memorial owners." }, { status: 500 });
    for (const row of result.data) if (typeof row.owner_id === "string") owners.add(row.owner_id);
    if (result.data.length < 500) break;
  }
  let campaignId = "";
  if (action === "send") {
    campaignId = payload.campaignId || "";
    if (!uuid.test(campaignId)) return NextResponse.json({ error: "Invalid campaign." }, { status: 400 });
    const created = await db.from("owner_announcement_campaigns").upsert({ id: campaignId, subject, body }, { onConflict: "id", ignoreDuplicates: true });
    if (created.error) return NextResponse.json({ error: "Unable to create campaign." }, { status: 500 });
    const existing = await db.from("owner_announcement_campaigns").select("subject,body").eq("id", campaignId).single();
    if (existing.error || existing.data.subject !== subject || existing.data.body !== body) return NextResponse.json({ error: "This campaign's message cannot be changed after sending begins." }, { status: 409 });
    const unresolved = await db.from("owner_announcement_deliveries").select("owner_id").eq("campaign_id", campaignId).in("status", ["sending", "failed"]).limit(1);
    if (unresolved.error) return NextResponse.json({ error: "Could not verify delivery history. No additional emails were sent." }, { status: 503 });
    if (unresolved.data.length) return NextResponse.json({ error: "A previous delivery is failed or uncertain. Review delivery records before resuming." }, { status: 409 });
  }
  let eligible = 0, missingName = 0, optedOut = 0, unavailable = 0, sent = 0, failed = 0, remaining = 0, waitingForRateLimit = false;
  for (const ownerId of owners) {
    const [owner, optout] = await Promise.all([db.auth.admin.getUserById(ownerId), db.from("owner_announcement_optouts").select("owner_id").eq("owner_id", ownerId).maybeSingle()]);
    if (owner.error || optout.error || !owner.data.user?.email) { unavailable++; continue; }
    if (optout.data) { optedOut++; continue; }
    const name = cleanReminderName(owner.data.user.user_metadata?.first_name);
    if (!name) { missingName++; continue; }
    eligible++;
    if (action !== "send") continue;
    const delivered = await db.from("owner_announcement_deliveries").select("status").eq("campaign_id", campaignId).eq("owner_id", ownerId).maybeSingle();
    if (delivered.error) { unavailable++; continue; }
    if (delivered.data) continue; // Failed or uncertain attempts require manual review.
    if (waitingForRateLimit || sent + failed >= 1) { remaining++; continue; }
    const slot = await db.rpc("reserve_owner_announcement_slot");
    if (slot.error) return NextResponse.json({ error: "Announcement rate limit is not configured. No additional email was sent in this request." }, { status: 503 });
    if (slot.data !== true) { waitingForRateLimit = true; remaining++; continue; }
    const claim = await db.from("owner_announcement_deliveries").insert({ campaign_id: campaignId, owner_id: ownerId, status: "sending" });
    if (claim.error) { if (claim.error.code !== "23505") unavailable++; continue; }
    try {
      const currentOptout = await db.from("owner_announcement_optouts").select("owner_id").eq("owner_id", ownerId).maybeSingle();
      if (currentOptout.error || currentOptout.data) { await db.from("owner_announcement_deliveries").update({ status: "failed" }).eq("campaign_id", campaignId).eq("owner_id", ownerId); continue; }
      const content = announcementMessage(name, body, ownerId, secret);
      await transporter.sendMail({ from: '"MyEMemorial" <info@myememorial.com>', to: owner.data.user.email, subject, ...content });
      const done = await db.from("owner_announcement_deliveries").update({ status: "sent" }).eq("campaign_id", campaignId).eq("owner_id", ownerId);
      if (done.error) failed++; else sent++;
    } catch {
      failed++;
      await db.from("owner_announcement_deliveries").update({ status: "failed" }).eq("campaign_id", campaignId).eq("owner_id", ownerId);
    }
  }
  return NextResponse.json({ eligible, missingName, optedOut, unavailable, sent, failed, remaining, waitingForRateLimit });
}
