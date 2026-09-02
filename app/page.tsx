import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const homepageTitle =
  "Online Memorials & Personal Life Stories | MyEMemorial";

const homepageDescription =
  "Create a Living MyEMemorial or online memorial to preserve life stories, photos, videos, family history, obituaries, and memories for generations.";

export const metadata: Metadata = {
  title: {
    absolute: homepageTitle,
  },
  description: homepageDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: "/",
    siteName: "MyEMemorial",
    type: "website",
    images: [
      {
        url: "/myememorial-logo.png",
        width: 1200,
        height: 630,
        alt: "MyEMemorial",
      },
    ],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
