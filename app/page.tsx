"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SideAd from "./components/SideAd";
import MobileAd from "./components/MobileAd";
import ContactForm from "./components/ContactForm";

export default function HomePage() {
  const [visitorZip, setVisitorZip] = useState<string | null>(null);

useEffect(() => {
  async function loadVisitorZip() {
    try {
      const res = await fetch("/api/ip-lookup");
      const data = await res.json();

      if (data.zip) {
        setVisitorZip(data.zip);
      }
    } catch (err) {
      console.error("VISITOR ZIP ERROR:", err);
    }
  }

  loadVisitorZip();
}, []);
  return (
    <main
      className="min-h-screen bg-stone-100 bg-cover bg-center bg-fixed px-4 py-6 md:px-8"
      style={{
        backgroundImage: "linear-gradient(rgba(245,245,244,0.86), rgba(245,245,244,0.9)), url('/gravestone.jpg')",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1800px] gap-6 px-2">
        <div className="hidden w-[240px] flex-shrink-0 flex-col gap-6 lg:flex">
  <SideAd
    pageType="home"
    memorialZip={visitorZip}
    forcedCategory="attorney"
  />

  <SideAd
    pageType="home"
    memorialZip={visitorZip}
    forcedCategory="estate_planner"
  />
</div>

        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">
            <section
              className="relative overflow-hidden rounded-[1.5rem] shadow-sm"
              style={{
                backgroundImage: "url('/gravestone.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
                
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70" />

              <div className="relative z-10 px-5 py-10 text-center text-white md:px-8 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-200">
                  MyEMemorial
                </p>

                <p className="mt-3 text-sm font-medium text-stone-200 md:text-base">
                  Respectfully preserving lives and memories
                </p>

                <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
                  Lives remembered here forever.
                </h1>

                <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-snug text-stone-100 md:text-2xl">
                  Don’t let a weathered stone be all that remains.
                </p>

                <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-stone-100 md:text-base">
                  A place for lasting memorials with photos, videos, favorite song and life story for today's friends, families and future generations.
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
  <Link
  href="/create"
  className="inline-flex h-[60px] w-[260px] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-stone-900 text-center leading-tight transition hover:bg-stone-200"
>
  <span className="block">
    <span className="block">Create an E-Memorial</span>
    <span className="block">for a Loved one</span>
  </span>
</Link>

  <Link
  href="/search"
  className="inline-flex h-[60px] w-[260px] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-stone-900 text-center leading-tight transition hover:bg-stone-200"
>
  <span className="block">
    <span className="block">Search</span>
    <span className="block">Memorials</span>
  </span>
</Link>

  <Link
  href="/create?mode=preplan"
  className="inline-flex h-[60px] w-[260px] items-center justify-center rounded-full bg-amber-400 px-5 text-sm font-semibold text-stone-900 text-center leading-tight transition hover:bg-amber-300"
>
  <span className="block">
    <span className="block">Create My Personal</span>
    <span className="block">E-Memorial</span>
  </span>
</Link>

  <Link
  href="/search"
  className="inline-flex h-[60px] w-[260px] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-stone-900 text-center leading-tight transition hover:bg-stone-200"
>
  <span className="block">
    <span className="block">Contact</span>
    <span className="block">Us</span>
  </span>
</Link>
<div className="lg:hidden space-y-4">
  <MobileAd
    pageType="home"
    memorialZip={visitorZip}
    forcedCategory="attorney"
  />

  <MobileAd
    pageType="home"
    memorialZip={visitorZip}
    forcedCategory="estate_planner"
  />
</div>
</div>
  
              </div>
              
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-2xl">🕊️</div>
                <h2 className="mt-3 text-lg font-bold text-stone-900">
                  Preserve a life
                </h2>
                <p className="mt-2 text-sm leading-5 text-stone-600">
                  Create a lasting memorial with biography, obituary, cemetery details, photos, videos, and personal memories.
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-2xl">📷</div>
                <h2 className="mt-3 text-lg font-bold text-stone-900">
                  Share memories
                </h2>
                <p className="mt-2 text-sm leading-5 text-stone-600">
                  Give family and friends a respectful place to remember, contribute, and revisit meaningful moments.
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-2xl">🔎</div>
                <h2 className="mt-3 text-lg font-bold text-stone-900">
                  Find loved ones
                </h2>
                <p className="mt-2 text-sm leading-5 text-stone-600">
                  Search by name, cemetery, places lived, schools attended, awards won, and more.
                </p>
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-7">
              <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-xl font-bold text-stone-900 md:text-2xl">
                  A meaningful memorial should be more than a name and two dates
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-600 md:text-base">
                  MyEMemorial helps families preserve the stories, places, photos, and memories that make a life worth remembering.
                </p>
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-7">
              <div className="mx-auto max-w-6xl">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Memorial Plans
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
                    Choose the memorial plan that fits your family
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <PlanCard
                    title="Basic Memorial"
                    price="$99"
                    items={[
                      "Up to 50 photos",
                      "Up to 2 videos",
                      "Background music",
                      "Life story & obituary",
                      "Cemetery map",
                    ]}
                  />

                  <PlanCard
                    title="Plus Memorial"
                    price="$124.95"
                    dark
                    badge="Most Popular"
                    items={[
                      "Everything in Basic",
                      "Up to 150 photos",
                      "Up to 5 videos",
                      "Contributor approval",
                    ]}
                  />

                  <PlanCard
                    title="Premium Memorial"
                    price="$149.95"
                    items={[
                      "Everything in Plus",
                      "Unlimited photos",
                      "Up to 10 videos",
                      "Best for larger families",
                    ]}
                  />
                </div>

                <p className="mt-4 text-center text-sm text-stone-500">
                  Contributors can add photos and text for free, subject to memorial owner approval.
                </p>
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-stone-900 px-6 py-7 text-white shadow-sm md:px-8">
              <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">
                    Begin today
                  </p>
                  <h2 className="mt-2 text-xl font-bold md:text-2xl">
                    Preserve a life before more of it is lost
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-stone-300">
                    Start with a simple memorial now, then continue adding memories, photos, and family history over time.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
  href="/create"
  className="flex h-[60px] w-[260px] flex-col items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-stone-900 leading-tight transition hover:bg-stone-200 text-center"
>
  <span>Create an E-memorial</span>
  <span>for a loved one</span>
</Link>

                  <Link
                    href="/search"
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-200"
                  >
                    Search EMemorials
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className="hidden w-[240px] flex-shrink-0 flex-col gap-6 lg:flex">
  <SideAd
    pageType="home"
    memorialZip={visitorZip}
    forcedCategory="funeral_home"
  />

  <SideAd
    pageType="home"
    memorialZip={visitorZip}
    forcedCategory="monument_company"
  />
</div>
      </div>
    </main>
  );
}

function PlanCard({
  title,
  price,
  items,
  dark = false,
  badge,
}: {
  title: React.ReactNode;
  price: string;
  items: string[];
  dark?: boolean;
  badge?: string;
}) {
  return (
    <div
  className={`relative flex flex-col justify-between rounded-[1.25rem] p-5 pt-7 shadow-sm ${
        dark
          ? "border-2 border-stone-900 bg-stone-900 text-white"
          : "border border-stone-200 bg-stone-50 text-stone-900"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-900 shadow-sm">
  {badge}
</div>
      )}

      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-stone-300" : "text-stone-500"}`}>
        {title}
      </p>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-bold">{price}</span>
        <span className={`pb-1 text-xs ${dark ? "text-stone-300" : "text-stone-500"}`}>
          one-time
        </span>
      </div>

      <ul className={`mt-4 space-y-2 text-sm leading-5 ${dark ? "text-stone-100" : "text-stone-700"}`}>
        {items.map((item) => (
          <li key={item}>✔ {item}</li>
        ))}
      </ul>

      <div className="mt-5">
        <Link
          href="/create"
          className={`inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            dark
              ? "bg-white text-stone-900 hover:bg-stone-200"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          Choose Plan
        </Link>
      </div>
    </div>
  );
}