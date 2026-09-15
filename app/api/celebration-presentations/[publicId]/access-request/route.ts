import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "../../../../lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const reply = NextResponse.json({ message: "If this is the purchaser email, a private access link will arrive shortly." });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) return reply;
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { data: presentation } = await admin.from("celebration_presentations")
    .select("id, customer_email, payment_status, expires_at, email_access_requested_at")
    .eq("public_id", publicId).eq("customer_email", email).maybeSingle();
  if (!presentation || presentation.payment_status !== "paid" || !presentation.expires_at ||
      new Date(presentation.expires_at).getTime() <= Date.now()) return reply;
  const cooldown = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  if (presentation.email_access_requested_at && presentation.email_access_requested_at > cooldown) return reply;
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let update = admin.from("celebration_presentations")
    .update({ email_access_token_hash: tokenHash, email_access_expires_at: presentation.expires_at,
      email_access_requested_at: new Date().toISOString() })
    .eq("id", presentation.id).eq("payment_status", "paid");
  update = presentation.email_access_requested_at
    ? update.lt("email_access_requested_at", cooldown)
    : update.is("email_access_requested_at", null);
  const { data: updated, error } = await update.select("id").maybeSingle();
  if (error || !updated) return reply;
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.myememorial.com").origin;
  const link = `${origin}/celebration-of-life-slideshow/access/${publicId}?token=${token}`;
  try {
    await transporter.sendMail({ from: '"MyEMemorial" <help@myememorial.com>', to: presentation.customer_email,
      subject: "Your private Celebration of Life Presentation link",
      html: `<p>You requested access to your Celebration of Life Presentation.</p><p><a href="${link}">Open your private builder</a></p><p>This link can be used once, until the presentation's hosting period ends. If you did not request it, you may ignore this email.</p>`,
      text: `Open your private builder: ${link}\nIf you did not request this, ignore this email.` });
  } catch (sendError) {
    console.error("CELEBRATION ACCESS EMAIL ERROR:", sendError);
  }
  return reply;
}
