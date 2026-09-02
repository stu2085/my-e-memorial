import { Suspense } from "react";
import Link from "next/link";
import NavBar from "./components/NavBar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import FacebookPixel from "./components/FacebookPixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.myememorial.com"),

  title: {
    default: "MyEMemorial | Online Memorials & Personal Life Stories",
    template: "%s | MyEMemorial",
  },

  description:
    "Create a Personal MyEMemorial or online memorial to preserve life stories, photos, videos, family history, obituaries, and memories for generations.",

  keywords: [
    "online memorial",
    "memorial website",
    "digital memorial",
    "Personal MyEMemorial",
    "living memorial",
    "life story website",
    "online obituary",
    "celebration of life presentation",
    "memorial slideshow",
    "funeral memorial",
    "cemetery memorial",
    "family history memorial",
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "MyEMemorial | Online Memorials & Personal Life Stories",
    description:
      "Preserve your own life story with a Personal MyEMemorial or create a lasting online memorial for someone who has passed.",
    url: "https://www.myememorial.com",
    siteName: "MyEMemorial",
    type: "website",
    images: [
      {
        url: "https://www.myememorial.com/myememorial-logo.png",
        width: 1200,
        height: 630,
        alt: "MyEMemorial",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MyEMemorial | Online Memorials & Personal Life Stories",
    description:
      "Preserve your own life story with a Personal MyEMemorial or create a lasting online memorial for someone who has passed.",
    images: ["https://www.myememorial.com/myememorial-logo.png"],
  },

  verification: {
    google: "8gP9qEPq6SKkkPqnvWnT10HJFGiqva87-j5_VEdBomI",
    other: {
      "facebook-domain-verification": "7qh13p8bn7wdcoai15ii33cqzotybm",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue-900 focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Skip to main content
        </a>

        <FacebookPixel />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MyEMemorial",
              url: "https://www.myememorial.com",
              logo: "https://www.myememorial.com/myememorial-logo.png",
              description:
                "MyEMemorial helps people preserve life stories, photos, videos, family history, and memories through Personal MyEMemorials and online memorials.",
              sameAs: [
                "https://www.facebook.com/MyEmemorial",
                "https://www.instagram.com/myememorial/",
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MyEMemorial",
              alternateName: ["My E Memorial", "MyEMemorial.com"],
              url: "https://www.myememorial.com/",
              description:
                "Create Personal MyEMemorials and online memorials that preserve life stories and memories for future generations.",
            }),
          }}
        />

        <Suspense fallback={null}>
          <NavBar />
        </Suspense>

        <div id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </div>

        <footer className="border-t border-stone-200 bg-white px-4 py-6 text-center text-base text-stone-500 sm:px-10">
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-3">
            <Link
              href="/privacy"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Terms of Service
            </Link>
            <Link
              href="/content-removal"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Content Removal
            </Link>
            <Link
              href="/dmca"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Copyright &amp; DMCA
            </Link>
            <Link
              href="/refund-policy"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Refund Policy
            </Link>
            <Link
              href="/our-story"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              className="whitespace-nowrap hover:text-stone-800"
            >
              Contact Us
            </Link>
            <Link
              href="/login?mode=login&redirect=%2Fadmin%2Fbeta-codes"
              className="whitespace-nowrap hover:text-stone-800"
              rel="nofollow"
            >
              Admin
            </Link>
          </div>

          <p className="mx-auto mt-3 max-w-4xl break-words leading-6">
            © {new Date().getFullYear()} MyEMemorial. All rights reserved.
            Unauthorized reproduction, copying, or use of this website, its
            branding, or memorial platform is prohibited.
          </p>
        </footer>

        <GoogleAnalytics gaId="G-SLX50BGDQK" />
      </body>
    </html>
  );
}
