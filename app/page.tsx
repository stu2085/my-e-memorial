import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Online Memorials & Personal Life Stories",
  description:
    "Create a Living MyEMemorial to preserve your own life story, or create an online memorial for someone who has passed. Preserve stories, photos, videos, family history, obituaries, and memories for generations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyEMemorial | Online Memorials & Personal Life Stories",
    description:
      "Preserve your own life story with a Living MyEMemorial or create a lasting online memorial for someone who has passed.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
