import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import MemorialDetailClient from "./MemorialDetailClient";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const { data } = await supabaseServer
    .from("memorials")
    .select(
      "slug, full_name, first_name, middle_name, last_name, birth_date, death_date, obituary, life_story, featured_photo_url, headstone_photo_1, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data || data.is_published === false) {
    return {
      title: "Memorial Not Available | MyEMemorial",
      description: "This memorial is not currently available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const name = data.full_name || "Memorial";
  const description =
    data.obituary?.slice(0, 155) ||
    data.life_story?.slice(0, 155) ||
    `View the memorial page for ${name} on MyEMemorial.`;

  const url = `https://www.myememorial.com/memorial/${data.slug}`;
  const image =
    data.featured_photo_url ||
    data.headstone_photo_1 ||
    "https://www.myememorial.com/gravestone1.jpg";

  return {
    title: `${name} Memorial | MyEMemorial`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${name} Memorial | MyEMemorial`,
      description,
      url,
      type: "website",
      images: [{ url: image }],
    },
  };
}

export default function Page() {
  return <MemorialDetailClient />;
}