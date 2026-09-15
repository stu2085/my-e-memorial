import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId) || !/^[0-9a-f]{64}$/i.test(token)) {
    return NextResponse.json({ error: "This private access link is invalid." }, { status: 403 });
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { data: presentation, error } = await admin.from("celebration_presentations")
    .select("id, email_access_expires_at, payment_status")
    .eq("public_id", publicId).eq("email_access_token_hash", tokenHash).maybeSingle();
  if (error || !presentation || presentation.payment_status !== "paid" || !presentation.email_access_expires_at ||
      new Date(presentation.email_access_expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "This private access link has expired or was already used." }, { status: 403 });
  }
  const { data: redeemed, error: redemptionError } = await admin.from("celebration_presentations")
    .update({ edit_token_hash: tokenHash, email_access_token_hash: null, email_access_expires_at: null })
    .eq("id", presentation.id).eq("email_access_token_hash", tokenHash).select("id").maybeSingle();
  if (redemptionError || !redeemed) {
    return NextResponse.json({ error: "This private access link has already been used." }, { status: 403 });
  }
  const response = NextResponse.redirect(new URL(`/celebration-of-life-slideshow/create/${publicId}`, req.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set({ name: `celebration_edit_${publicId}`, value: token, httpOnly: true,
    secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 24 * 60 * 60 });
  return response;
}
