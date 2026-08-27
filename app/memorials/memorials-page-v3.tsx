"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SideAd from "../components/SideAd";

const benefits = [
  {
    icon: "📖",
    title: "Tell the Whole Story",
    text: "Go beyond names, dates, and a short obituary. Preserve the stories, experiences, relationships, accomplishments, and moments that made their life unique.",
  },
  {
    icon: "📷",
    title: "Preserve Photos, Video, and Music",
    text: "Bring meaningful photos, Video Memories, favorite songs, family history, and important life events together in one lasting place.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Bring Family Memories Together",
    text: "Family and friends can contribute memories and media, while the MyEMemorial owner controls what becomes part of the public memorial.",
  },
  {
    icon: "🌳",
    title: "Preserve Their Story for Generations",
    text: "Give children, grandchildren, relatives, and future generations a place where they can discover and truly know the person behind the dates.",
  },
];

const memorialFeatures = [
  "Life story and meaningful memories",
  "Featured photo and photo gallery",
  "Video Memories",
  "Favorite music",
  "Family history",
  "Places lived and worked",
  "Schools and awards",
  "Social media links",
  "Obituary information",
  "Final resting place details",
  "Family and friend contributions",
  "Celebration of Life Presentation",
  "Public sharing and QR access",
];

export default function MemorialsPage() {
  const [visitorZip, setVisitorZip] = useState<string | null>(null);

  useEffect(() => {
    async function loadVisitorZip() {
      try {
        const response = await fetch("/api/ip-lookup");
        const data = await response.json();

        if (data.zip) {
          setVisitorZip(data.zip);
        }
      } catch (error) {
        console.error("VISITOR ZIP ERROR:", error);
      }
    }

    void loadVisitorZip();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ec]">
      {/* HERO */}
      <section className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-white shadow-sm lg:grid-cols-2">
            <div className="p-7 md:p-10 lg:p-12">
              <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
                MyEMemorial for Someone Who Has Passed
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
                Preserve the Life They Lived, Not Just the Day They Passed
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                Create a lasting MyEMemorial filled with the stories, photos,
                videos, favorite music, family history, obituary, final resting
                place, and memories that made their life uniquely theirs.
              </p>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
                Give family, friends, and future generations a place to remember
                who they were, how they lived, and why they mattered.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="#pricing"
                  className="inline-flex min-h-[58px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
                >
                  Choose a MyEMemorial Plan
                </Link>

                <Link
                  href="/memorial/daniel-james-whitmore"
                  className="inline-flex min-h-[58px] w-full max-w-[300px] items-center justify-center rounded-full border-2 border-stone-300 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
                >
                  Experience a Sample MyEMemorial
                </Link>

                <Link
                  href="/gift?type=memorial"
                  className="inline-flex min-h-[58px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
                >
                  🎁 Give a MyEMemorial as a Gift
                </Link>
              </div>
            </div>

            <div className="relative min-h-[380px] bg-stone-900 lg:min-h-[540px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(12,18,28,0.20), rgba(12,18,28,0.38)), url('/images/homepage-hero.png')",
                }}
              />

              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/92 p-5 text-center shadow-lg backdrop-blur">
                <p className="text-base font-bold uppercase tracking-[0.16em] text-blue-900">
                  Remember the Person, Not Only the Loss
                </p>

                <p className="mt-2 text-lg leading-7 text-stone-700">
                  Preserve the moments, relationships, stories, and memories
                  that made their life worth remembering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT + LOCAL ADS */}
      <section className="px-4 pb-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-40 space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-base font-bold uppercase tracking-[0.16em] text-stone-500">
                    Local Memorial Resources
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-stone-900">
                    Helpful Services
                  </h2>

                  <p className="mt-2 text-base leading-7 text-stone-600">
                    Local resources that may be helpful while creating and
                    sharing a memorial.
                  </p>
                </div>

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
            </aside>

            <div className="space-y-8">
              {/* VIDEO PLACEHOLDER */}
              <section className="overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-sm">
                <div className="grid items-stretch lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="flex flex-col justify-center p-7 md:p-9">
                    <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-300">
                      See What a MyEMemorial Can Become
                    </p>

                    <h2 className="mt-3 text-3xl font-bold leading-tight">
                      A Life Is More Than an Obituary
                    </h2>

                    <p className="mt-4 text-lg leading-8 text-stone-200">
                      See how MyEMemorial can bring a person&apos;s stories,
                      photos, videos, music, family history, and meaningful
                      memories together in one lasting tribute.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-base font-semibold text-stone-200">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                        ✓ Preserve their story
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                        ✓ Bring memories together
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                        ✓ Share with family
                      </span>
                    </div>
                  </div>

                  <div className="relative flex min-h-[320px] items-center justify-center bg-black lg:min-h-[410px]">
                    <div className="px-6 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 text-3xl text-white">
                        ▶
                      </div>

                      <p className="mt-5 text-xl font-bold text-white">
                        MyEMemorial Introduction Video
                      </p>

                      <p className="mx-auto mt-2 max-w-md text-base leading-7 text-stone-300">
                        This placeholder will be replaced with the finished
                        MyEMemorial-for-someone-who-has-passed video.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* BENEFITS */}
              <section>
                <div className="text-center">
                  <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
                    Why Create One?
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
                    Help Their Story Live Beyond the Dates
                  </h2>

                  <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-600">
                    A MyEMemorial gives families more room to remember the
                    personality, experiences, relationships, and moments that a
                    traditional notice or headstone cannot fully tell.
                  </p>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
                    >
                      <div className="text-4xl">{benefit.icon}</div>

                      <h3 className="mt-3 text-xl font-bold text-stone-900">
                        {benefit.title}
                      </h3>

                      <p className="mt-2 text-lg leading-8 text-stone-600">
                        {benefit.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* GIFT A MYEMEMORIAL */}
              <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm md:p-8">
                <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-800">
                      A Meaningful Gift After a Loss
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-stone-900">
                      Give Their Family a Place to Preserve the Memories
                    </h2>

                    <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
                      When someone you care about has recently lost a loved one,
                      a MyEMemorial can be a thoughtful gift that lasts far
                      beyond flowers or sympathy cards. Give them a place to
                      preserve stories, photographs, videos, music, family
                      memories, and the details of a life they never want
                      forgotten.
                    </p>

                    <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
                      You choose the plan. They receive the gift and create the
                      MyEMemorial for the person they are remembering.
                    </p>
                  </div>

                  <Link
                    href="/gift?type=memorial"
                    className="inline-flex min-h-[58px] w-full max-w-[310px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
                  >
                    🎁 Give a MyEMemorial
                  </Link>
                </div>
              </section>

              {/* BEYOND AN OBITUARY */}
              <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                <div className="text-center">
                  <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
                    Beyond an Obituary
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    An Obituary Says They Lived. Their MyEMemorial Shows How They
                    Lived.
                  </h2>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
                    <h3 className="text-2xl font-bold text-stone-900">
                      A Traditional Obituary
                    </h3>

                    <p className="mt-4 text-lg leading-8 text-stone-600">
                      Usually records important facts such as names, dates,
                      family members, services, and a brief summary of a life.
                    </p>
                  </div>

                  <div className="rounded-3xl border-2 border-blue-950 bg-blue-50 p-6">
                    <h3 className="text-2xl font-bold text-blue-950">
                      A MyEMemorial
                    </h3>

                    <p className="mt-4 text-lg leading-8 text-stone-700">
                      Gives those facts context through stories, photos, video,
                      favorite music, places, family history, contributions,
                      and the memories that help future generations understand
                      who that person really was.
                    </p>
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
                    Create It. Build Their Story. Share It for Generations.
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

                    <p className="mt-2 text-lg leading-8 text-stone-600">
                      Start Free or choose the plan that gives your family the
                      space you want for their story and memories.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-xl font-bold text-white">
                      2
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-stone-900">
                      Add Their Story and Memories
                    </h3>

                    <p className="mt-2 text-lg leading-8 text-stone-600">
                      Add life details, stories, obituary information, photos,
                      video, music, family history, and final resting place
                      information.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-xl font-bold text-white">
                      3
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-stone-900">
                      Share and Preserve It
                    </h3>

                    <p className="mt-2 text-lg leading-8 text-stone-600">
                      Invite contributions, share the public memorial, and give
                      future generations a lasting place to remember them.
                    </p>
                  </div>
                </div>
              </section>

              {/* ALL NEW CELEBRATION OF LIFE PRESENTATION */}
              <section className="overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-sm">
                <div className="grid items-stretch gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="p-7 md:p-9">
                    <NewBurst />

                    <p className="mt-5 text-base font-bold uppercase tracking-[0.18em] text-amber-300">
                      Celebration of Life Presentation
                    </p>

                    <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                      Your MyEMemorial Can Also Be Used for the Celebration of Life Presentation
                    </h2>

                    <p className="mt-4 text-lg leading-8 text-stone-200">
                      Basic, Plus, and Premium Deceased MyEMemorial plans now include a
                      dedicated Celebration of Life Presentation at no additional
                      charge, designed for use at the funeral home, church,
                      memorial service, celebration of life, or family gathering.
                    </p>

                    <p className="mt-4 text-lg leading-8 text-stone-200">
                      Present memorial photos and captions, play Video Memories
                      in full, use favorite music, pause when needed, loop the
                      presentation, and display it full-screen without the normal
                      website navigation getting in the way.
                    </p>
                  </div>

                  <div className="grid content-center gap-4 bg-white/5 p-7 md:p-9 sm:grid-cols-2">
                    {[
                      "Full-screen presentation mode",
                      "Photos with captions",
                      "Full Video Memory playback",
                      "Favorite music",
                      "Pause and resume controls",
                      "Continuous looping",
                      "Temporary viewing link",
                      "No normal website navigation",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="rounded-2xl border border-white/15 bg-white/10 p-4 text-base font-semibold leading-7 text-white"
                      >
                        ✓ {feature}
                      </div>
                    ))}
                  </div>
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
                    title="Basic Deceased MyEMemorial"
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
                      "__NEW_FUNERAL_PRESENTATION__",
                    ]}
                  />

                  <PlanCard
                    title="Plus Deceased MyEMemorial"
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
                      "__NEW_FUNERAL_PRESENTATION__",
                    ]}
                  />

                  <PlanCard
                    title="Premium Deceased MyEMemorial"
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
                      "__NEW_FUNERAL_PRESENTATION__",
                    ]}
                  />
                </div>

                <p className="mt-5 text-center text-base leading-7 text-stone-500">
                  Paid plans are one-time payments with no recurring subscription fee.
                </p>
              </section>

              {/* FINAL CTA */}
              <section className="rounded-[2rem] bg-blue-950 p-7 text-center text-white shadow-sm md:p-10">
                <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-300">
                  Preserve What Made Them Unforgettable
                </p>

                <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Their Story Deserves to Be Remembered
                </h2>

                <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-200">
                  Preserve the memories, stories, voices, photographs, and
                  moments that made their life uniquely theirs.
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="#pricing"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-base font-bold text-stone-900 transition hover:bg-amber-300"
                  >
                    Create Their MyEMemorial
                  </Link>

                  <Link
                    href="/memorial/daniel-james-whitmore"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/20"
                  >
                    Experience a Sample MyEMemorial
                  </Link>

                  <Link
                    href="/gift?type=memorial"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-white px-6 py-3 text-base font-bold text-blue-950 transition hover:bg-stone-100"
                  >
                    🎁 Give One as a Gift
                  </Link>
                </div>
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
      className={`inline-flex shrink-0 items-center justify-center bg-yellow-300 text-stone-950 shadow-lg ${
        compact ? "h-20 w-20 text-base" : "h-28 w-28 text-xl"
      } font-black uppercase tracking-[0.08em]`}
      style={{
        clipPath:
          "polygon(50% 0%, 59% 18%, 76% 6%, 78% 27%, 98% 24%, 84% 40%, 100% 50%, 82% 59%, 96% 76%, 76% 75%, 74% 96%, 58% 82%, 50% 100%, 41% 82%, 24% 95%, 23% 75%, 3% 77%, 17% 59%, 0% 50%, 17% 41%, 3% 24%, 24% 27%, 25% 5%, 42% 18%)",
      }}
      aria-label="All New"
    >
      <span className="text-center leading-tight">
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
              <div className="rounded-full bg-amber-400 px-6 py-2 text-center text-base font-bold uppercase tracking-[0.15em] text-stone-900 shadow">
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
          {items.map((item) =>
            item === "__NEW_FUNERAL_PRESENTATION__" ? (
              <li
                key={item}
                className={`mt-4 rounded-2xl border-2 border-yellow-300 p-4 shadow-sm ${
                  dark
                    ? "bg-white text-stone-950"
                    : "bg-yellow-50 text-stone-950"
                }`}
              >
                <div className="flex items-center gap-4">
                  <NewBurst compact />
                  <div>
                    <p className="text-lg font-black leading-6">
                      Celebration of Life Presentation
                    </p>
                    <p className="mt-1 text-base font-bold leading-6">
                      Included at No Additional Charge
                    </p>
                  </div>
                </div>
              </li>
            ) : (
              <li key={item}>✔ {item}</li>
            )
          )}
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
