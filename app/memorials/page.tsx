import type { Metadata } from "next";
import MemorialsClient from "./MemorialsClient";

export const metadata: Metadata = {
  title: {
    absolute: "Departed MyEMemorials | Online Memorials for Loved Ones",
  },
  description:
    "Create a Departed MyEMemorial for someone who has passed. Preserve their life story, photos, videos, music, family history, obituary, and memories in one online memorial.",
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
    title: "Departed MyEMemorials | Online Memorials for Loved Ones",
    description:
      "Create an online memorial website to preserve the life story, photos, videos, music, family history, obituary details, and memories of someone who has passed.",
    url: "/memorials",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Departed MyEMemorials | Online Memorials for Loved Ones",
    description:
      "Create an online memorial website to preserve the life story, photos, videos, music, family history, obituary details, and memories of someone who has passed.",
  },
};

export default function MemorialsPage() {
  return <MemorialsClient />;
}
