import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: {
    absolute: "Search MyEMemorials | Find Online Memorials",
  },
  description:
    "Search published MyEMemorials by name, cemetery, city, state, country, school, or award to find online memorials and preserved family history.",
  keywords: [
    "search online memorials",
    "find a memorial",
    "memorial search",
    "online memorial search",
    "search obituaries",
    "find MyEMemorials",
    "family history search",
    "cemetery memorial search",
  ],
  alternates: {
    canonical: "/search",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Search MyEMemorials | Find Online Memorials",
    description:
      "Search published MyEMemorials by name, cemetery, location, school, or award.",
    url: "/search",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search MyEMemorials | Find Online Memorials",
    description:
      "Search published MyEMemorials by name, cemetery, location, school, or award.",
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
