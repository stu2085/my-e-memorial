import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const memorialId = Number(req.nextUrl.searchParams.get("memorialId"));

    if (!Number.isInteger(memorialId) || memorialId <= 0) {
      return NextResponse.json({ error: "Missing MyEMemorial information." }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
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
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select("id, owner_id")
      .eq("id", memorialId)
      .maybeSingle();

    if (memorialError || !memorial) {
      return NextResponse.json({ error: "MyEMemorial not found." }, { status: 404 });
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json({ error: "You do not have access to this MyEMemorial." }, { status: 403 });
    }

    const { data: presentation, error: presentationError } = await supabaseAdmin
      .from("celebration_presentations")
      .select("public_id, person_name, status, payment_status, expires_at, claimed_by, converted_memorial_id")
      .eq("memorial_id", memorialId)
      .maybeSingle();

    if (presentationError) {
      return NextResponse.json({ error: "The connected Celebration Presentation could not be loaded." }, { status: 500 });
    }

    if (!presentation) {
      return NextResponse.json({ presentation: null });
    }

    if (presentation.claimed_by !== user.id) {
      return NextResponse.json({ error: "The connected Celebration Presentation belongs to a different account." }, { status: 403 });
    }

    return NextResponse.json({
      presentation: {
        publicId: presentation.public_id,
        personName: presentation.person_name || "",
        status: presentation.status || "",
        paymentStatus: presentation.payment_status || "",
        expiresAt: presentation.expires_at || null,
        convertedMemorialId: presentation.converted_memorial_id || null,
      },
    });
  } catch (error) {
    console.error("LINKED CELEBRATION PRESENTATION LOOKUP ERROR:", error);
    return NextResponse.json({ error: "The connected Celebration Presentation could not be loaded." }, { status: 500 });
  }
}
