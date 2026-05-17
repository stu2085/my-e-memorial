import { NextRequest, NextResponse } from "next/server";

const requestLog = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0].trim() || "unknown";

    const now = Date.now();
    const windowMs = 60_000;
    const maxRequests = 10;

    const record = requestLog.get(ip);

    if (!record || now > record.resetAt) {
      requestLog.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      record.count += 1;
      requestLog.set(ip, record);

      if (record.count > maxRequests) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a minute and try again." },
          { status: 429 }
        );
      }
    }

    const body = await req.json();

    const street = String(body.street ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim();
    const zip = String(body.zip ?? "").trim();
    const country = String(body.country ?? "").trim() || "USA";

    if (!street && !city && !state && !zip) {
      return NextResponse.json(
        { error: "Enter at least a city and state, or a full address." },
        { status: 400 }
      );
    }

    const address = [street, city, state, zip, country]
      .filter(Boolean)
      .join(", ");

    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Google Geocoding API key." },
        { status: 500 }
      );
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Google geocoding request failed." },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (
      data.status !== "OK" ||
      !Array.isArray(data.results) ||
      data.results.length === 0
    ) {
      return NextResponse.json(
        {
          error: "No matching location found.",
          google_status: data.status,
        },
        { status: 404 }
      );
    }

    const location = data.results[0].geometry?.location;

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return NextResponse.json(
        { error: "Invalid coordinates returned by Google." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      lat: location.lat,
      lng: location.lng,
      formatted_address: data.results[0].formatted_address ?? address,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not geocode address." },
      { status: 500 }
    );
  }
}