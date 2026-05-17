import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { id, token } = await req.json();

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

  const { data, error } = await supabase
    .from("advertisers")
    .select(
  "id, business_name, business_type, service_zip, ad_image_url, website_url, cta_label, cta_url, billing_plan, expires_at, is_active"
)
    .eq("id", Number(id))
    .eq("edit_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "Unauthorized or advertiser not found" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    advertiser: data,
  });
}