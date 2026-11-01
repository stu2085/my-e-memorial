import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const databaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!databaseUrl || !anonymousKey) {
    return new Response("Sharing image unavailable", { status: 503 });
  }

  const supabase = createClient(databaseUrl, anonymousKey);
  const { data, error } = await supabase
    .from("memorials")
    .select("featured_photo_url, headstone_photo_1, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return new Response("Sharing image unavailable", { status: 503 });
  if (!data || data.is_published !== true) {
    return new Response("Memorial not available", { status: 404 });
  }

  const source = data.featured_photo_url || data.headstone_photo_1;
  if (!source) {
    return Response.redirect("https://www.myememorial.com/gravestone1.jpg", 302);
  }

  try {
    // Only fetch public files from our own storage. Do not accept arbitrary URLs.
    const photoUrl = new URL(source);
    if (
      photoUrl.protocol !== "https:" ||
      photoUrl.origin !== new URL(databaseUrl).origin ||
      !photoUrl.pathname.startsWith("/storage/v1/object/public/")
    ) {
      return new Response("Unsupported sharing image source", { status: 422 });
    }

    const photo = await fetch(photoUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!photo.ok) throw new Error("Photo download failed");
    const mime = photo.headers.get("content-type")?.split(";")[0];
    if (!mime || !["image/png", "image/jpeg", "image/webp"].includes(mime)) {
      throw new Error("Unsupported photo format");
    }
    const bytes = await photo.arrayBuffer();
    const image = await sharp(Buffer.from(bytes), {
      limitInputPixels: 40000000,
      animated: false,
    })
      .rotate()
      .resize(1200, 630, {
        fit: "contain",
        background: "#edf4fa",
      })
      .flatten({ background: "#edf4fa" })
      .png({ compressionLevel: 9 })
      .toBuffer();

    // Finish rendering before returning so failures are caught below.
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("MEMORIAL SHARING IMAGE ERROR:", error);
    // Do not cache a logo in place of a failed portrait; allow a later retry.
    return new Response("Sharing image temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
