import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
          ).toString("base64"),
      },
      body: JSON.stringify({
        new_asset_settings: {
          playback_policy: ["public"],
        },
        cors_origin: "http://localhost:3000",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MUX UPLOAD ERROR:", data);
      return NextResponse.json(
        { error: "Failed to create Mux upload" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: data.data.url,
      uploadId: data.data.id,
    });
  } catch (error) {
    console.error("MUX UPLOAD ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Server error creating Mux upload" },
      { status: 500 }
    );
  }
}