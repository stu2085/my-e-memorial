import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import MemorialDetailClient from "./MemorialDetailClient";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type PageProps = {
  params: Promise<{ slug: string }>;
};

const getMemorial = cache(async (slug: string) => {
  const { data } = await supabaseServer
    .from("memorials")
    .select(
      "slug, full_name, first_name, middle_name, last_name, birth_date, death_date, obituary, life_story, featured_photo_url, headstone_photo_1, is_published, is_living_preplan"
    )
    .eq("slug", slug)
    .maybeSingle();

  return data;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMemorial(slug);

  if (!data || data.is_published !== true) {
    return {
      title: "Memorial Not Available",
      description: "This memorial is not currently available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const name = data.full_name || "MyEMemorial";
  const isLiving = data.is_living_preplan === true;

  const title = isLiving
    ? `${name} | Living MyEMemorial`
    : `${name} Online Memorial | MyEMemorial`;

  const description = isLiving
    ? `Explore ${name}'s Living MyEMemorial, preserving life stories, photos, videos, family history, memories, and experiences for future generations.`
    : `Remember ${name} through their online MyEMemorial with life stories, photos, videos, family history, obituary details, favorite music, and memories shared by family and friends.`;

  const url = `https://www.myememorial.com/memorial/${data.slug}`;
  const image =
    data.featured_photo_url ||
    data.headstone_photo_1 ||
    "https://www.myememorial.com/gravestone1.jpg";

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "MyEMemorial",
      type: "profile",
      images: [
        {
          url: image,
          alt: `${name} MyEMemorial`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const data = await getMemorial(slug);

  const name = data?.full_name || "MyEMemorial";
  const url = `https://www.myememorial.com/memorial/${slug}`;

  const structuredData =
    data && data.is_published === true
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name,
          givenName: data.first_name || undefined,
          additionalName: data.middle_name || undefined,
          familyName: data.last_name || undefined,
          birthDate: data.birth_date || undefined,
          deathDate: data.death_date || undefined,
          description:
            data.is_living_preplan === true
              ? `Living MyEMemorial for ${name}, preserving life stories, photos, videos, family history, memories, and experiences for future generations.`
              : `Online memorial for ${name} featuring life stories, photos, videos, family history, obituary details, favorite music, and memories shared by family and friends.`,
          image:
            data.featured_photo_url ||
            data.headstone_photo_1 ||
            undefined,
          url,
          mainEntityOfPage: url,
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
