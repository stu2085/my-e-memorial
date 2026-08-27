import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 120;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const MAX_EXTENSIONS_PER_DAY = 5;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

function getBearerToken(req: NextRequest) {
  const authorization =
    req.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Please sign in again before creating a full-width banner.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your sign-in session has expired. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const openAiApiKey =
      process.env.OPENAI_API_KEY || "";

    if (!openAiApiKey) {
      return NextResponse.json(
        {
          error:
            "Automatic banner extension is not configured yet.",
        },
        { status: 503 }
      );
    }

    /*
     * Cost protection: each signed-in account may create up to five
     * AI-extended banners in a rolling 24-hour period.
     */
    const cutoff = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const {
      count: recentExtensionCount,
      error: usageLookupError,
    } = await supabaseAdmin
      .from("banner_extension_usage")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .gte("created_at", cutoff);

    if (usageLookupError) {
      console.error(
        "BANNER EXTENSION USAGE LOOKUP ERROR:",
        usageLookupError
      );

      return NextResponse.json(
        {
          error:
            "Automatic banner extension is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    if (
      Number(recentExtensionCount || 0) >=
      MAX_EXTENSIONS_PER_DAY
    ) {
      return NextResponse.json(
        {
          error:
            "You have reached today's banner-extension limit. You can still choose a MyEMemorial banner or use a wide photo.",
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image");
    const mask = formData.get("mask");

    if (!(image instanceof File) || !(mask instanceof File)) {
      return NextResponse.json(
        {
          error:
            "The banner photo could not be prepared for extension.",
        },
        { status: 400 }
      );
    }

    if (
      image.type !== "image/png" ||
      mask.type !== "image/png"
    ) {
      return NextResponse.json(
        {
          error:
            "The banner extension request must use PNG image data.",
        },
        { status: 400 }
      );
    }

    if (
      image.size <= 0 ||
      mask.size <= 0 ||
      image.size > MAX_INPUT_BYTES ||
      mask.size > MAX_INPUT_BYTES
    ) {
      return NextResponse.json(
        {
          error:
            "The banner photo is too large to extend.",
        },
        { status: 400 }
      );
    }

    const openAiForm = new FormData();

    openAiForm.append("model", "gpt-image-2");
    openAiForm.append("image[]", image);
    openAiForm.append("mask", mask);
    openAiForm.append("size", "1536x512");
    openAiForm.append("quality", "medium");
    openAiForm.append("output_format", "png");
    openAiForm.append("moderation", "auto");
    openAiForm.append(
      "prompt",
      [
        "Create a natural, seamless 3:1 panoramic extension of this photograph.",
        "Generate only plausible continuation of the existing scenery/background into the transparent areas on the left and right.",
        "Match the original lighting, perspective, color, season, weather, depth of field, texture, and camera style.",
        "Do not add, remove, duplicate, move, or alter any person, face, body, pet, vehicle, building, memorial marker, readable text, or important object from the original photograph.",
        "Do not mirror or repeat the original image.",
        "Do not create blurred side panels, frames, borders, collages, text, logos, or decorative overlays.",
        "The result must look like one continuous photograph captured with a wider camera.",
      ].join(" ")
    );

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/images/edits",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: openAiForm,
      }
    );

    const requestId =
      openAiResponse.headers.get("x-request-id");

    const openAiResult =
      await openAiResponse.json();

    if (!openAiResponse.ok) {
      console.error(
        "OPENAI BANNER EXTENSION ERROR:",
        {
          status: openAiResponse.status,
          requestId,
          error: openAiResult?.error,
        }
      );

      const errorCode =
        openAiResult?.error?.code || "";

      const publicMessage =
        errorCode === "moderation_blocked"
          ? "This photo could not be processed by the image-safety system. You can choose a MyEMemorial banner or try another photo."
          : openAiResponse.status === 429
            ? "The banner service is busy right now. Please try again in a little while."
            : "The full-width banner could not be created. Please try again.";

      return NextResponse.json(
        {
          error: publicMessage,
        },
        {
          status:
            openAiResponse.status === 429
              ? 429
              : 502,
        }
      );
    }

    const imageBase64 =
      openAiResult?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        {
          error:
            "The banner service did not return an image.",
        },
        { status: 502 }
      );
    }

    const { error: usageInsertError } =
      await supabaseAdmin
        .from("banner_extension_usage")
        .insert({
          user_id: user.id,
          openai_request_id: requestId || null,
        });

    if (usageInsertError) {
      /*
       * Do not discard a successfully generated banner because the
       * usage audit insert failed. Log it so it can be investigated.
       */
      console.error(
        "BANNER EXTENSION USAGE INSERT ERROR:",
        usageInsertError
      );
    }

    return NextResponse.json({
      success: true,
      imageBase64,
    });
  } catch (error) {
    console.error(
      "MEMORIAL BANNER EXTENSION ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The full-width banner could not be created.",
      },
      { status: 500 }
    );
  }
}
