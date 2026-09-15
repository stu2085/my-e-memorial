import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const ALLOWED_THEMES = new Set([
  "classic",
  "warm",
  "simple",
]);

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function hashToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function hashesMatch(
  suppliedHash: string,
  expectedHash: string
) {
  const suppliedBuffer =
    Buffer.from(suppliedHash, "utf8");

  const expectedBuffer =
    Buffer.from(expectedHash, "utf8");

  return (
    suppliedBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      suppliedBuffer,
      expectedBuffer
    )
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeOptionalDate(
  value: unknown
) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(
    `${text}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return text;
}

function isValidPublicId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getAuthorizedPresentation(
  req: NextRequest,
  publicId: string
) {
  if (!isValidPublicId(publicId)) {
    return {
      presentation: null,
      error: "Presentation not found.",
      status: 404,
    };
  }

  const {
    data: presentation,
    error,
  } = await supabaseAdmin
    .from("celebration_presentations")
    .select(`
      id,
      public_id,
      customer_email,
      person_name,
      birth_date,
      death_date,
      featured_photo_url,
      theme,
      status,
      payment_status,
      price_cents,
      amount_paid_cents,
      hosting_days,
      edit_token_hash,
      contributions_enabled,
      activated_at,
      expires_at,
      offline_backup_status,
      converted_memorial_id,
      created_at,
      updated_at
    `)
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !presentation) {
    return {
      presentation: null,
      error: "Presentation not found.",
      status: 404,
    };
  }

  const isPublicView =
    req.method === "GET" &&
    req.nextUrl.searchParams.get("view") ===
      "public";

  if (
    isPublicView &&
    presentation.status === "active" &&
    presentation.payment_status === "paid"
  ) {
    return {
      presentation,
      error: "",
      status: 200,
    };
  }

  const cookieName =
    `celebration_edit_${publicId}`;

  const editToken =
    req.cookies.get(cookieName)?.value || "";

  if (!editToken) {
    return {
      presentation: null,
      error:
        "Editing access is not available for this presentation.",
      status: 403,
    };
  }

  const suppliedHash =
    hashToken(editToken);

  const expectedHash =
    String(
      presentation.edit_token_hash || ""
    );

  if (
    !expectedHash ||
    !hashesMatch(
      suppliedHash,
      expectedHash
    )
  ) {
    return {
      presentation: null,
      error:
        "Editing access is not available for this presentation.",
      status: 403,
    };
  }

  return {
    presentation,
    error: "",
    status: 200,
  };
}

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  try {
    const { publicId } =
      await context.params;

    const access =
      await getAuthorizedPresentation(
        req,
        publicId
      );

    if (!access.presentation) {
      return NextResponse.json(
        {
          error: access.error,
        },
        {
          status: access.status,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const presentation =
      access.presentation;

    const [
      itemsResult,
      musicResult,
    ] = await Promise.all([
      supabaseAdmin
        .from(
          "celebration_presentation_items"
        )
        .select(`
          id,
          item_type,
          photo_url,
          storage_path,
          mux_asset_id,
          mux_playback_id,
          caption,
          attribution,
          submitted_by_name,
          source,
          approval_status,
          sort_order,
          duration_seconds,
          removed_at,
          created_at,
          updated_at
        `)
        .eq(
          "presentation_id",
          presentation.id
        )
        .is("removed_at", null)
        .order(
          "sort_order",
          { ascending: true }
        )
        .order(
          "id",
          { ascending: true }
        ),

      supabaseAdmin
        .from(
          "celebration_presentation_music"
        )
        .select(`
          id,
          source_type,
          source_url,
          storage_path,
          title,
          artist,
          sort_order,
          removed_at,
          created_at,
          updated_at
        `)
        .eq(
          "presentation_id",
          presentation.id
        )
        .is("removed_at", null)
        .order(
          "sort_order",
          { ascending: true }
        )
        .order(
          "id",
          { ascending: true }
        ),
    ]);

    if (itemsResult.error) {
      console.error(
        "LOAD CELEBRATION ITEMS ERROR:",
        itemsResult.error
      );
    }

    if (musicResult.error) {
      console.error(
        "LOAD CELEBRATION MUSIC ERROR:",
        musicResult.error
      );
    }

    return NextResponse.json(
      {
        success: true,

        presentation: {
          publicId:
            presentation.public_id,

          customerEmail:
            presentation.customer_email,

          personName:
            presentation.person_name,

          birthDate:
            presentation.birth_date,

          deathDate:
            presentation.death_date,

          featuredPhotoUrl:
            presentation.featured_photo_url,

          theme:
            presentation.theme,

          status:
            presentation.status,

          paymentStatus:
            presentation.payment_status,

          priceCents:
            presentation.price_cents,

          amountPaidCents:
            presentation.amount_paid_cents,

          hostingDays:
            presentation.hosting_days,

          contributionsEnabled:
            presentation.contributions_enabled,

          activatedAt:
            presentation.activated_at,

          expiresAt:
            presentation.expires_at,

          offlineBackupStatus:
            presentation.offline_backup_status,

          convertedMemorialId:
            presentation.converted_memorial_id,

          createdAt:
            presentation.created_at,

          updatedAt:
            presentation.updated_at,
        },

        items:
          itemsResult.data || [],

        music:
          musicResult.data || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET CELEBRATION PRESENTATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The Celebration of Life Presentation could not be loaded.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  try {
    const { publicId } =
      await context.params;

    const access =
      await getAuthorizedPresentation(
        req,
        publicId
      );

    if (!access.presentation) {
      return NextResponse.json(
        {
          error: access.error,
        },
        { status: access.status }
      );
    }

    const presentation =
      access.presentation;

    if (
      presentation.status ===
        "converted" ||
      presentation.status ===
        "cancelled"
    ) {
      return NextResponse.json(
        {
          error:
            "This presentation can no longer be edited.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updates: Record<
      string,
      string | boolean | null
    > = {};

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "personName"
      )
    ) {
      const personName =
        normalizeText(
          body.personName
        );

      if (!personName) {
        return NextResponse.json(
          {
            error:
              "Please enter the name of the person being celebrated.",
          },
          { status: 400 }
        );
      }

      updates.person_name =
        personName;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "customerEmail"
      )
    ) {
      const customerEmail =
        normalizeEmail(
          body.customerEmail
        );

      if (
        !customerEmail ||
        !isValidEmail(
          customerEmail
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid email address.",
          },
          { status: 400 }
        );
      }

      updates.customer_email =
        customerEmail;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "featuredPhotoUrl"
      )
    ) {
      const featuredPhotoUrl =
        normalizeText(
          body.featuredPhotoUrl
        );

      const expectedPhotoPrefix =
        `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/memorial-photos/celebration-presentations/${publicId}/photos/`;

      if (
        featuredPhotoUrl &&
        !featuredPhotoUrl.startsWith(
          expectedPhotoPrefix
        )
      ) {
        return NextResponse.json(
          {
            error:
              "This featured photo does not belong to this presentation.",
          },
          { status: 400 }
        );
      }

      updates.featured_photo_url =
        featuredPhotoUrl || null;
    }

    let nextBirthDate:
      | string
      | null =
      presentation.birth_date;

    let nextDeathDate:
      | string
      | null =
      presentation.death_date;

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "birthDate"
      )
    ) {
      const rawBirthDate =
        normalizeText(
          body.birthDate
        );

      const birthDate =
        normalizeOptionalDate(
          rawBirthDate
        );

      if (
        rawBirthDate &&
        !birthDate
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid birth date.",
          },
          { status: 400 }
        );
      }

      nextBirthDate = birthDate;

      updates.birth_date =
        birthDate;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "deathDate"
      )
    ) {
      const rawDeathDate =
        normalizeText(
          body.deathDate
        );

      const deathDate =
        normalizeOptionalDate(
          rawDeathDate
        );

      if (
        rawDeathDate &&
        !deathDate
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid death date.",
          },
          { status: 400 }
        );
      }

      nextDeathDate = deathDate;

      updates.death_date =
        deathDate;
    }

    if (
      nextBirthDate &&
      nextDeathDate &&
      new Date(
        `${nextDeathDate}T00:00:00.000Z`
      ).getTime() <
        new Date(
          `${nextBirthDate}T00:00:00.000Z`
        ).getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "The date of death cannot be before the date of birth.",
        },
        { status: 400 }
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "theme"
      )
    ) {
      const theme =
        normalizeText(
          body.theme
        );

      if (
        !ALLOWED_THEMES.has(
          theme
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Please select a valid presentation style.",
          },
          { status: 400 }
        );
      }

      updates.theme = theme;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "contributionsEnabled"
      )
    ) {
      updates.contributions_enabled =
        body.contributionsEnabled ===
        true;
    }

    if (
      Object.keys(updates).length ===
      0
    ) {
      return NextResponse.json({
        success: true,
        message:
          "No presentation changes were needed.",
      });
    }

    const {
      data: updated,
      error: updateError,
    } = await supabaseAdmin
      .from(
        "celebration_presentations"
      )
      .update(updates)
      .eq(
        "id",
        presentation.id
      )
      .select(`
        public_id,
        customer_email,
        person_name,
        birth_date,
        death_date,
        featured_photo_url,
        theme,
        status,
        payment_status,
        price_cents,
        amount_paid_cents,
        hosting_days,
        contributions_enabled,
        activated_at,
        expires_at,
        offline_backup_status,
        converted_memorial_id,
        created_at,
        updated_at
      `)
      .single();

    if (
      updateError ||
      !updated
    ) {
      console.error(
        "UPDATE CELEBRATION PRESENTATION ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Your changes could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      presentation: {
        publicId:
          updated.public_id,

        customerEmail:
          updated.customer_email,

        personName:
          updated.person_name,

        birthDate:
          updated.birth_date,

        deathDate:
          updated.death_date,

        featuredPhotoUrl:
          updated.featured_photo_url,

        theme:
          updated.theme,

        status:
          updated.status,

        paymentStatus:
          updated.payment_status,

        priceCents:
          updated.price_cents,

        amountPaidCents:
          updated.amount_paid_cents,

        hostingDays:
          updated.hosting_days,

        contributionsEnabled:
          updated.contributions_enabled,

        activatedAt:
          updated.activated_at,

        expiresAt:
          updated.expires_at,

        offlineBackupStatus:
          updated.offline_backup_status,

        convertedMemorialId:
          updated.converted_memorial_id,

        createdAt:
          updated.created_at,

        updatedAt:
          updated.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "PATCH CELEBRATION PRESENTATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Your Celebration of Life Presentation could not be saved.",
      },
      { status: 500 }
    );
  }
}
