import type { Metadata } from "next";
import MemorialsClient from "./MemorialsClient";

export const metadata: Metadata = {
  title: {
    absolute: "Online Memorials | Create a Deceased MyEMemorial",
  },
  description:
    "Create a lasting online memorial for someone who has passed. Preserve their life story, photos, videos, favorite music, family history, obituary details, and memories in one shareable MyEMemorial.",
  keywords: [
    "online memorial",
    "memorial website",
    "digital memorial",
    "online obituary",
    "memorial page",
    "tribute website",
    "life story memorial",
    "funeral memorial",
    "celebration of life presentation",
    "memorial slideshow",
    "cemetery memorial",
    "family memorial",
  ],
  alternates: {
    canonical: "/memorials",
  },
  openGraph: {
    title: "Online Memorials | Create a Deceased MyEMemorial",
    description:
      "Preserve the life story, photos, videos, music, family history, obituary details, and memories of someone who has passed.",
    url: "/memorials",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Memorials | Create a Deceased MyEMemorial",
    description:
      "Preserve the life story, photos, videos, music, family history, obituary details, and memories of someone who has passed.",
  },
};

export default function MemorialsPage() {
  return <MemorialsClient />;
}
