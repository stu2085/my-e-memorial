import type { Metadata } from "next";
import MemorialsClient from "./MemorialsClient";

export const metadata: Metadata = {
  title: {
    absolute: "Online Memorials | Create a Departed MyEMemorial",
  },
  description:
    "Create a Departed MyEMemorial to preserve a loved one's life story, photos, videos, music, family history, obituary details, and memories in one place.",
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
    title: "Online Memorials | Create a Departed MyEMemorial",
    description:
      "Preserve the life story, photos, videos, music, family history, obituary details, and memories of someone who has passed.",
    url: "/memorials",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Memorials | Create a Departed MyEMemorial",
    description:
      "Preserve the life story, photos, videos, music, family history, obituary details, and memories of someone who has passed.",
  },
};

export default function MemorialsPage() {
  return <MemorialsClient />;
}
