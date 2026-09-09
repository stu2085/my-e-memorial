import type { Metadata } from "next";
import PersonalEMemorialClient from "./PersonalEMemorialClient";

export const metadata: Metadata = {
  title: {
    absolute: "Living MyEMemorial | Preserve Your Life Story",
  },
  description:
    "Create a Living MyEMemorial to preserve your life story, photos, videos, family history, and living legacy for future generations. Start free and add over time.",
  keywords: [
    "Living MyEMemorial",
    "living memorial",
    "living legacy",
    "life story website",
    "preserve my life story",
    "digital legacy",
    "online life story",
    "legacy website",
    "family history memorial",
    "video memories",
    "Celebration of Life Presentation",
  ],
  alternates: {
    canonical: "/personal-e-memorials",
  },
  openGraph: {
    title: "Living MyEMemorial | Preserve Your Life Story",
    description:
      "Tell your story in your own words and preserve your memories, photos, videos, family history, and legacy for future generations.",
    url: "/personal-e-memorials",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Living MyEMemorial | Preserve Your Life Story",
    description:
      "Tell your story in your own words and preserve your memories, photos, videos, family history, and legacy for future generations.",
  },
};

export default async function PersonalEMemorialPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawUpgrade = Array.isArray(resolvedSearchParams.upgrade)
    ? resolvedSearchParams.upgrade[0]
    : resolvedSearchParams.upgrade;
  const upgradeMemorialId = Number(rawUpgrade || 0);

  return <PersonalEMemorialClient upgradeMemorialId={upgradeMemorialId} />;
}
