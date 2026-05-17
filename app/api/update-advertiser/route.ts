import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    id,
    token,
    business_name,
    ad_image_url,
    website_url,
    cta_label,
    cta_url,
  } = body;

  if (!id || !token) {
    return NextResponse.json(
      { success: false, error: "Missing id or token" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { success: false, error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from("advertisers")
    .update({
      business_name,
      ad_image_url,
      website_url,
      cta_label,
      cta_url,
    })
    .eq("id", Number(id))
    .eq("edit_token", token);

  if (error) {
    console.error("Advertiser update error:", error);

    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}