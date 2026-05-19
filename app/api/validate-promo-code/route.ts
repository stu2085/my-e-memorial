import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    const enteredCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!enteredCode) {
      return NextResponse.json(
        { error: "Please enter a promotional code." },
        { status: 400 }
      );
    }

    const { data: promoCode, error } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", enteredCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("PROMO VALIDATION ERROR:", error);

      return NextResponse.json(
        { error: "Could not validate promotional code." },
        { status: 500 }
      );
    }

    if (!promoCode) {
      return NextResponse.json(
        { error: "Invalid or inactive promotional code." },
        { status: 404 }
      );
    }

    if (
      promoCode.max_uses &&
      Number(promoCode.uses_count || 0) >=
        Number(promoCode.max_uses)
    ) {
      return NextResponse.json(
        {
          error:
            "This promotional code has reached its usage limit.",
        },
        { status: 400 }
      );
    }

    if (
      promoCode.expires_at &&
      new Date(promoCode.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "This promotional code has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        allowed_plan: promoCode.allowed_plan,
        promotion_category:
          promoCode.promotion_category,
      },
    });
  } catch (error) {
    console.error(
      "PROMO VALIDATION ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Could not validate promotional code." },
      { status: 500 }
    );
  }
}