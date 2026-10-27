import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUnsubscribeToken } from "../../../../lib/owner-announcement";

export const dynamic = "force-dynamic";
function validate(owner: string, token: string) {
  const secret = process.env.OWNER_ANNOUNCEMENT_SECRET;
  return !!secret && secret.length >= 32 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner) && verifyUnsubscribeToken(owner, token, secret);
}
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!validate(owner, token)) return new NextResponse("This unsubscribe link is invalid.", { status: 400 });
  // GET does not unsubscribe: mail security scanners frequently open links.
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font:18px Arial;line-height:1.6;max-width:600px;margin:50px auto;padding:20px"><h1>Unsubscribe from updates</h1><p>Stop receiving MyEMemorial improvement announcements. Essential account messages are separate.</p><form method="post"><input type="hidden" name="owner" value="${owner}"><input type="hidden" name="token" value="${token}"><button style="font:18px Arial;padding:12px">Unsubscribe</button></form></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const owner = String(form.get("owner") || ""), token = String(form.get("token") || "");
  if (!validate(owner, token)) return new NextResponse("This unsubscribe link is invalid.", { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new NextResponse("Unable to update your preference. Please try again later.", { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("owner_announcement_optouts").upsert({ owner_id: owner }, { onConflict: "owner_id", ignoreDuplicates: true });
  if (error) return new NextResponse("Unable to update your preference. Please try again later.", { status: 500 });
  return new NextResponse("You have unsubscribed from MyEMemorial improvement announcements.", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
