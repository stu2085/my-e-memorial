import type { Metadata } from "next";
import Link from "next/link";

const pageTitle =
  "Memorial Slideshow Maker | Photos, Videos & Music";

const pageDescription =
  "Create a memorial slideshow with photos, videos, and music. Share it online or download an MP4 to play without internet. Easy to use for $29.95.";

export const metadata: Metadata = {
  title: {
    absolute: `${pageTitle} | MyEMemorial`,
  },
  description: pageDescription,
  alternates: {
    canonical: "/memorial-slideshow-maker",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/memorial-slideshow-maker",
    siteName: "MyEMemorial",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function MemorialSlideshowMakerPage() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Memorial Slideshow Maker",
    description: pageDescription,
    url: "https://www.myememorial.com/memorial-slideshow-maker",
    provider: {
      "@type": "Organization",
      name: "MyEMemorial",
      url: "https://www.myememorial.com",
    },
    offers: {
      "@type": "Offer",
      price: "29.95",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.myememorial.com/celebration-of-life-presentation",
    },
  };

  return (
    <main className="bg-[#f9f5eb] text-[#173a31]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd),
        }}
      />

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#244f40]">
            Photos · Videos · Music
          </p>

          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Memorial Slideshow Maker for a Meaningful Tribute
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#344f43]">
            Create a memorial slideshow that brings together the photos,
            videos, captions, and music that tell their story. MyEMemorial
            gives you a guided way to build a Celebration of Life slideshow
            without complicated video-editing software.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/celebration-of-life-presentation"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#193b30]"
            >
              Create a Memorial Slideshow
            </Link>

            <Link
              href="/celebration-of-life-presentation/sample"
              className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-[#244f40] bg-white px-8 py-4 text-lg font-bold text-[#244f40] transition hover:bg-[#edf4ef]"
            >
              View a Sample
            </Link>
          </div>

          <p className="mt-5 text-lg font-semibold">
            $29.95 one-time purchase
          </p>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 sm:pb-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            [
              "Add Photos",
              "Choose meaningful photos, select a featured portrait, add captions, and arrange the memories in the order you want.",
            ],
            [
              "Include Videos",
              "Add recorded memories and video clips. Background music pauses while each video plays, then continues with the presentation.",
            ],
            [
              "Play Meaningful Music",
              "Add favorite songs and meaningful music that plays along with the photos in your memorial slideshow.",
            ],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-3xl border border-[#e3d9c5] bg-[#fffcf5] p-7 shadow-sm"
            >
              <h2 className="font-serif text-2xl font-bold">{title}</h2>
              <p className="mt-3 text-base leading-7 text-[#344f43]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#fffaf0] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-3xl font-bold sm:text-4xl">
            An Easy Funeral Slideshow Maker
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-8 text-[#344f43]">
            You should not need video-editing experience to create something
            meaningful for a funeral, memorial service, or Celebration of
            Life. MyEMemorial guides you through the process so you can focus
            on the memories instead of learning complicated software.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              [
                "1. Add their memories",
                "Upload photos and videos, add captions, and choose meaningful music.",
              ],
              [
                "2. Arrange the slideshow",
                "Put the memories in the order you want and preview the presentation.",
              ],
              [
                "3. Share or download",
                "Share the online presentation or download the finished MP4 for the service.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-3xl border border-[#e3d9c5] bg-white p-6"
              >
                <h3 className="font-serif text-2xl font-bold">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[#344f43]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-3xl font-bold sm:text-4xl">
            Memorial Slideshow With Music, Photos, and Video
          </h2>

          <p className="mt-6 text-lg leading-8 text-[#344f43]">
            A memorial slideshow can be more than a sequence of photographs.
            MyEMemorial lets you combine photos, video memories, written
            captions, and meaningful music into one presentation that can be
            shared with family and friends.
          </p>

          <p className="mt-5 text-lg leading-8 text-[#344f43]">
            The finished presentation can be viewed online for 60 days. You
            can also download an MP4 Offline Copy to the laptop or device you
            will use at the event, allowing you to play the presentation even
            if Wi-Fi or internet service is unavailable.
          </p>
        </div>
      </section>

      <section className="bg-[#fffaf0] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-3xl font-bold sm:text-4xl">
            Memorial Slideshow, Funeral Slideshow, or Celebration of Life
            Presentation?
          </h2>

          <p className="mt-6 text-lg leading-8 text-[#344f43]">
            These names are often used for the same basic idea: a visual
            tribute shown during a funeral, memorial service, Celebration of
            Life, or family gathering. Whatever you call it, the goal is to
            bring meaningful memories together in a way that honors the
            person&apos;s life.
          </p>

          <p className="mt-5 text-lg leading-8 text-[#344f43]">
            MyEMemorial calls the finished product a Celebration of Life
            Presentation, but it can also be used as a memorial slideshow or
            funeral slideshow.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#d9cbb0] bg-[#fffcf5] px-6 py-10 text-center shadow-sm sm:px-12">
          <h2 className="font-serif text-3xl font-bold">
            Create Your Memorial Slideshow
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#344f43]">
            Build and preview the presentation before purchasing. The
            one-time price is $29.95 and includes 60 days of online access
            plus an MP4 Offline Copy.
          </p>

          <Link
            href="/celebration-of-life-presentation"
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#193b30]"
          >
            Start Your Presentation
          </Link>

          <div className="mt-6">
            <Link
              href="/how-to-make-a-celebration-of-life-presentation"
              className="text-base font-bold text-[#244f40] underline underline-offset-4"
            >
              Read our guide: How to Make a Celebration of Life Presentation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}