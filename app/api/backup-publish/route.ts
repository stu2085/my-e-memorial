import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { memorialId } = await req.json();

    if (!memorialId) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    /*
     * Verify the signed backup-access cookie.
     * The cookie must belong to this exact memorial.
     */
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
      cookieMemorialId !== String(memorialId)
    ) {
      return NextResponse.json(
        { error: "Backup access is not valid for this memorial." },
        { status: 403 }
      );
    }

    const backupAccessSecret =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!backupAccessSecret) {
      return NextResponse.json(
        { error: "Backup access is not configured." },
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

    /*
     * Load the memorial again on the server.
     * Publication is allowed only for an existing
     * Personal E-Memorial with a date of death.
     */
    const { data: memorial, error: memorialError } =
      await supabaseAdmin
        .from("memorials")
        .select(
          "id, slug, is_living_preplan, is_published, death_date"
        )
        .eq("id", memorialId)
        .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    if (!memorial.is_living_preplan) {
      return NextResponse.json(
        {
          error:
            "This memorial is no longer a Personal E-Memorial.",
        },
        { status: 400 }
      );
    }

    if (!memorial.death_date) {
      return NextResponse.json(
        {
          error:
            "A date of death must be entered before the memorial can be published.",
        },
        { status: 400 }
      );
    }

    /*
     * Explicit after-death conversion.
     *
     * This is intentionally separate from normal saving.
     * Ordinary Guided Flow saves still keep a Personal
     * E-Memorial private.
     */
    const { error: updateError } = await supabaseAdmin
      .from("memorials")
      .update({
        is_living_preplan: false,
        is_published: true,
        is_draft: false,
        guided_current_chapter: null,
      })
      .eq("id", memorial.id)
      .eq("is_living_preplan", true);

    if (updateError) {
      console.error(
        "BACKUP PUBLISH UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        { error: "The memorial could not be published." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      slug: memorial.slug,
    });

    /*
     * Backup access is no longer needed after conversion.
     */
    response.cookies.set(
      "myememorial_backup_access",
      "",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "BACKUP PUBLISH API ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}