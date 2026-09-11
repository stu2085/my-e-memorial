import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const homepageTitle =
  "Create an Online Memorial Website | MyEMemorial";

const homepageDescription =
  "Create an online memorial website or Living MyEMemorial to preserve and share life stories, photos, videos, music, family history, and memories.";

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
  twitter: {
    card: "summary_large_image",
    title: homepageTitle,
    description: homepageDescription,
    images: ["/myememorial-logo.png"],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
