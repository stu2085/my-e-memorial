import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.watch",
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "vimeo.com",
  "www.vimeo.com",
];

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();

  return ALLOWED_HOSTS.some(
    (allowedHost) =>
      host === allowedHost || host.endsWith(`.${allowedHost}`)
  );
}

function getMetaContent(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return match[1]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
  }

  return "";
}

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get("url");

  if (!videoUrl) {
    return NextResponse.json(
      { imageUrl: "" },
      { status: 400 }
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(videoUrl);
  } catch {
    return NextResponse.json(
      { imageUrl: "" },
      { status: 400 }
    );
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !isAllowedHost(parsedUrl.hostname)
  ) {
    return NextResponse.json(
      { imageUrl: "" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MyEMemorial/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ imageUrl: "" });
    }

    const html = await response.text();

    const imageUrl =
      getMetaContent(html, "og:image") ||
      getMetaContent(html, "twitter:image");

    return NextResponse.json({
      imageUrl: imageUrl || "",
    });
  } catch (error) {
    console.error("VIDEO LINK PREVIEW ERROR:", error);

    return NextResponse.json({
      imageUrl: "",
    });
  }
}