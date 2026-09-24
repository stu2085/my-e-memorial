import Link from "next/link";
import type { Metadata } from "next";


const productTitle =
  "Celebration of Life Presentation | MyEMemorial";

const productDescription =
  "Create a Celebration of Life Presentation with photos, videos, and music. Only $29.95 with an MP4 Offline Copy and 60 days of online sharing.";

export const metadata: Metadata = {
  title: {
    absolute: productTitle,
  },
  description: productDescription,
  alternates: {
    canonical: "/celebration-of-life-presentation",
  },
  openGraph: {
    title: productTitle,
    description: productDescription,
    url: "/celebration-of-life-presentation",
    siteName: "MyEMemorial",
    type: "website",
    images: [
      {
        url: "/Images/celebration-builder-background.png",
        alt: "Celebration of Life Presentation by MyEMemorial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: productTitle,
    description: productDescription,
    images: ["/Images/celebration-builder-background.png"],
  },
};

const startHref = "/celebration-of-life-slideshow/create";

export default function CelebrationOfLifeProductPage() {
  return (
    <main className="bg-[#f9f5eb] text-[#173a31]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "@id": "https://www.myememorial.com/celebration-of-life-presentation#product",
            name: "Celebration of Life Presentation",
            description:
              "A one-time purchase presentation service for creating, sharing, and downloading a Celebration of Life Presentation with photos, videos, and music.",
            url: "https://www.myememorial.com/celebration-of-life-presentation",
            image: "https://www.myememorial.com/Images/celebration-builder-background.png",
            brand: {
              "@type": "Organization",
              "@id": "https://www.myememorial.com/#organization",
              name: "MyEMemorial",
            },
            offers: {
              "@type": "Offer",
              price: "29.95",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: "https://www.myememorial.com/celebration-of-life-presentation",
            image: "https://www.myememorial.com/Images/celebration-builder-background.png",
            },
          }),
        }}
      />
      <section
        className="px-4 py-14 sm:py-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(250,247,238,0.36), rgba(250,247,238,0.56)), url('/Images/celebration-builder-background.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#d9cbb0] bg-[#fffcf5]/95 px-6 py-10 text-center shadow-xl shadow-[#38483d]/15 backdrop-blur-sm sm:px-12 sm:py-14">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#244f40]">
            A presentation to honor their life
          </p>
          <div className="mx-auto mt-5 flex max-w-40 items-center gap-3 text-[#b99a68]" aria-hidden="true">
            <span className="h-px flex-1 bg-current" />
            <span>♥</span>
            <span className="h-px flex-1 bg-current" />
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Celebration of Life Presentation
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#344f43]">
            Bring together the photos, videos, and music that tell their story for a service, family gathering, or quiet moment of remembrance.
          </p>
          <p className="mt-6 font-serif text-4xl font-bold text-[#173a31]">
            Only $29.95
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={startHref}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#193b30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244f40]"
            >
              Start Creating
            </Link>
            <Link
              href="/celebration-of-life-presentation/sample"
              className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-[#244f40] bg-white px-8 py-4 text-lg font-bold text-[#244f40] transition hover:bg-[#edf4ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244f40]"
            >
              View a Sample
            </Link>
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#344f43]">
            Includes 60 days of online access, an MP4 Offline Copy, and guided Offline Backup steps for events without internet. Your purchase also includes a single-use $29.95 credit toward a new Basic, Plus, or Premium MyEMemorial.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#344f43]">
            Looking specifically for a slideshow for a funeral or memorial service?{" "}
            <Link
              href="/memorial-slideshow-maker"
              className="font-bold text-[#244f40] underline underline-offset-4"
            >
              Learn about our Memorial Slideshow Maker
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3 sm:py-16" aria-label="What you can include">
        {[
          ["Photos", "Choose a featured portrait, add captions, and arrange moments in the order you want."],
          ["Videos", "Play their recorded memories with the presentation, while background music pauses for each video."],
          ["Music", "Add meaningful songs that play in sequence alongside the photos."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-3xl border border-[#e3d9c5] bg-[#fffcf5] p-7 shadow-sm">
            <h2 className="font-serif text-2xl font-bold">{title}</h2>
            <p className="mt-3 text-base leading-7 text-[#344f43]">{description}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:pb-16">
        <div className="rounded-3xl border border-[#e3d9c5] bg-[#fffcf5] px-6 py-8 text-center shadow-sm sm:px-10">
          <h2 className="font-serif text-3xl font-bold">Two ways to share and play your presentation</h2>
          <div className="mt-7 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f9f5eb] p-6">
              <h3 className="font-serif text-2xl font-bold">Share a viewing link</h3>
              <p className="mt-3 text-base leading-7 text-[#344f43]">
                After purchase, we email you a link to share with family or the event venue. Your presentation can be viewed online for 60 days. We also send a separate private link so you can continue editing.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f9f5eb] p-6">
              <h3 className="font-serif text-2xl font-bold">Download for offline playback</h3>
              <p className="mt-3 text-base leading-7 text-[#344f43]">
                Download your finished presentation as an MP4 video and save it to the device you will use at the event. Play it without Wi-Fi or an internet connection. Test the file on that device before the gathering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED MEMORIAL SLIDESHOW COMPARISON */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:pb-16">
        <div className="rounded-3xl border border-stone-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10">
          <h2 className="text-2xl font-bold text-stone-900">
            Compare MyEMemorial With Other Memorial Options
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-stone-700">
            See a side-by-side comparison of major memorial and slideshow services, including presentation features, online memorials, offline playback, and current pricing.
          </p>
          <Link
            href="/best-memorial-slideshow-makers"
            className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
          >
            View the 2026 Memorial Slideshow Comparison
          </Link>
        </div>
      </section>
</main>
  );
}
