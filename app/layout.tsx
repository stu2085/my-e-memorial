import NavBar from "./components/NavBar";import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata = {
  title: "MyEMemorial",
  description:
    "Online memorials that preserve lives and memories forever.",
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
  <NavBar />
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
    </div>

    <p className="mt-3 leading-6">
  © {new Date().getFullYear()} MyEMemorial. All rights reserved.
  Unauthorized reproduction, copying, or use of this website,
  its branding, or memorial platform is prohibited.
</p>
  </footer>
</body> 
    </html>
  );
}
