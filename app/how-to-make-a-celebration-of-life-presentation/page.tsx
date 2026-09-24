import Link from "next/link";
import type { Metadata } from "next";

const guideTitle =
  "How to Make a Celebration of Life Presentation | MyEMemorial";

const guideDescription =
  "Make a Celebration of Life Presentation without video-editing software or technical ability. Add photos, videos, and music, then share or download it.";

export const metadata: Metadata = {
  title: { absolute: guideTitle },
  description: guideDescription,
  alternates: {
    canonical: "/how-to-make-a-celebration-of-life-presentation",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: guideTitle,
    description: guideDescription,
    url: "/how-to-make-a-celebration-of-life-presentation",
    siteName: "MyEMemorial",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: guideTitle,
    description: guideDescription,
  },
};

export default function HowToMakeCelebrationPresentationPage() {
  return (
    <main className="bg-[#f9f5eb] text-[#173a31]">
      <section
        className="px-4 py-14 sm:py-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(250,247,238,0.4),rgba(250,247,238,0.62)), url('/Images/celebration-builder-background.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#d9cbb0] bg-[#fffcf5]/95 px-6 py-10 text-center shadow-xl shadow-[#38483d]/15 backdrop-blur-sm sm:px-12 sm:py-14">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#244f40]">
            Celebration of Life Presentation
          </p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            How to Make a Celebration of Life Presentation
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#344f43]">
            MyEMemorial makes it simple to bring together the photos, videos,
            and music that honor their life.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#344f43]">
            No video-editing software or technical ability is needed. You
            provide the memories; MyEMemorial gives you a straightforward way
            to create, share, and download the finished presentation.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#344f43]">
            If you are searching for a memorial slideshow or funeral slideshow,{" "}
            <Link
              href="/memorial-slideshow-maker"
              className="font-bold text-[#244f40] underline underline-offset-4"
            >
              see our Memorial Slideshow Maker
            </Link>
            .
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/celebration-of-life-slideshow/create"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#193b30]"
            >
              Create a Presentation for $29.95
            </Link>
            <Link
              href="/celebration-of-life-presentation/sample"
              className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-[#244f40] bg-white px-8 py-4 text-lg font-bold text-[#244f40] transition hover:bg-[#edf4ef]"
            >
              Watch a Sample
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#244f40]">
            A simple process
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
            Three straightforward steps
          </h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            [
              "1. Begin with their name",
              "Start with their name and your email, then complete the one-time purchase to begin creating.",
            ],
            [
              "2. Add their memories",
              "Add photos, videos, captions, and meaningful music in one guided presentation space.",
            ],
            [
              "3. Preview and share",
              "Preview the finished presentation, share its viewing link, or download it for the event.",
            ],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-3xl border border-[#e3d9c5] bg-[#fffcf5] p-7 shadow-sm"
            >
              <h3 className="font-serif text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-base leading-7 text-[#344f43]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 sm:pb-16">
        <div className="rounded-3xl border border-[#e3d9c5] bg-[#fffcf5] px-6 py-8 text-center shadow-sm sm:px-10">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#244f40]">
            Ready for the event
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold">
            Share online or play it without internet
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#344f43]">
            Your purchase includes 60 days of online sharing, an MP4 Offline
            Copy, and guided Offline Backup steps for events without Wi-Fi or
            internet access.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#344f43]">
            A Celebration of Life Presentation is $29.95, and your purchase
            includes a single-use $29.95 credit toward a new Basic, Plus, or
            Premium MyEMemorial.
          </p>
          <Link
            href="/celebration-of-life-presentation"
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#193b30]"
          >
            Learn About the Presentation
          </Link>
        </div>
      </section>

      {/* RELATED MEMORIAL SLIDESHOW COMPARISON */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:pb-16">
        <div className="rounded-3xl border border-stone-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10">
          <h2 className="text-2xl font-bold text-stone-900">
            Still Choosing a Memorial Slideshow Maker?
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-stone-700">
            Compare major memorial slideshow, tribute, and online memorial options before deciding which approach fits your family and event.
          </p>
          <Link
            href="/best-memorial-slideshow-makers"
            className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
          >
            Best Memorial Slideshow Makers in 2026
          </Link>
        </div>
      </section>
</main>
  );
}