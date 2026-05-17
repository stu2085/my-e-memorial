import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 }
      );
    }

    const { memorialId, updatePayload } = await req.json();

    if (!memorialId || !updatePayload) {
      return NextResponse.json(
        { error: "Missing memorial update information." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select("id, owner_id")
      .eq("id", memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (memorial.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this memorial." },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabaseAdmin
  .from("memorials")
  .update({
    ...updatePayload,
    updated_at: new Date().toISOString(),
  })
  .eq("id", memorialId)
  .eq("owner_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MEMORIAL UPDATE API ERROR:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}