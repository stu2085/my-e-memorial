import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    absolute: "Gift a MyEMemorial | Preserve a Life Story",
  },
  description:
    "Gift a Living or Departed MyEMemorial and give someone a meaningful way to preserve life stories, photos, videos, memories, and family history.",
  alternates: {
    canonical: "/gift",
  },
  openGraph: {
    title: "Gift a MyEMemorial | Preserve a Life Story",
    description:
      "Gift a Living or Departed MyEMemorial and help preserve a meaningful life story for future generations.",
    url: "/gift",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gift a MyEMemorial | Preserve a Life Story",
    description:
      "Gift a Living or Departed MyEMemorial and help preserve a meaningful life story for future generations.",
  },
};

export default function GiftLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}