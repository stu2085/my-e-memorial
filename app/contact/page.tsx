import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Contact MyEMemorial | Get in Touch",
  },
  description:
    "Contact MyEMemorial with questions about Living MyEMemorials, online memorials, gifts, plans, account help, or other support.",
  alternates: {
    canonical: "/contact",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Contact MyEMemorial | Get in Touch",
    description:
      "Contact MyEMemorial with questions about Living MyEMemorials, online memorials, gifts, plans, account help, or other support.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact MyEMemorial | Get in Touch",
    description:
      "Contact MyEMemorial with questions about Living MyEMemorials, online memorials, gifts, plans, account help, or other support.",
  },
};

import { Suspense } from "react";
import ContactForm from "../components/ContactForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-stone-900">
          Contact Us
        </h1>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </main>
  );
}