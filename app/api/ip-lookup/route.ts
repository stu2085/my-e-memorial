import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const forwardedFor =
      req.headers.get("x-forwarded-for") || "";

    let ip = forwardedFor.split(",")[0].trim();

if (!ip || ip === "::1" || ip === "127.0.0.1") {
  ip = "173.70.95.1";
}

    if (!ip) {
      return NextResponse.json({
        zip: null,
      });
    }

    const response = await fetch(`http://ip-api.com/json/${ip}`);

    const data = await response.json();

    return NextResponse.json({
  ip,
  zip: data.zip || null,
  city: data.city || null,
  region: data.regionName || null,
  raw: data,
});
  } catch (error) {
    console.error("IP LOOKUP ERROR:", error);

    return NextResponse.json({
      zip: null,
    });
  }
}