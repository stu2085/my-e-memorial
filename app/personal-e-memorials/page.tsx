import type { Metadata } from "next";
import PersonalEMemorialClient from "./PersonalEMemorialClient";

export const metadata: Metadata = {
  title: {
    absolute: "Living MyEMemorial | Preserve Your Life Story",
  },
  description:
    "Create a Living MyEMemorial to preserve your life story in your own words with photos, videos, family history, memories, and legacy instructions. Start free and keep adding throughout your life.",
  keywords: [
    "Living MyEMemorial",
    "living memorial",
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

export default function PersonalEMemorialPage() {
  return <PersonalEMemorialClient />;
}
