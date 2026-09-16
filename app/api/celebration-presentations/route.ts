import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const CREATOR_COOKIE_DAYS = 30;

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPrivateToken() {
  return randomBytes(32).toString("hex");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeOptionalDate(value: unknown) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(`${text}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const personName = normalizeText(body?.personName);
    const customerEmail = normalizeEmail(body?.customerEmail);

    const birthDateRaw = normalizeText(body?.birthDate);
    const deathDateRaw = normalizeText(body?.deathDate);

    if (!personName) {
      return NextResponse.json(
        {
          error: "Please enter the name of the person being celebrated.",
        },
        { status: 400 }
      );
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const birthDate = normalizeOptionalDate(birthDateRaw);
    const deathDate = normalizeOptionalDate(deathDateRaw);

    if (birthDateRaw && !birthDate) {
      return NextResponse.json(
        {
          error: "Please enter a valid birth date.",
        },
        { status: 400 }
      );
    }

    if (deathDateRaw && !deathDate) {
      return NextResponse.json(
        {
          error: "Please enter a valid death date.",
        },
        { status: 400 }
      );
    }

    if (
      birthDate &&
      deathDate &&
      new Date(`${deathDate}T00:00:00.000Z`).getTime() <
        new Date(`${birthDate}T00:00:00.000Z`).getTime()
    ) {
      return NextResponse.json(
        {
          error: "The date of death cannot be before the date of birth.",
        },
        { status: 400 }
      );
    }

    const editToken = createPrivateToken();
    const editTokenHash = hashToken(editToken);

    const {
      data: presentation,
      error: createError,
    } = await supabaseAdmin
      .from("celebration_presentations")
      .insert({
        customer_email: customerEmail,
        person_name: personName,
        birth_date: birthDate,
        death_date: deathDate,
        edit_token_hash: editTokenHash,
        status: "draft",
        payment_status: "unpaid",
        price_cents: 2995,
        hosting_days: 60,
      })
      .select(
        `
          id,
          public_id,
          person_name,
          customer_email,
          birth_date,
          death_date,
          theme,
          status,
          payment_status,
          price_cents,
          hosting_days,
          created_at
        `
      )
      .single();

    if (createError || !presentation) {
      console.error(
        "CREATE CELEBRATION PRESENTATION ERROR:",
        createError
      );

      return NextResponse.json(
        {
          error:
            "Your Celebration of Life Presentation could not be started.",
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      presentation: {
        publicId: presentation.public_id,
        personName: presentation.person_name,
        customerEmail: presentation.customer_email,
        birthDate: presentation.birth_date,
        deathDate: presentation.death_date,
        theme: presentation.theme,
        status: presentation.status,
        paymentStatus: presentation.payment_status,
        priceCents: presentation.price_cents,
        hostingDays: presentation.hosting_days,
        createdAt: presentation.created_at,
      },
      editUrl:
        `/celebration-of-life-slideshow/create/` +
        `${presentation.public_id}`,
    });

    response.cookies.set({
      name: `celebration_edit_${presentation.public_id}`,
      value: editToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        CREATOR_COOKIE_DAYS *
        24 *
        60 *
        60,
    });

    return response;
  } catch (error) {
    console.error(
      "CREATE CELEBRATION PRESENTATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Your Celebration of Life Presentation could not be started.",
      },
      { status: 500 }
    );
  }
}