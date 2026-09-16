import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { activateCelebrationPurchase } from "../../../../lib/celebration-purchase";

const publicIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await context.params;

  if (!publicIdPattern.test(publicId)) {
    return NextResponse.json(
      { error: "Presentation not found." },
      { status: 404 }
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Payment confirmation is not available." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const sessionId =
    typeof body?.sessionId === "string" ? body.sessionId.trim() : "";

  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json(
      { error: "Payment session is missing." },
      { status: 400 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data: presentation, error } = await admin
    .from("celebration_presentations")
    .select(
      "id, edit_token_hash, stripe_checkout_session_id, payment_status"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !presentation) {
    return NextResponse.json(
      { error: "Presentation not found." },
      { status: 404 }
    );
  }

  const token =
    req.cookies.get(`celebration_edit_${publicId}`)?.value || "";

  const supplied = Buffer.from(
    createHash("sha256").update(token).digest("hex")
  );
  const expected = Buffer.from(
    String(presentation.edit_token_hash || "")
  );

  if (
    !token ||
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return NextResponse.json(
      { error: "Editing access is required to confirm this payment." },
      { status: 403 }
    );
  }

  if (
    !presentation.stripe_checkout_session_id ||
    presentation.stripe_checkout_session_id !== sessionId
  ) {
    return NextResponse.json(
      { error: "This payment session does not match the presentation." },
      { status: 409 }
    );
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2026-04-22.dahlia",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.status !== "complete" ||
      session.payment_status !== "paid" ||
      session.metadata?.checkoutType !== "celebration_presentation" ||
      session.metadata?.publicId !== publicId ||
      Number(session.metadata?.presentationId) !== presentation.id
    ) {
      return NextResponse.json(
        { error: "Stripe has not confirmed this presentation payment." },
        { status: 409 }
      );
    }

    await activateCelebrationPurchase(
      stripe,
      session,
      session.created,
      req.nextUrl.origin
    );

    return NextResponse.json(
      { ok: true, paymentStatus: "paid" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (confirmationError) {
    console.error(
      "Celebration payment return confirmation failed:",
      confirmationError
    );

    return NextResponse.json(
      {
        error:
          "Your payment was received, but activation is still being completed.",
      },
      { status: 500 }
    );
  }
}