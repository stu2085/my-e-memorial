"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SideAd from "./components/SideAd";
import MobileAd from "./components/MobileAd";

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
    <main className="min-h-screen bg-stone-100 px-4 py-6 md:px-8">
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
           <section className="relative overflow-hidden rounded-[1.5rem] shadow-sm">
  <img
    src="/Images/homepage-hero.png"
    alt=""
    className="block h-auto w-full"
  />

  <div className="absolute bottom-4 right-4 z-10 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6">
    <Link
      href="/memorial/daniel-james-whitmore"
      className="inline-flex h-[46px] items-center justify-center rounded-full border-2 border-white bg-blue-950/90 px-4 text-base font-semibold text-white shadow-lg transition hover:bg-blue-900 sm:h-[50px] sm:px-5 sm:text-base"
    >
      Experience a Sample MyEMemorial
    </Link>
  </div>

  <div className="sr-only">
    <h1>Where Life&apos;s Stories Are Told.</h1>
    <p>
      Preserve the stories, memories, photos, voices, and moments that make
      every life unique — today and for generations to come.
    </p>
  </div>
</section>

<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-950 md:text-base">
        See How MyEMemorial Works
      </p>

      <h2 className="mt-2 text-2xl font-bold text-stone-900 md:text-3xl">
        A Life Is More Than Names and Dates
      </h2>

      <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
        See how MyEMemorial helps preserve the stories, photos, memories,
        voices, and experiences that make up a person&apos;s life.
      </p>
    </div>

   <div className="mx-auto mt-6 flex justify-center">
  <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-black shadow-md">
    <video
      className="h-auto w-full object-contain"
      playsInline
      controls
      preload="metadata"
      aria-label="Introduction to MyEMemorial"
    >
      <source
        src="/videos/homepage-introduction.mp4"
        type="video/mp4"
      />
    </video>
  </div>
</div>

  </div>
</section>
<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-950 md:text-base">
        Choose Your MyEMemorial
      </p>

      <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
        What would you like to create?
      </h2>

      <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
        MyEMemorial gives you two ways to preserve the story of a life.
      </p>
    </div>

    <div className="mt-7 grid gap-6 md:grid-cols-2">
      {/* Living MyEMemorial */}
      <div className="flex flex-col rounded-3xl border border-amber-200 bg-amber-50 p-7 text-center shadow-sm md:p-8">
        <div className="text-4xl">❤️</div>

        <h3 className="mt-4 text-2xl font-bold text-stone-900 md:text-3xl">
          Living MyEMemorial
        </h3>

        <p className="mt-2 text-base font-semibold text-stone-600 md:text-lg">
          For yourself or someone living
        </p>

        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          Preserve stories, memories, photos, family history, and experiences
          while the living person can still help tell the story themselves.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          Paid plans also include a Celebration of Life Presentation for use
          after the living person has passed, so approved photos and videos can be shared
          at a funeral, memorial service, or Celebration of Life.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          After independent death verification, a Designated Person can
          handle permitted after-death updates without changing the life story already preserved.
        </p>

        <div className="mt-auto pt-6">
          <Link
            href="/personal-e-memorials"
            className="inline-flex min-h-[64px] w-full max-w-[390px] items-center justify-center rounded-full bg-amber-400 px-4 py-3 text-center text-base font-bold leading-tight text-stone-900 transition hover:bg-amber-300"
          >
            Explore Living MyEMemorials & Pricing
          </Link>
        </div>
      </div>

      {/* MyEMemorial for someone who has passed */}
      <div className="flex flex-col rounded-3xl border border-stone-300 bg-stone-900 p-7 text-center text-white shadow-sm md:p-8">
        <div className="text-4xl">🕊️</div>

        <h3 className="mt-4 text-2xl font-bold md:text-3xl">
          Deceased MyEMemorial
        </h3>

        <p className="mt-2 text-base font-semibold text-stone-300 md:text-lg">
          For Someone Who Has Passed
        </p>

        <p className="mt-2 text-base font-semibold text-stone-300 md:text-lg">
          Preserve and share their life story
        </p>

        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-stone-200 md:text-lg">
          Bring together their stories, photos, videos, favorite music,
          family history, and meaningful memories in one lasting place.
          Paid plans also include a Celebration of Life Presentation for
          sharing approved photos and videos at a funeral or memorial service.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-stone-200 md:text-lg">
          Family and friends can submit stories, photos, and videos to help preserve their
          story for future generations.
        </p>

        <div className="mt-auto pt-6">
          <Link
            href="/memorials"
            className="inline-flex min-h-[64px] w-full max-w-[390px] items-center justify-center rounded-full bg-white px-4 py-3 text-center text-base font-bold leading-tight text-stone-900 transition hover:bg-stone-200"
          >
            Explore Deceased MyEMemorials & Pricing
          </Link>
        </div>
      </div>
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
            <section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-base font-semibold uppercase tracking-[0.18em] text-stone-500">
        Built for families
      </p>

      <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
        Your story. Your memories. Your control.
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-lg leading-7 text-stone-700">
  Preserve the stories, memories, photos, videos, and family history that
  make a life unique — whether you are telling your own story or remembering
  someone who has passed.
</p>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">🔒</div>

        <h3 className="mt-3 text-xl font-bold text-stone-900">
          You stay in control
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          MyEMemorial members control updates, stories, photos, videos, music,
          family information, and other details added to the MyEMemorial.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">✅</div>

        <h3 className="text-xl font-bold text-stone-900">
          Family and friends can submit stories, photos and videos
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Invite family and friends to share memories and media while you
          retain approval over what becomes part of the public MyEMemorial.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">🌳</div>

        <h3 className="mt-3 text-xl font-bold text-stone-900">
          Preserve it for generations
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Keep meaningful stories, memories, and family history together so
          future generations can better know the people who came before them.
        </p>
      </div>
    </div>
  </div>
</section>


  <section className="rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm md:px-8">
  <div className="mx-auto max-w-4xl">
  <p className="text-lg leading-7 font-semibold uppercase tracking-wide text-blue-900">
    The Story Behind MyEMemorial
  </p>

  

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

  <Link
    href="/our-story"
    className="mt-8 inline-flex rounded-full bg-blue-950 px-6 py-3 text-lg leading-7 font-semibold text-white hover:bg-blue-900"
  >
    Read Our Story
  </Link>
  </div>
</section>
<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-5xl">
    <div className="text-center">
      <p className="text-base font-semibold uppercase tracking-[0.18em] text-stone-500">
        Frequently Asked Questions
      </p>

      <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
  Questions about MyEMemorial
</h2>

      <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-stone-600 md:text-base">
        MyEMemorial helps people preserve life stories, memories, photos,
        videos, family history, and meaningful moments in one lasting place.
      </p>
    </div>

    <div className="mt-7 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          What is MyEMemorial?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          MyEMemorial is an online platform for preserving the story of a life.
          You can create a Living MyEMemorial for yourself or someone living,
          or create a Deceased MyEMemorial for someone who has passed.
        </p>
      </div>
<div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
  <h3 className="text-xl font-bold text-stone-900">
    Do I have to create my MyEMemorial all at once?
  </h3>

  <p className="mt-2 text-lg leading-7 text-stone-600">
    No. You can save your progress and return anytime to continue adding
    stories, photos, family history, videos, and other memories. Your
    MyEMemorial can grow over time.
  </p>
</div>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          What is a Living MyEMemorial?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          A Living MyEMemorial lets someone preserve their
          own stories, memories, photos, family history, and
          experiences while they can still help tell the story
          themselves. They can also assign a Designated Person who,
          after independent death verification, can handle permitted
          after-death updates without changing the life story the owner
          preserved.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Can I create a Deceased MyEMemorial for someone who has passed?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. You can create a lasting MyEMemorial that brings together their
          life story, photos, videos, favorite music, family history, obituary
          information, final resting place details, and shared memories.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Is there a Free plan?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. You can start with a Free Memorial and preserve the basic story
          of a life, including a featured photo, life story, and a small photo
          gallery. You can upgrade later if you want additional features.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Can family and friends contribute memories?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. Family and friends can submit memories and media, while the
          MyEMemorial owner controls what is approved and displayed publicly.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          How much does MyEMemorial cost?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          You can start with the Free plan. Paid plans are one-time purchases:
          Basic is $49.95, Plus is $69.95, and Premium is $89.95.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Is there a monthly subscription fee?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          No. Paid MyEMemorial plans are one-time purchases with no recurring
          subscription fee.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Can I upgrade later?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. You can begin with the Free plan or a paid plan and upgrade
          later as you add more photos, videos, stories, and other memories.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Can MyEMemorial be used for a Celebration of Life?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. Basic, Plus, and Premium plans for both Living MyEMemorials and
          MyEMemorials for someone who has passed include a Celebration of Life
          Presentation. It can play approved photos and videos on a television
          or projector for a funeral, memorial service, or Celebration of Life.
          For a Living MyEMemorial, the presentation is intended for use after
          the owner has passed.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Can a MyEMemorial be shared with others?
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. MyEMemorials can be shared with family and friends by link,
          email, text message, social media, and QR code.
        </p>
      </div>
    </div>
  </div>
</section>
            <section className="rounded-[1.5rem] bg-stone-900 px-6 py-7 text-white shadow-sm md:px-8">
  <div className="flex flex-col gap-6 text-center md:text-left">
    <div className="max-w-3xl">
      <p className="text-base font-semibold uppercase tracking-[0.18em] text-stone-300">
        Begin today
      </p>

      <h2 className="mt-2 text-xl font-bold md:text-2xl">
        Every life has a story worth preserving
      </h2>

      <p className="mt-3 text-lg leading-7 text-stone-300">
        Start a MyEMemorial today and continue adding stories, photos,
        memories, and family history over time.
      </p>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <Link
  href="/personal-e-memorials"
  className="flex min-h-[84px] items-center justify-center rounded-full bg-amber-400 px-5 py-3 text-center text-base font-semibold leading-tight text-stone-900 transition hover:bg-amber-300"
>
  <span>
    Explore
    <br />
    Living
    <br />
    MyEMemorials
  </span>
</Link>

<Link
  href="/memorials"
  className="flex min-h-[84px] items-center justify-center rounded-full bg-white px-5 py-3 text-center text-base font-semibold leading-tight text-stone-900 transition hover:bg-stone-200"
>
  <span>
    Explore
    <br />
    Deceased
    <br />
    MyEMemorials
  </span>
</Link>

<Link
  href="/search"
  className="flex min-h-[84px] items-center justify-center rounded-full border border-stone-500 bg-stone-800 px-5 py-3 text-center text-base font-semibold leading-tight text-white transition hover:bg-stone-700"
>
  Search Public MyEMemorials
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

