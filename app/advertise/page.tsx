import type { Metadata } from "next";
import AdvertiseClient from "./AdvertiseClient";

type PageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

const ALLOWED_CATEGORIES = new Set([
  "flower_shop",
  "funeral_home",
  "attorney",
  "estate_planner",
  "cemetery",
  "monument_company",
]);

export const metadata: Metadata = {
  title: {
    absolute: "Advertise on MyEMemorial | Local ZIP Code Advertising",
  },
  description:
    "Advertise your funeral home, monument company, flower shop, cemetery, estate planning, or legal services on MyEMemorial with local ZIP-code advertising.",
  keywords: [
    "funeral home advertising",
    "memorial website advertising",
    "local funeral advertising",
    "cemetery advertising",
    "monument company advertising",
    "estate planning advertising",
    "funeral industry marketing",
  ],
  alternates: {
    canonical: "/advertise",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Advertise on MyEMemorial | Local ZIP Code Advertising",
    description:
      "Reach local families through ZIP-code advertising on MyEMemorial.",
    url: "/advertise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Advertise on MyEMemorial | Local ZIP Code Advertising",
    description:
      "Reach local families through ZIP-code advertising on MyEMemorial.",
  },
};

export default async function AdvertisePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedCategory = params.category || "flower_shop";
  const initialBusinessType = ALLOWED_CATEGORIES.has(requestedCategory)
    ? requestedCategory
    : "flower_shop";

  return <AdvertiseClient initialBusinessType={initialBusinessType} />;
}
