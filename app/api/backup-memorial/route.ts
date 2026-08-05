import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug")?.trim();

    if (!slug) {
      return NextResponse.json(
        { error: "Missing memorial slug." },
        { status: 400 }
      );
    }

    const { data: memorial, error } = await supabaseAdmin
      .from("memorials")
      .select(
        "id, slug, full_name, owner_id, plan, extra_video_minutes, is_living_preplan"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (!memorial.is_living_preplan) {
      return NextResponse.json(
        { error: "Backup access is not available for this memorial." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      memorial: {
        id: memorial.id,
        slug: memorial.slug,
        full_name: memorial.full_name,
        owner_id: memorial.owner_id,
        plan: memorial.plan,
        extra_video_minutes: memorial.extra_video_minutes,
        is_living_preplan: memorial.is_living_preplan,
      },
    });
  } catch (error) {
    console.error(
      "BACKUP MEMORIAL LOOKUP ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}