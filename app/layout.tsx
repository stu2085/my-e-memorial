import { Suspense } from "react";
import NavBar from "./components/NavBar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MyEMemorial | Online Memorials for Loved Ones",
    template: "%s | MyEMemorial",
  },
  description:
    
  "Create permanent online memorials with photos, videos, music playlists, life stories, obituaries, family history, schools attended, awards received, cemetery maps, and visitor contributions. Families control all submissions through an approval system. One-time payment with no recurring subscription fees.",
    keywords: [
    "online memorials",
    "memorial website",
    "digital memorial",
    "funeral memorial",
    "cemetery memorial",
    "tribute page",
    "life story memorial",
    "obituary memorial",
    "family memorials",
  ],
  metadataBase: new URL("https://www.myememorial.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyEMemorial | Online Memorials for Loved Ones",
    description:
      "Create lasting online memorials with photos, videos, life stories, family history, obituary details, cemetery maps, and contributor approval.",
    url: "https://www.myememorial.com",
    siteName: "MyEMemorial",
    type: "website",
  },verification: {
  google: "8gP9qEPq6SKkkPqnvWnT10HJFGiqva87-j5_VEdBomI",
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
     <body className="min-h-full flex flex-col">
  <Suspense fallback={null}>
  <NavBar />
</Suspense>
  <div className="flex-1">
    {children}
  </div>

  <footer className="border-t border-stone-200 bg-white px-4 py-6 text-center text-sm text-stone-500">
    <div className="flex flex-wrap justify-center gap-4">
      <a href="/privacy" className="hover:text-stone-800">Privacy Policy</a>
      <a href="/terms" className="hover:text-stone-800">Terms of Service</a>
      <a href="/content-removal" className="hover:text-stone-800">Content Removal</a>
      <a href="/dmca" className="hover:text-stone-800">DMCA</a>
      <a href="/refund-policy" className="hover:text-stone-800">Refund Policy</a>
      <a href="/contact" className="hover:text-stone-800">Contact Us</a>
      <a
  href="/login?mode=login&redirect=%2Fadmin%2Fbeta-codes"
  className="hover:text-stone-800"
>
  Admin
</a>
    </div>

    <p className="mt-3 leading-6">
  © {new Date().getFullYear()} MyEMemorial. All rights reserved.
  Unauthorized reproduction, copying, or use of this website,
  its branding, or memorial platform is prohibited.
</p>
  </footer>
      <GoogleAnalytics gaId="G-SLX50BGDQK" />
</body> 
    </html>
  );
}
