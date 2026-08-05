import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const memorialId =
      req.nextUrl.searchParams.get("memorialId");

    if (!memorialId) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    const cookieValue = req.cookies.get(
      "myememorial_backup_access"
    )?.value;

    if (!cookieValue) {
      return NextResponse.json(
        { error: "Authorized backup access is required." },
        { status: 403 }
      );
    }

    const [cookieMemorialId, suppliedSignature] =
      cookieValue.split(":");

    if (
      !cookieMemorialId ||
      !suppliedSignature ||
      cookieMemorialId !== memorialId
    ) {
      return NextResponse.json(
        {
          error:
            "Backup access is not valid for this memorial.",
        },
        { status: 403 }
      );
    }

    const backupAccessSecret =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!backupAccessSecret) {
      return NextResponse.json(
        {
          error:
            "Backup access is not configured.",
        },
        { status: 500 }
      );
    }

    const expectedSignature = createHmac(
      "sha256",
      backupAccessSecret
    )
      .update(String(memorialId))
      .digest("hex");

    const suppliedBuffer = Buffer.from(
      suppliedSignature,
      "utf8"
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(
        suppliedBuffer,
        expectedBuffer
      )
    ) {
      return NextResponse.json(
        { error: "Backup access is not valid." },
        { status: 403 }
      );
    }

    const { data: memorial, error } =
      await supabaseAdmin
        .from("memorials")
        .select("*")
        .eq("id", Number(memorialId))
        .maybeSingle();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (!memorial.is_living_preplan) {
      return NextResponse.json(
        {
          error:
            "Backup-person access is only available for Personal E-Memorials.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      memorial,
    });
  } catch (error) {
    console.error(
      "BACKUP MEMORIAL EDIT LOAD ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}