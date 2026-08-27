import type { Metadata } from "next";
import CemeteryClient from "./CemeteryClient";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function cemeteryNameFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cemeteryName = cemeteryNameFromSlug(slug) || "Cemetery";

  return {
    title: {
      absolute: `${cemeteryName} Memorials | MyEMemorial`,
    },
    description:
      `View published MyEMemorial memorials associated with ${cemeteryName}.`,
    alternates: {
      canonical: `/cemetery/${slug}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function CemeteryPage() {
  return <CemeteryClient />;
}
