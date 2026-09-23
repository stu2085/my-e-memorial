import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{
    publicId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { publicId } = await context.params;

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to claim this Presentation.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user?.id || !user.email) {
      return NextResponse.json(
        {
          error:
            "Your sign-in session could not be verified.",
        },
        { status: 401 }
      );
    }

    const {
      data: presentation,
      error: presentationError,
    } = await supabaseAdmin
      .from("celebration_presentations")
      .select(`
        id,
        public_id,
        customer_email,
        person_name,
        status,
        payment_status,
        expires_at,
        claimed_by,
        claimed_at,
        memorial_id
      `)
      .eq("public_id", publicId)
      .maybeSingle();

    if (presentationError) {
      console.error(
        "Presentation claim lookup error:",
        presentationError
      );

      return NextResponse.json(
        {
          error:
            "Could not verify this Presentation.",
        },
        { status: 500 }
      );
    }

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "This Presentation could not be found.",
        },
        { status: 404 }
      );
    }

    if (
      user.email.toLowerCase() !==
      presentation.customer_email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "This Presentation was purchased using a different email address.",
        },
        { status: 403 }
      );
    }

    if (presentation.payment_status !== "paid") {
      return NextResponse.json(
        {
          error:
            "This Presentation is not eligible to be claimed.",
        },
        { status: 400 }
      );
    }

    const hasExpired =
      presentation.status === "expired" ||
      (presentation.expires_at &&
        new Date(presentation.expires_at).getTime() <
          Date.now());

    if (hasExpired) {
      return NextResponse.json(
        {
          error:
            "This Presentation's 60-day access period has expired.",
        },
        { status: 410 }
      );
    }

    if (presentation.status !== "active") {
      return NextResponse.json(
        {
          error:
            "This Presentation is not currently available to be claimed.",
        },
        { status: 400 }
      );
    }

    if (presentation.claimed_by) {
      if (presentation.claimed_by === user.id) {
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          publicId: presentation.public_id,
          personName: presentation.person_name,
          memorialId: presentation.memorial_id,
        });
      }

      return NextResponse.json(
        {
          error:
            "This Presentation has already been claimed.",
        },
        { status: 409 }
      );
    }

    if (presentation.memorial_id) {
      return NextResponse.json(
        {
          error:
            "This Presentation is already linked to a MyEMemorial.",
        },
        { status: 409 }
      );
    }

    const claimedAt = new Date().toISOString();

    const {
      data: claimedPresentation,
      error: claimError,
    } = await supabaseAdmin
      .from("celebration_presentations")
      .update({
        claimed_by: user.id,
        claimed_at: claimedAt,
      })
      .eq("id", presentation.id)
      .is("claimed_by", null)
      .select(`
        public_id,
        person_name,
        claimed_by,
        claimed_at,
        memorial_id
      `)
      .maybeSingle();

    if (claimError) {
      console.error(
        "Presentation claim update error:",
        claimError
      );

      return NextResponse.json(
        {
          error:
            "Could not claim this Presentation.",
        },
        { status: 500 }
      );
    }

    if (!claimedPresentation) {
      const {
        data: latestPresentation,
        error: latestError,
      } = await supabaseAdmin
        .from("celebration_presentations")
        .select(`
          public_id,
          person_name,
          claimed_by,
          claimed_at,
          memorial_id
        `)
        .eq("id", presentation.id)
        .maybeSingle();

      if (
        !latestError &&
        latestPresentation?.claimed_by === user.id
      ) {
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          publicId: latestPresentation.public_id,
          personName: latestPresentation.person_name,
          memorialId: latestPresentation.memorial_id,
        });
      }

      return NextResponse.json(
        {
          error:
            "This Presentation was claimed by another account.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      publicId: claimedPresentation.public_id,
      personName: claimedPresentation.person_name,
      memorialId: claimedPresentation.memorial_id,
    });
  } catch (error) {
    console.error(
      "Presentation claim error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not claim this Presentation.",
      },
      { status: 500 }
    );
  }
}
