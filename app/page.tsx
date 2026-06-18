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
        backgroundImage: "linear-gradient(rgba(245,245,244,0.86), rgba(245,245,244,0.9)), url('/gravestone1.jpg')",
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
                backgroundImage: "url('/gravestone1.jpg')",
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
                  Don’t Let A Weathered Stone Be All That Remains.
                </h1>

                <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-snug text-stone-100 md:text-2xl">
                  Lives remembered here forever.
                </p>

                <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-stone-100 md:text-base">
                  A place for lasting memorials with photos, videos, loved one's favorite songs and life stories for today's friends, families and future generations.
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
  href="/create?mode=personal"
  className="inline-flex h-[60px] w-[260px] items-center justify-center rounded-full bg-amber-400 px-5 text-sm font-semibold text-stone-900 text-center leading-tight transition hover:bg-amber-300"
>
  <span className="block">
    <span className="block">Create Your Own Future</span>
    <span className="block">Personal E-Memorial</span>
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
 

</div>
  
              </div>
              
            </section>
<div className="lg:hidden space-y-4">
 <MobileAd
  pageType="home"
  memorialZip={visitorZip}
/>

<MobileAd
  pageType="home"
  memorialZip={visitorZip}
/>
</div>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-2xl">🕊️</div>
                <h2 className="mt-3 text-lg font-bold text-stone-900">
                  Preserve a life
                </h2>
                <p className="mt-2 text-sm leading-5 text-stone-600">
                  Create a lasting memorial with biography, photos, videos, favorite songs, personal memories, cemetery details & obituary.
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
                  MyEMemorial helps families preserve the stories, places, family members, music, photos, and memories that make a life worth remembering.
                </p>
              </div>
            </section>
<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Built for families
      </p>
      <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
        A memorial your family controls
      </h2>
      <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
        MyEMemorial gives families a respectful place to preserve memories, approve contributions,
        and keep a loved one’s memories alive for future generations.
      </p>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">🔒</div>
        <h3 className="mt-3 text-base font-bold text-stone-900">
          Family-controlled edits
        </h3>
        <p className="mt-2 text-sm leading-5 text-stone-600">
          Memorial owners manage updates, photos, videos, music, obituary details, and family history.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">✅</div>
        <h3 className="mt-3 text-base font-bold text-stone-900">
          Contributor approval
        </h3>
        <p className="mt-2 text-sm leading-5 text-stone-600">
          Friends and relatives can submit memories, but families approve contributions before they appear publicly.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">🕯️</div>
        <h3 className="mt-3 text-base font-bold text-stone-900">
          Built to preserve memories
        </h3>
        <p className="mt-2 text-sm leading-5 text-stone-600">
          Photos, videos, stories, songs, cemetery details, and family history can be saved in one lasting memorial.
        </p>
      </div>
    </div>
  </div>
</section>
<div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5 md:p-6">
  <div className="grid gap-4 text-center md:grid-cols-4">
    <div>
      <p className="text-2xl font-bold text-stone-900">
        One-Time Payment
      </p>
      <p className="mt-1 text-sm text-stone-600">
        No subscription fees
      </p>
    </div>

    <div>
  <p className="text-2xl font-bold text-stone-900">
    Family Guided
  </p>
  <p className="mt-1 text-sm text-stone-600">
    Family-controlled memorial updates
  </p>
</div>

    <div>
      <p className="text-2xl font-bold text-stone-900">
        Secure
      </p>
      <p className="mt-1 text-sm text-stone-600">
        Contributor approval before publishing
      </p>
    </div>

    <div>
      <p className="text-2xl font-bold text-stone-900">
        Lasting
      </p>
      <p className="mt-1 text-sm text-stone-600">
        Preserve stories, photos, videos, and memories
      </p>
    </div>
  </div>
</div>
            <section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-7">
              <div className="mx-auto max-w-7xl">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Memorial Plans
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
                    Choose the memorial plan that fits your family
                  </h2>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <PlanCard
                    title="Basic Memorial"
                    price="$49.95"
                    items={[
  "Up to 50 photos",
  "Up to 2 five minute videos",
  "Favorite music",
  "Life story & obituary",
  "Cemetery map",
  "Contributor approval",
]}
                  />

                  <PlanCard
                    title="Plus Memorial"
                    price="$69.95"
                    dark
                    badge="Most Popular"
                    items={[
                      "Everything in Basic",
                      "Up to 150 photos",
                      "Up to 5 five minute videos",
                      
                    ]}
                  />

                  <PlanCard
                    title="Premium Memorial"
                    price="$89.95"
                    items={[
                      "Everything in Plus",
                      "Unlimited photos",
                      "Up to 10 five minute videos",
                      "Best for larger families",
                    ]}
                  />
                </div>

                <p className="mt-4 text-center text-sm leading-6 text-stone-500">
  One-time payment. No recurring subscription fees.
  <br />
  Families maintain control through contributor approval.
  <br />
  Memorial owners control updates, photos, videos, and public contributions.
</p>
              </div>
   <section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
      Memorial Experience
    </p>

    <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
      Preserve memories in one meaningful place
    </h2>

    <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
      Memorials can include photographs, videos, favorite music, obituary information,
      cemetery locations, family history, and stories shared by loved ones.
    </p>
  </div>

  <div className="mt-8 grid gap-5 md:grid-cols-3">
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm">
      <div className="h-44 bg-[url('/memorial-preview-1.jpg')] bg-cover bg-center" />
      <div className="p-5">
        <h3 className="text-base font-bold text-stone-900">
          Photo Galleries
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Preserve family photographs, milestones, and cherished memories.
        </p>
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm">
      <div className="h-44 bg-[url('/memorial-preview-2.jpg')] bg-cover bg-center" />
      <div className="p-5">
        <h3 className="text-base font-bold text-stone-900">
          Videos & Stories
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Save personal stories, celebrations, voices, and important life moments.
        </p>
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm">
      <div className="h-44 bg-[url('/memorial-preview-3.jpg')] bg-cover bg-center" />
      <div className="p-5">
        <h3 className="text-base font-bold text-stone-900">
          Family Legacy
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Help future generations remember family history, relationships, and life stories.
        </p>
      </div>
    </div>
  </div>
</section>           
            </section>
<section className="overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-stone-800 via-stone-900 to-black px-6 py-8 text-white shadow-sm md:px-10">
  <div className="mx-auto max-w-4xl text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">
      Why MyEMemorial
    </p>

    <h2 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">
      A life deserves more than a fading stone.
    </h2>

    <p className="mt-5 text-sm leading-7 text-stone-300 md:text-base">
      Every person leaves behind stories, memories, photographs, voices,
      relationships, and moments that deserve to be remembered.
    </p>

    <p className="mt-4 text-sm leading-7 text-stone-300 md:text-base">
      MyEMemorial was created to help families preserve those memories for
      children, grandchildren, and future generations in one respectful place.
    </p>
  </div>
</section>
<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-7">
  <div className="grid gap-6 text-center md:grid-cols-3">
    <div>
      <p className="text-3xl font-bold text-stone-900">
        Photos
      </p>
      <p className="mt-2 text-sm text-stone-600">
        Preserve family photographs and important moments.
      </p>
    </div>

    <div>
      <p className="text-3xl font-bold text-stone-900">
        Videos
      </p>
      <p className="mt-2 text-sm text-stone-600">
        Save stories, voices, celebrations, and memories that would otherwise fade over time.
      </p>
    </div>

    <div>
      <p className="text-3xl font-bold text-stone-900">
        Family History
      </p>
      <p className="mt-2 text-sm text-stone-600">
        Help future generations understand where they came from and who came before them.
      </p>
    </div>
  </div>
</section>


  <section className="mx-auto mt-12 max-w-4xl rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
  <p className="text-sm font-semibold uppercase tracking-wide text-blue-900">
    The Story Behind MyEMemorial
  </p>

  <h2 className="mt-3 text-3xl font-bold text-stone-900">
    "Who was this person?"
  </h2>

  <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-700">
    More than fifty years ago, a seventh-grade boy standing in a cemetery found
    himself wondering about the people behind the weathered gravestones and
    asking:
  </p>

  <blockquote className="mt-6 border-l-4 border-blue-900 pl-6 text-2xl italic text-stone-900">
    "Who was this person?"
  </blockquote>

  <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-700">
    That question stayed with him throughout his life and eventually inspired
    the creation of MyEMemorial — a place where future generations can truly
    know and remember the people who came before them.
  </p>

  <a
    href="/our-story"
    className="mt-8 inline-flex rounded-full bg-blue-950 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-900"
  >
    Read Our Story
  </a>
</section>
<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-5xl">
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        Frequently Asked Questions
      </p>

      <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
        Online memorial questions families often ask
      </h2>

      <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
        MyEMemorial helps families create lasting online memorials with photos,
        videos, favorite music, life stories, obituary information, family history,
        cemetery maps, and memories shared by loved ones.
      </p>
    </div>

    <div className="mt-7 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-base font-bold text-stone-900">
          What is MyEMemorial?
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          MyEMemorial is an online memorial platform where families can preserve
          photos, videos, life stories, obituary details, family history, cemetery
          information, and memories in one lasting tribute page.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-base font-bold text-stone-900">
          Can family and friends contribute memories?
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Yes. Family members and friends can submit written memories, photos,
          and videos. Memorial owners review and approve contributions before
          they appear publicly.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-base font-bold text-stone-900">
          Can a memorial include photos, videos, and music?
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Yes. MyEMemorial supports photo galleries, memorial videos, video
          captions, favorite songs, music playlists, life stories, and obituary
          information.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-base font-bold text-stone-900">
          Is there a monthly subscription fee?
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          No. MyEMemorial memorial plans are one-time payments with no recurring
          subscription fees.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-base font-bold text-stone-900">
          Can memorials include cemetery or final resting place information?
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Yes. Memorials can include cemetery names, grave details, final resting
          place information, directions, and map details to help family and friends
          find and remember a loved one.
        </p>
      </div>
<div className="rounded-2xl bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-stone-900">
    What inspired the creation of MyEMemorial?
  </h3>

 <p className="mt-3 text-stone-700">
  More than fifty years ago, a seventh-grade boy standing in a cemetery found
  himself wondering about the people behind weathered gravestones and asking,
  "Who was this person?" That question stayed with him throughout his life and
  eventually inspired the creation of MyEMemorial.
</p>

<a
  href="/our-story"
  className="mt-4 inline-block font-semibold text-blue-900 hover:underline"
>
  Read Our Story →
</a>
</div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-base font-bold text-stone-900">
          Can an online memorial be shared with a QR code?
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Yes. Memorial pages can be shared by link, social media, email, text
          message, printed materials, or QR codes placed on memorial cards,
          plaques, markers, or monuments.
        </p>
      </div>
    </div>
  </div>
</section>
            <section className="rounded-[1.5rem] bg-stone-900 px-6 py-7 text-white shadow-sm md:px-8">
  <div className="flex flex-col gap-6 text-center md:text-left">
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

    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
      <Link
        href="/create"
        className="flex h-[60px] w-full max-w-[260px] flex-col items-center justify-center rounded-full bg-white px-5 text-center text-sm font-semibold leading-tight text-stone-900 transition hover:bg-stone-200"
      >
        <span>Create an E-memorial</span>
        <span>for a loved one</span>
      </Link>

      <Link
        href="/search"
        className="flex h-[60px] w-full max-w-[260px] items-center justify-center rounded-full bg-white px-5 text-center text-sm font-semibold leading-tight text-stone-900 transition hover:bg-stone-200"
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
  className={`flex min-w-0 flex-col justify-between rounded-[1.25rem] p-6 pt-7 shadow-sm ${
        dark
          ? "border-2 border-blue-950 bg-blue-950 text-white"
          : "border border-stone-200 bg-stone-50 text-stone-900"
      }`}
    >
      {badge && (
  <div className="mb-4 flex justify-center">
    <div className="rounded-full bg-amber-400 px-6 py-2 text-xs font-bold uppercase tracking-[0.15em] text-stone-900 shadow text-center">
      {badge}
    </div>
  </div>
)}

      

      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-stone-300" : "text-stone-500"}`}>
        {title}
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-center gap-2 text-center">
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