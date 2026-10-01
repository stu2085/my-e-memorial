import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Free Online Memorial | Create a Free MyEMemorial",
  },
  description:
    "Create a free online memorial with MyEMemorial. Preserve a featured photo, life story, gallery photos, obituary and service information, final resting place, and shared memories.",
  alternates: {
    canonical: "/free-online-memorial",
  },
  openGraph: {
    title: "Free Online Memorial | Create a Free MyEMemorial",
    description:
      "Create a free Departed MyEMemorial for someone who has passed. Preserve their story, photos, obituary and service information, final resting place, and memories.",
    url: "/free-online-memorial",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Memorial | Create a Free MyEMemorial",
    description:
      "Create a free Departed MyEMemorial for someone who has passed and preserve their life story and memories online.",
  },
};

const freeFeatures = [
  "Featured photo",
  "Up to 5 gallery photos",
  "Life story",
  "Basic personal information",
  "Obituary & Service Information",
  "Final Resting Place",
  "Shared Memories Approval",
  "Public & shareable MyEMemorial",
  "Upgrade anytime",
];

export default function FreeOnlineMemorialPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <section className="text-center">
          <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
            Free Departed MyEMemorial
          </p>

          <h1 className="mx-auto mt-3 max-w-4xl text-3xl font-bold leading-tight text-stone-900 md:text-5xl">
            Create a Free Online Memorial for Someone You Love
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-600">
            A Free Departed MyEMemorial gives you a lasting place to preserve
            the story and important memories of someone who has passed. There
            is no cost to get started.
          </p>

          <Link
            href="/create?mode=memorial&plan=free"
            className="mt-7 inline-flex min-h-[56px] items-center justify-center rounded-full bg-blue-950 px-8 text-base font-bold text-white transition hover:bg-blue-900"
          >
            Create a Free MyEMemorial
          </Link>
        </section>

        <section className="mt-12 rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <div className="text-center">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
              Free Plan
            </p>

            <h2 className="mt-2 text-3xl font-bold text-stone-900">
              What Is Included
            </h2>

            <p className="mx-auto mt-3 max-w-3xl text-lg leading-8 text-stone-600">
              Start preserving their story with the essential features of a
              Departed MyEMemorial.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl rounded-[1.5rem] border border-stone-200 bg-amber-50 p-6 shadow-sm md:p-8">
            <div className="text-center">
              <h3 className="text-xl font-bold uppercase tracking-[0.12em] text-stone-900">
                Free Departed MyEMemorial
              </h3>

              <div className="mt-3">
                <span className="text-4xl font-bold text-stone-900">$0</span>
                <span className="ml-2 text-base text-stone-500">one-time</span>
              </div>
            </div>

            <ul className="mt-7 grid gap-3 text-base leading-7 text-stone-800 sm:grid-cols-2">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden="true">{"\u2713"}</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/create?mode=memorial&plan=free"
              className="mx-auto mt-8 flex min-h-[56px] w-full max-w-[340px] items-center justify-center rounded-full bg-stone-900 px-6 text-center text-base font-bold text-white transition hover:bg-stone-700"
            >
              Start Your Free Memorial
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-900">
              More Than an Online Obituary
            </h2>

            <p className="mt-4 text-base leading-7 text-stone-600">
              An obituary records important facts about a life. A MyEMemorial
              gives family and friends a place to preserve the person&apos;s
              story, photographs, memories, service information, and final
              resting place together.
            </p>

            <Link
              href="/memorials"
              className="mt-5 inline-flex font-bold text-blue-900 hover:underline"
            >
              Learn About Departed MyEMemorials
            </Link>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-900">
              Upgrade Only If You Want More
            </h2>

            <p className="mt-4 text-base leading-7 text-stone-600">
              You can begin with the Free Plan and upgrade later without
              starting over. Basic, Plus, and Premium provide additional photo,
              video, music, family-history, and presentation features.
            </p>

            <Link
              href="/plans-pricing"
              className="mt-5 inline-flex font-bold text-blue-900 hover:underline"
            >
              View All Plans & Pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}