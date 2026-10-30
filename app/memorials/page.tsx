import type { Metadata } from "next";
import MemorialsClient from "./MemorialsClient";

export const metadata: Metadata = {
  title: {
    absolute: "Memorial Websites to Honor a Loved One | MyEMemorial",
  },
  description:
    "Every loved one has a story worth remembering. Create a beautiful memorial website to honor their life and share treasured photos, videos, stories and memories.",
  keywords: [
    "online memorial",
    "memorial website",
    "memorial websites",
    "create a memorial website",
    "memorial website for loved one",
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
    title: "Memorial Websites to Honor a Loved One | MyEMemorial",
    description:
      "Every loved one has a story worth remembering. Create a beautiful online memorial to honor their life and share photos, videos, stories and memories.",
    url: "/memorials",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memorial Websites to Honor a Loved One | MyEMemorial",
    description:
      "Every loved one has a story worth remembering. Create a beautiful online memorial to honor their life and share photos, videos, stories and memories.",
  },
};

export default function MemorialsPage() {
  return <MemorialsClient />;
}
