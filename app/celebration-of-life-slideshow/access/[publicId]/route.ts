import { createHash, randomBytes } from "node:crypto";
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
    secure: process.env.NODE_ENV === "production" && req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 24 * 60 * 60 });
  return response;
}

export async function POST(req: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) {
    return NextResponse.json({ error: "This Presentation could not be found." }, { status: 404 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Please sign in again before opening the Presentation Builder." }, { status: 401 });
  }

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: userData, error: userError } =
    await userClient.auth.getUser(accessToken);
  const user = userData?.user;

  if (userError || !user) {
    return NextResponse.json({ error: "Please sign in again before opening the Presentation Builder." }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data: presentation, error } = await admin
    .from("celebration_presentations")
    .select("id, status, payment_status, expires_at, claimed_by, memorial_id")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !presentation) {
    return NextResponse.json({ error: "This Presentation could not be found." }, { status: 404 });
  }

  if (!presentation.memorial_id || presentation.claimed_by !== user.id) {
    return NextResponse.json({ error: "This Presentation is not connected to your account." }, { status: 403 });
  }

  const { data: memorial } = await admin
    .from("memorials")
    .select("id, owner_id")
    .eq("id", presentation.memorial_id)
    .maybeSingle();

  if (!memorial || memorial.owner_id !== user.id) {
    return NextResponse.json({ error: "This Presentation is not connected to your MyEMemorial." }, { status: 403 });
  }

  if (
    presentation.status !== "active" ||
    presentation.payment_status !== "paid" ||
    !presentation.expires_at ||
    new Date(presentation.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json({ error: "Online access for this Presentation is no longer active." }, { status: 410 });
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: updated, error: updateError } = await admin
    .from("celebration_presentations")
    .update({ edit_token_hash: tokenHash })
    .eq("id", presentation.id)
    .eq("claimed_by", user.id)
    .eq("memorial_id", presentation.memorial_id)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json({ error: "The Presentation Builder could not be opened." }, { status: 500 });
  }

  const response = NextResponse.json({
    success: true,
    url: `/celebration-of-life-slideshow/create/${publicId}`,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set({
    name: `celebration_edit_${publicId}`,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 24 * 60 * 60,
  });
  return response;
}
