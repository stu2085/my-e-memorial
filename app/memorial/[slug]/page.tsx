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
      title: "Memorial Not Available",
      description: "This memorial is not currently available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const name = data.full_name || "Memorial";
  const description = `View the online memorial of ${name} including photos, videos, life story, obituary information, family history, cemetery details, favorite music, and memories shared by family and friends.`;

  const url = `https://www.myememorial.com/memorial/${data.slug}`;
  const image =
    data.featured_photo_url ||
    data.headstone_photo_1 ||
    "https://www.myememorial.com/gravestone1.jpg";

  return {
    title: `${name} Memorial`,
    description,
    robots: {
  index: true,
  follow: true,
},
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${name} Memorial`,
      description,
      url,
      type: "website",
      images: [{ url: image }],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  const { data } = await supabaseServer
    .from("memorials")
    .select(
      "slug, full_name, first_name, middle_name, last_name, birth_date, death_date, obituary, life_story, featured_photo_url, headstone_photo_1, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

  const name = data?.full_name || "Memorial";
  const url = `https://www.myememorial.com/memorial/${slug}`;

  const structuredData =
    data && data.is_published !== false
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name,
          givenName: data.first_name || undefined,
          additionalName: data.middle_name || undefined,
          familyName: data.last_name || undefined,
          birthDate: data.birth_date || undefined,
          deathDate: data.death_date || undefined,
          description: `Online memorial for ${name} featuring photos, videos, life story, obituary information, family history, cemetery details, favorite music, and memories shared by family and friends.`,
          image:
            data.featured_photo_url ||
            data.headstone_photo_1 ||
            undefined,
          url,
        }
      : null;

  return (
    <>
      {structuredData && (
        <script
          id="memorial-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      <MemorialDetailClient />
    </>
  );
}