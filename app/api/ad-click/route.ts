import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const advertiserId = searchParams.get("id");
  const memorialSlug = searchParams.get("slug") || "";

  if (!advertiserId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { data: advertiser, error: advertiserError } = await supabase
    .from("advertisers")
    .select("id, cta_url, clicks")
    .eq("id", advertiserId)
    .eq("is_active", true)
    .single();

  if (advertiserError || !advertiser?.cta_url) {
    console.error("AD CLICK ADVERTISER ERROR:", advertiserError);
    return NextResponse.redirect(new URL("/", req.url));
  }

  await supabase.from("ad_clicks").insert({
    advertiser_id: Number(advertiserId),
    memorial_slug: memorialSlug,
  });

  await supabase
    .from("advertisers")
    .update({
      clicks: (advertiser.clicks || 0) + 1,
    })
    .eq("id", advertiserId);

  const safeWebsiteUrl = advertiser.cta_url.startsWith("http")
  ? advertiser.cta_url
  : `https://${advertiser.cta_url}`;

  const redirectUrl = new URL(safeWebsiteUrl);

  redirectUrl.searchParams.set("utm_source", "myememorial");
  redirectUrl.searchParams.set("utm_medium", "paid_ad");
  redirectUrl.searchParams.set("utm_campaign", memorialSlug || "memorial_ad");

  return NextResponse.redirect(redirectUrl);
}