import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

type Props = {
  params: Promise<{ slug: string }>;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const { data } = await supabase
    .from("memorials")
    .select(`
      full_name,
      obituary,
      headstone_photo_1,
      gallery_photos
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return {
      title: "Memorial Not Found | MyEMemorial",
    };
  }

  const image =
    data.headstone_photo_1 ||
    (
      Array.isArray(data.gallery_photos)
        ? data.gallery_photos[0]
        : typeof data.gallery_photos === "string"
          ? data.gallery_photos.split(",")[0]
          : null
    ) ||
    "/og-default.jpg";

  const description =
    data.obituary?.slice(0, 160) ||
    `Remembering ${data.full_name}`;

  const url = `https://myememorial.com/memorial/${slug}`;

  return {
    title: `${data.full_name} | MyEMemorial`,
    description,

    openGraph: {
      title: `${data.full_name} | MyEMemorial`,
      description,
      url,
      siteName: "MyEMemorial",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: data.full_name || "Memorial",
        },
      ],
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: `${data.full_name} | MyEMemorial`,

      description,
      images: [image],
    },
  };
}