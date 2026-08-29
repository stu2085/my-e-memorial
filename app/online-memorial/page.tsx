import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Online Memorials | MyEMemorial",
  },
  description:
    "Create a Departed MyEMemorial to preserve the life story, photos, videos, family history, obituary, final resting place, and meaningful memories of someone who has died.",
  alternates: {
    canonical: "/memorials",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function OnlineMemorialPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-blue-900">
            MyEMemorial
          </p>

          <h1 className="mt-4 text-3xl font-bold text-stone-900 md:text-5xl">
            Create a Lasting Memorial for Someone Who Has Passed Away
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
            Preserve their life story, photos, videos, favorite songs, family
            history, obituary, final resting place, and meaningful memories in
            one lasting memorial.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#pricing"
              className="inline-flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-blue-950 px-6 py-3 text-base font-bold text-white transition hover:bg-blue-900"
            >
              View Plans & Pricing
            </Link>

            <Link
              href="/gift"
              className="inline-flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-base font-bold text-white transition hover:bg-stone-700"
            >
              Gift a Departed MyEMemorial
            </Link>
          </div>
        </section>

        <section
          id="pricing"
          className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="text-center">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
              MyEMemorial Plans
            </p>

            <h2 className="mt-2 text-3xl font-bold text-stone-900">
              Start Free or Choose the Plan That Fits Their Story
            </h2>

            <p className="mx-auto mt-3 max-w-3xl text-lg leading-7 text-stone-600">
              Choose the amount of space you need for photos, video memories,
              music, family history, and the memories that tell their story.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <PlanCard
              title="Free Departed MyEMemorial"
              price="$0"
              href="/create?plan=free"
              badge="Start Free"
              items={[
                "Featured photo",
                "Up to 5 gallery photos",
                "Life story",
                "Basic personal information",
                "Contributor approval",
                "Public & shareable MyEMemorial",
                "Upgrade anytime",
              ]}
            />

            <PlanCard
              title="Basic Departed MyEMemorial"
              price="$49.95"
              href="/create?plan=basic"
              items={[
                "Up to 50 photos",
                "Up to 15 minutes of Video Memories",
                "Favorite music",
                "Life story",
                "Family history",
                "Places lived & worked",
                "Schools & awards",
                "Social media links",
                "Contributor approval",
              ]}
            />

            <PlanCard
              title="Plus Departed MyEMemorial"
              price="$69.95"
              href="/create?plan=plus"
              dark
              badge="Most Popular"
              items={[
                "Up to 150 photos",
                "Up to 30 minutes of Video Memories",
                "Favorite music",
                "Life story",
                "Family history",
                "Places lived & worked",
                "Schools & awards",
                "Social media links",
                "Contributor approval",
              ]}
            />

            <PlanCard
              title="Premium Departed MyEMemorial"
              price="$89.95"
              href="/create?plan=premium"
              items={[
                "Unlimited photos",
                "Up to 60 minutes of Video Memories",
                "Favorite music",
                "Life story",
                "Family history",
                "Places lived & worked",
                "Schools & awards",
                "Social media links",
                "Contributor approval",
              ]}
            />
          </div>

          <p className="mt-5 text-center text-base leading-7 text-stone-500">
            Paid plans are one-time payments with no recurring subscription fee.
          </p>
        </section>
      </div>
    </main>
  );
}

function PlanCard({
  title,
  price,
  items,
  href,
  dark = false,
  badge,
}: {
  title: React.ReactNode;
  price: string;
  items: string[];
  href: string;
  dark?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col justify-between rounded-[1.25rem] p-6 pt-7 shadow-sm ${
        dark
          ? "border-2 border-blue-950 bg-blue-950 text-white"
          : "border border-stone-200 bg-stone-50 text-stone-900"
      }`}
    >
      <div>
        {badge && (
          <div className="mb-4 flex justify-center">
            {badge === "Most Popular" ? (
              <div className="rounded-full bg-amber-400 px-6 py-2 text-base font-bold uppercase tracking-[0.15em] text-stone-900 shadow text-center">
                {badge}
              </div>
            ) : (
              <div
                className={`text-base font-bold uppercase tracking-[0.15em] ${
                  dark ? "text-stone-300" : "text-stone-500"
                }`}
              >
                {badge}
              </div>
            )}
          </div>
        )}

        <p
          className={`text-base font-semibold uppercase tracking-[0.16em] ${
            dark ? "text-stone-300" : "text-stone-500"
          }`}
        >
          {title}
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-center gap-2 text-center">
          <span className="text-3xl font-bold">{price}</span>
          <span
            className={`pb-1 text-base ${
              dark ? "text-stone-300" : "text-stone-500"
            }`}
          >
            one-time
          </span>
        </div>

        <ul
          className={`mt-4 space-y-2 text-lg leading-7 ${
            dark ? "text-stone-100" : "text-stone-700"
          }`}
        >
          {items.map((item) => (
            <li key={item}>✔ {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <Link
          href={href}
          className={`inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold transition ${
            dark
              ? "bg-white text-stone-900 hover:bg-stone-200"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          {badge === "Start Free" ? "Start Free" : "Choose Plan"}
        </Link>
      </div>
    </div>
  );
}
