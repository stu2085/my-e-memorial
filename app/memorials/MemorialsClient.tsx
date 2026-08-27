"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SideAd from "../components/SideAd";

export default function MemorialsPage() {
  const [resourceZip, setResourceZip] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [zipError, setZipError] = useState("");
  const adGroupRef = useRef<HTMLDivElement | null>(null);
  const [adStickyTop, setAdStickyTop] = useState(160);

  useEffect(() => {
    async function loadVisitorZip() {
      try {
        const response = await fetch("/api/ip-lookup");
        const data = await response.json();

        if (data.zip) {
          const detectedZip = String(data.zip).slice(0, 5);
          setResourceZip(detectedZip);
          setZipInput(detectedZip);
        }
      } catch (error) {
        console.error("VISITOR ZIP ERROR:", error);
      }
    }

    void loadVisitorZip();
  }, []);

  useEffect(() => {
    const adGroup = adGroupRef.current;

    if (!adGroup) {
      return;
    }

    const updateStickyTop = () => {
      const navClearance = 160;
      const bottomGap = 16;
      const groupHeight = adGroup.getBoundingClientRect().height;
      const viewportAwareTop = window.innerHeight - groupHeight - bottomGap;

      setAdStickyTop(Math.min(navClearance, viewportAwareTop));
    };

    updateStickyTop();

    const resizeObserver = new ResizeObserver(updateStickyTop);
    resizeObserver.observe(adGroup);
    window.addEventListener("resize", updateStickyTop);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [resourceZip]);

  function handleUpdateResourceZip() {
    const cleanedZip = zipInput.replace(/\D/g, "").slice(0, 5);

    if (cleanedZip.length !== 5) {
      setZipError("Enter a valid 5-digit ZIP code.");
      return;
    }

    setZipInput(cleanedZip);
    setResourceZip(cleanedZip);
    setZipError("");
  }

  function openLocalResourceSearch(searchTerm: string) {
    const zip = resourceZip || zipInput.replace(/\D/g, "").slice(0, 5);
    const query = zip ? `${searchTerm} near ${zip}` : searchTerm;

    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec]">
      {/* HERO */}
      <section className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <div className="relative aspect-[943/257] w-full bg-stone-100">
              <Image
                src="/images/memorials-hero-final.png"
                alt="Share Their Story Here — a MyEMemorial shown on a laptop with family photographs and digital devices."
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3 border-t border-stone-200 bg-white px-6 py-6 sm:flex-row sm:flex-wrap md:py-7">
              <Link
                href="#pricing"
                className="inline-flex min-h-[68px] w-full max-w-[350px] items-center justify-center rounded-full bg-blue-950 px-8 text-center text-lg font-bold text-white shadow-sm transition hover:bg-blue-900"
              >
                Choose a Deceased MyEMemorial Plan
              </Link>

              <Link
                href="/gift?type=memorial"
                className="inline-flex min-h-[68px] w-full max-w-[350px] items-center justify-center rounded-full bg-amber-400 px-8 text-center text-lg font-bold text-stone-900 shadow-sm transition hover:bg-amber-300"
              >
                🎁 Give a Deceased MyEMemorial
              </Link>

              <Link
                href="/memorial/daniel-james-whitmore"
                className="inline-flex min-h-[68px] w-full max-w-[350px] items-center justify-center rounded-full border-2 border-stone-300 bg-white px-8 text-center text-lg font-bold text-stone-900 shadow-sm transition hover:bg-stone-100"
              >
                Experience a Sample Deceased MyEMemorial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT + LOCAL ADS */}
      <section className="px-4 pb-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-base font-bold uppercase tracking-[0.16em] text-stone-500">
                    Local Memorial Resources
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-stone-900">
                    Helpful Services
                  </h2>

                  <p className="mt-2 text-base leading-7 text-stone-600">
                    Find local services to help honor someone you love.
                  </p>

                  <label
                    htmlFor="memorial-resource-zip"
                    className="mt-4 block text-base font-bold text-stone-900"
                  >
                    ZIP Code
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      id="memorial-resource-zip"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={zipInput}
                      onChange={(event) => {
                        setZipInput(
                          event.target.value.replace(/\D/g, "").slice(0, 5)
                        );
                        setZipError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleUpdateResourceZip();
                        }
                      }}
                      placeholder="Enter ZIP"
                      className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-amber-500"
                      aria-describedby={
                        zipError ? "memorial-resource-zip-error" : undefined
                      }
                    />

                    <button
                      type="button"
                      onClick={handleUpdateResourceZip}
                      className="rounded-xl bg-blue-950 px-3 py-2 text-base font-bold text-white transition hover:bg-blue-900"
                    >
                      Update
                    </button>
                  </div>

                  {zipError && (
                    <p
                      id="memorial-resource-zip-error"
                      className="mt-2 text-base font-semibold text-red-700"
                    >
                      {zipError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openLocalResourceSearch("funeral homes")}
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">🏠</span>
                  <span className="mt-2 block text-base font-bold text-stone-900">
                    Funeral Homes
                  </span>
                  <span className="mt-1 block text-base text-stone-600">
                    Find local funeral homes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openLocalResourceSearch("cemeteries")}
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">🕊️</span>
                  <span className="mt-2 block text-base font-bold text-stone-900">
                    Cemeteries
                  </span>
                  <span className="mt-1 block text-base text-stone-600">
                    Find local cemeteries
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openLocalResourceSearch("monument companies")}
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">🪦</span>
                  <span className="mt-2 block text-base font-bold text-stone-900">
                    Monument Companies
                  </span>
                  <span className="mt-1 block text-base text-stone-600">
                    Find local monument companies
                  </span>
                </button>
              </div>

              <div
                ref={adGroupRef}
                className="sticky mt-6 space-y-4"
                style={{ top: `${adStickyTop}px` }}
              >
                <SideAd
                  pageType="home"
                  memorialZip={resourceZip || null}
                  forcedCategory="funeral_home"
                  sticky={false}
                />

                <SideAd
                  pageType="home"
                  memorialZip={resourceZip || null}
                  forcedCategory="monument_company"
                  sticky={false}
                />
              </div>
            </aside>

            <div className="space-y-8">
              {/* DECEASED MYEMEMORIAL INTRODUCTION VIDEO PLACEHOLDER */}
              <section className="overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-sm">
                <div className="grid items-stretch lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="flex flex-col justify-center p-7 md:p-9">
                    <p className="text-base font-bold uppercase tracking-[0.2em] text-amber-300">
                      See What a Deceased MyEMemorial Can Become
                    </p>

                    <h2 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">
                      Preserve Their Story. Keep Their Memory Close.
                    </h2>

                    <p className="mt-4 text-base leading-7 text-stone-200 md:text-lg">
                      In just a few moments, see how a Deceased MyEMemorial helps
                      preserve the stories, memories, photos, videos, music, and
                      experiences that made their life uniquely theirs.
                    </p>

                    <ul className="mt-5 list-disc space-y-2 pl-6 text-base font-semibold text-stone-200">
                      <li>Tell their story</li>
                      <li>Add photos &amp; videos</li>
                      <li>Invite family and friends to share memories</li>
                    </ul>
                  </div>

                  <div className="relative min-h-[300px] bg-black lg:min-h-[390px]">
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      playsInline
                      poster="/images/memorials-hero-final.png"
                      aria-label="Introduction to Deceased MyEMemorials"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="inline-flex items-center gap-3 rounded-full bg-black/65 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-blue-950">
                          ▶
                        </span>

                        Deceased MyEMemorial Introduction
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* MAIN VALUE PROPOSITION */}
              <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                  <div>
                    <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
                      More Than an Obituary
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
                      Remember the Life, Not Just the Facts
                    </h2>

                    <p className="mt-4 text-lg leading-8 text-stone-600">
                      An obituary records important facts. A MyEMemorial brings
                      those facts to life with the stories, photographs, video,
                      music, family history, and memories that show who they
                      really were.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["📖", "Their Story", "Preserve the experiences and memories that made their life unique."],
                      ["📷", "Photos, Video & Music", "Keep meaningful media together in one lasting place."],
                      ["👨‍👩‍👧‍👦", "Loved Ones Sharing", "Invite family and friends to contribute memories."],
                      ["🌳", "Future Generations", "Give family a place to know and remember them for years to come."],
                    ].map(([icon, title, copy]) => (
                      <div
                        key={title}
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                      >
                        <div className="text-3xl">{icon}</div>
                        <h3 className="mt-2 text-xl font-bold text-stone-900">
                          {title}
                        </h3>
                        <p className="mt-2 text-base leading-7 text-stone-600">
                          {copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* HOW IT WORKS */}
              <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-8">
                <div className="text-center">
                  <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
                    How It Works
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    Three Simple Steps
                  </h2>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-xl font-bold text-white">
                      1
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-stone-900">
                      Create Their MyEMemorial
                    </h3>

                    <p className="mt-2 text-base leading-7 text-stone-600">
                      Start Free or choose Basic, Plus, or Premium.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-xl font-bold text-white">
                      2
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-stone-900">
                      Add Their Story and Memories
                    </h3>

                    <p className="mt-2 text-base leading-7 text-stone-600">
                      Add the stories, photos, video, music, and life details you want remembered.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-xl font-bold text-white">
                      3
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-stone-900">
                      Share and Preserve It
                    </h3>

                    <p className="mt-2 text-base leading-7 text-stone-600">
                      Save your MyEMemorial and share it with family and friends so they can add memories, photos and videos.
                    </p>
                  </div>
                </div>
              </section>

              {/* CELEBRATION OF LIFE PRESENTATION */}
              <section className="overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-sm">
                <div className="grid items-center gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="p-7 md:p-8">
                    <NewBurst />

                    <h2 className="mt-4 text-3xl font-bold leading-tight text-amber-300 md:text-4xl">
                      Celebration of Life Presentation
                    </h2>

                    <p className="mt-3 text-xl font-semibold leading-snug text-white md:text-2xl">
                      Helping to Simplify Celebration of Life Events.
                    </p>

                    <p className="mt-4 text-lg leading-8 text-stone-200">
                      Basic, Plus, and Premium include an optional Celebration
                      of Life Presentation at no additional charge. Use the
                      photos, captions, Video Memories, and favorite music already
                      preserved in their MyEMemorial.
                    </p>
                  </div>

                  <div className="bg-white/5 p-7 md:p-8">
                    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                      {[
                        "Full-screen presentation",
                        "Photos with captions",
                        "Full Video Memory playback",
                        "Favorite music",
                        "Pause and resume",
                        "Continuous looping",
                        "Temporary viewing link",
                        "No normal website navigation",
                      ].map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-base font-semibold leading-7 text-white"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-base font-bold text-blue-950"
                          >
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* GIFT */}
              <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-7">
                <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
                  <div>
                    <p className="text-base font-bold uppercase tracking-[0.16em] text-amber-800">
                      A Meaningful Gift After a Loss
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-stone-900">
                      Give Their Family a Place to Preserve the Memories
                    </h2>
                    <p className="mt-2 max-w-3xl text-base leading-7 text-stone-700">
                      Choose a plan and send it as a gift. The family receives
                      the MyEMemorial and creates it for the person they are remembering.
                    </p>
                  </div>

                  <Link
                    href="/gift?type=memorial"
                    className="inline-flex min-h-[56px] w-full max-w-[300px] shrink-0 items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
                  >
                    🎁 Give a Deceased MyEMemorial
                  </Link>
                </div>
              </section>

              {/* PRICING */}
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

                  <p className="mx-auto mt-3 max-w-3xl text-lg leading-8 text-stone-600">
                    Choose the amount of space your family needs for photos,
                    Video Memories, music, family history, and the memories that
                    tell their story.
                  </p>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <PlanCard
                    title="Free Deceased MyEMemorial"
                    price="$0"
                    href="/create?mode=memorial&plan=free"
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
                    title="Basic Deceased MyEMemorial"
                    price="$49.95"
                    href="/create?mode=memorial&plan=basic"
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
                      "__NEW_CELEBRATION_PRESENTATION__",
                    ]}
                  />

                  <PlanCard
                    title="Plus Deceased MyEMemorial"
                    price="$69.95"
                    href="/create?mode=memorial&plan=plus"
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
                      "__NEW_CELEBRATION_PRESENTATION__",
                    ]}
                  />

                  <PlanCard
                    title="Premium Deceased MyEMemorial"
                    price="$89.95"
                    href="/create?mode=memorial&plan=premium"
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
                      "__NEW_CELEBRATION_PRESENTATION__",
                    ]}
                  />
                </div>

                <p className="mt-5 text-center text-base leading-7 text-stone-500">
                  Paid plans are one-time payments with no recurring subscription fee.
                </p>
              </section>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


function NewBurst({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center bg-yellow-300 text-stone-950 shadow-lg font-black uppercase ${
        compact
          ? "h-16 w-16 text-base tracking-normal"
          : "h-28 w-28 text-xl tracking-[0.08em]"
      }`}
      style={{
        clipPath:
          "polygon(50% 0%, 59% 18%, 76% 6%, 78% 27%, 98% 24%, 84% 40%, 100% 50%, 82% 59%, 96% 76%, 76% 75%, 74% 96%, 58% 82%, 50% 100%, 41% 82%, 24% 95%, 23% 75%, 3% 77%, 17% 59%, 0% 50%, 17% 41%, 3% 24%, 24% 27%, 25% 5%, 42% 18%)",
      }}
      aria-label="All New"
    >
      <span className={`text-center ${compact ? "leading-none" : "leading-tight"}`}>
        ALL
        <br />
        NEW
      </span>
    </div>
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
      className={`relative flex min-w-0 flex-col rounded-[1.25rem] p-5 pt-8 shadow-sm ${
        dark
          ? "border-2 border-blue-950 bg-blue-950 text-white"
          : "border border-stone-200 bg-stone-50 text-stone-900"
      }`}
    >
      {badge && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
          {badge === "Most Popular" ? (
            <div className="whitespace-nowrap rounded-full bg-amber-400 px-5 py-2 text-center text-base font-bold uppercase tracking-[0.12em] text-stone-900 shadow">
              {badge}
            </div>
          ) : (
            <div
              className={`whitespace-nowrap rounded-full px-4 py-2 text-base font-bold uppercase tracking-[0.12em] shadow-sm ${
                dark
                  ? "bg-white text-blue-950"
                  : "border border-stone-300 bg-white text-stone-700"
              }`}
            >
              {badge}
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-[94px] flex-col items-center justify-start text-center">
        <p
          className={`text-base font-bold uppercase tracking-[0.12em] ${
            dark ? "text-stone-200" : "text-stone-600"
          }`}
        >
          {title}
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-center gap-2">
          <span className="text-3xl font-bold">{price}</span>
          <span
            className={`pb-1 text-base ${
              dark ? "text-stone-300" : "text-stone-500"
            }`}
          >
            one-time
          </span>
        </div>
      </div>

      <ul
        className={`mt-2 space-y-1.5 text-base leading-6 ${
          dark ? "text-stone-100" : "text-stone-700"
        }`}
      >
        {items.map((item) =>
          item === "__NEW_CELEBRATION_PRESENTATION__" ? (
            <li
              key={item}
              className="mt-3 rounded-xl border-2 border-yellow-300 bg-yellow-50 px-2.5 py-2.5 text-center text-stone-950 shadow-sm"
            >
              <div className="flex items-center justify-center gap-1">
                <NewBurst compact />
                <p className="min-w-0 flex-1 pr-1 text-base font-medium leading-5">
                  Celebration
                  <br />
                  of Life
                  <br />
                  Presentation
                </p>
              </div>
            </li>
          ) : (
            <li key={item} className="flex items-start gap-2">
              <span className="shrink-0 font-bold">✓</span>
              <span>{item}</span>
            </li>
          )
        )}
      </ul>

      <div className="mt-auto pt-5">
        <Link
          href={href}
          className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold transition ${
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
