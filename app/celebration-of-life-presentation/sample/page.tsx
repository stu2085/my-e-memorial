import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sample Celebration of Life Presentation | MyEMemorial",
  description:
    "Watch a sample Celebration of Life Presentation created with MyEMemorial.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CelebrationOfLifeSamplePage() {
  return (
    <main className="min-h-screen bg-[#f9f5eb] px-4 py-10 text-[#173a31] sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-[#d9cbb0] bg-[#fffcf5] p-6 text-center shadow-xl shadow-[#38483d]/15 sm:p-10">
          <p className="text-base font-semibold uppercase tracking-[0.14em] text-[#244f40]">
            Celebration of Life Presentation
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Watch a Sample
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#344f43]">
            This is an example of a finished presentation that can be played online or saved for an event without internet access.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl bg-black shadow-lg">
            <video
              className="aspect-video w-full"
              controls
              playsInline
              preload="metadata"
              aria-label="Sample Celebration of Life Presentation"
            >
              <source
                src="/videos/celebration-of-life-presentation-sample.mp4"
                type="video/mp4"
              />
              Your browser does not support video playback.
            </video>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/celebration-of-life-presentation"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#193b30]"
            >
              Create Their Presentation
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-[#244f40] bg-white px-8 py-4 text-lg font-bold text-[#244f40] transition hover:bg-[#edf4ef]"
            >
              Return to MyEMemorial
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}