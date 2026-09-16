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
  const requestOrigin = req.nextUrl.origin;
  const isLocalRequest =
    requestOrigin.includes("localhost") ||
    requestOrigin.includes("127.0.0.1");
  const origin = isLocalRequest
    ? requestOrigin
    : new URL(
        process.env.NEXT_PUBLIC_SITE_URL ||
          "https://www.myememorial.com"
      ).origin;
  const link = `${origin}/celebration-of-life-slideshow/access/${publicId}?token=${token}`;
  try {
    await transporter.sendMail({ from: '"MyEMemorial" <info@myememorial.com>', to: presentation.customer_email,
      subject: "Your private Celebration of Life Presentation link",
      html: `
        <div style="margin:0;padding:28px 12px;background:#f4f1e8;font-family:Arial,Helvetica,sans-serif;color:#173a31;">
          <table role="presentation" align="center" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #ded4c0;border-radius:18px;overflow:hidden;">
            <tr><td align="center" style="padding:26px;background:#ffffff;"><a href="https://www.myememorial.com"><img src="https://www.myememorial.com/myememorial-logo.png" width="210" alt="MyEMemorial" style="display:block;border:0;width:210px;max-width:100%;height:auto;" /></a></td></tr>
            <tr><td style="padding:30px 34px 34px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-align:center;color:#9b713a;">CELEBRATION OF LIFE PRESENTATION</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;line-height:1.25;text-align:center;color:#173a31;">Your private builder link</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">You requested access to your Celebration of Life Presentation.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;"><tr><td style="border-radius:999px;background:#244f40;"><a href="${link}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open Private Builder</a></td></tr></table>
              <div style="margin:24px 0 0;padding:18px;background:#edf5f0;border:1px solid #c9ddd2;border-radius:12px;"><p style="margin:0;font-size:15px;line-height:1.55;">This link can be used once, until the presentation's hosting period ends. If you did not request it, you may ignore this email.</p></div>
            </td></tr>
            <tr><td align="center" style="padding:20px 28px;background:#173a31;color:#ffffff;"><p style="margin:0;font-size:14px;font-weight:700;">MyEMemorial</p><p style="margin:5px 0 0;font-size:12px;color:#d9e4de;">Where Life's Stories Are Told</p></td></tr>
          </table>
        </div>
      `,
      text: `Open your private builder: ${link}\nIf you did not request this, ignore this email.` });
  } catch (sendError) {
    console.error("CELEBRATION ACCESS EMAIL ERROR:", sendError);
  }
  return reply;
}
