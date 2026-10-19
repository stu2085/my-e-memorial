"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SideAd from "./components/SideAd";
import MobileAd from "./components/MobileAd";
import MemorialStartForm from "./components/MemorialStartForm";

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
    <main className="home-sky min-h-screen">
      <section className="px-4 py-7 text-center md:px-8 md:py-9">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white/90 p-5 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-5xl">
            Create an Online Memorial Website for Your Loved One
          </h1>
          <p className="mx-auto mt-3 max-w-4xl text-lg leading-8 text-stone-700 md:text-xl">
            Share their life story,
            photos, videos, and music, and give family and friends a place to
            cherish their memories together.
          </p>
          <MemorialStartForm source="home" />
          <Link href="/memorial/daniel-james-whitmore" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-base font-semibold text-blue-950 hover:bg-blue-50">
            Experience a Sample MyEMemorial
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 md:px-8">
        {/*
          TOP AD ZONE
          The first pair of desktop advertisers stays sticky only while the
          visitor is in the introduction / choice area. This containing grid
          ends before "Built for families", so those ads naturally unstick
          when the visitor reaches that section.
        */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
          <aside className="hidden self-stretch lg:block">
            <div className="sticky top-28">
              <SideAd
                pageType="home"
                memorialZip={visitorZip}
                forcedCategory="attorney"
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
<section className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-950 md:text-base">
        Choose Your MyEMemorial
      </p>

      <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
        Choose the Online Memorial You Want to Create
      </h2>

      <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
        Remember someone who has passed, or preserve your own story with a Living MyEMemorial.
      </p>
    </div>

    <div className="mt-7 grid gap-5">
      {/* MyEMemorial for someone who has passed */}
      <div className="flex flex-col rounded-3xl border border-[#d6ded3] bg-[#edf2e9] p-7 text-center text-stone-900 shadow-sm md:p-8">
        <div className="text-4xl">{"\uD83D\uDD4A\uFE0F"}</div>

        <h3 className="mt-4 text-2xl font-bold md:text-3xl">
          MyEMemorials
        </h3>

        <p className="mt-2 text-base font-semibold text-stone-700 md:text-lg">
          For those who have passed
        </p>

        <p className="mt-2 text-base font-semibold text-stone-700 md:text-lg">
          Preserve and share their life story
        </p>

        <details className="mt-4 text-left">
          <summary className="cursor-pointer py-3 text-base font-semibold">What can I include?</summary>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          Bring together their stories, photos, videos, favorite music,
          family history, and meaningful memories in one lasting place.
          Paid plans also include a Celebration of Life Presentation for
          sharing approved photos and videos at a funeral or memorial service.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          Family and friends can remember, contribute, and help preserve their
          story for future generations.
        </p>

        </details>

        <div className="mt-auto pt-6">
          <Link
            href="/memorials"
            className="inline-flex min-h-[64px] w-full max-w-[390px] items-center justify-center rounded-full bg-white px-4 py-3 text-center text-base font-bold leading-tight text-stone-900 transition hover:bg-stone-200"
          >
            Explore MyEMemorials & Pricing
          </Link>
        </div>
      </div>
      {/* Living MyEMemorial */}
      <div className="flex flex-col rounded-3xl border border-amber-200 bg-amber-50 p-7 text-center shadow-sm md:p-8">
        <div className="text-4xl">{"\u2764\uFE0F"}</div>

        <h3 className="mt-4 text-2xl font-bold text-stone-900 md:text-3xl">
          Living MyEMemorials
        </h3>

        <p className="mt-2 text-base font-semibold text-stone-600 md:text-lg">
          For those still here who want to tell their own story
        </p>

        <details className="mt-4 text-left">
          <summary className="cursor-pointer py-3 text-base font-semibold">What can I include?</summary>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          Preserve stories, memories, photos, family history, and experiences
          while the person can still help tell the story themselves.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          Paid plans also include a Celebration of Life Presentation for use
          after the member has passed, so approved photos and videos can be shared
          at a funeral, memorial service, or Celebration of Life.
        </p>

        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-stone-700 md:text-lg">
          After independent death verification, an authorized Designated Person can
          handle permitted after-death updates without changing the life story
          you preserved.
        </p>

        </details>

        <div className="mt-auto pt-6">
          <Link
            href="/personal-e-memorials"
            className="inline-flex min-h-[64px] w-full max-w-[390px] items-center justify-center rounded-full bg-[#e6cda2] px-4 py-3 text-center text-base font-bold leading-tight text-stone-900 transition hover:bg-[#dbc08e]"
          >
            Explore Living MyEMemorials & Pricing
          </Link>
        </div>
      </div>


    </div>
    <div className="mt-6 rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
      <h3 className="text-2xl font-bold text-stone-900">Need only a Celebration of Life Presentation?</h3>
      <details className="mt-3 text-left"><summary className="cursor-pointer py-2 text-base font-semibold">What the $29.95 standalone presentation includes</summary>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-stone-700">Create a standalone presentation with photos, videos, and music. One-time $29.95 purchase includes a shareable presentation hosted for 60 days. Paid MyEMemorial plans already include their own presentation.</p>
      <p className="mx-auto mt-2 max-w-2xl text-base text-stone-700">If you later buy a paid MyEMemorial, apply your single-use $29.95 credit code at checkout.</p>
      </details>
      <Link href="/celebration-of-life-presentation" className="mt-5 inline-flex min-h-14 items-center justify-center rounded-full bg-blue-950 px-7 py-3 text-base font-bold text-white hover:bg-blue-900">Explore the Standalone Presentation</Link>
      <div className="mt-4">
        <Link
          href="/memorial-slideshow-maker"
          className="text-base font-bold text-blue-950 underline underline-offset-4"
        >
          Memorial Slideshow Maker
        </Link>
      </div>
    </div>
  </div>
</section>

          </div>

          <aside className="hidden self-stretch lg:block">
            <div className="sticky top-28">
              <SideAd
                pageType="home"
                memorialZip={visitorZip}
                forcedCategory="funeral_home"
              />
            </div>
          </aside>
        </div>

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


        {/*
          LOWER AD ZONE
          A fresh pair of advertisers begins at "Built for families". This
          gives the lower advertisers their own sticky exposure instead of
          leaving the first pair fixed beside the entire page.
        */}
        <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
          <aside className="hidden self-stretch lg:block">
            <div className="sticky top-28">
              <SideAd
                pageType="home"
                memorialZip={visitorZip}
                forcedCategory="estate_planner"
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
<details className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <summary className="cursor-pointer py-2 text-xl font-bold text-stone-900">How your family stays in control</summary>
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-base font-semibold uppercase tracking-[0.18em] text-stone-500">
        Built for families
      </p>

      <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
        A Memorial Page Your Family Controls
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-lg leading-7 text-stone-700">
  Preserve stories, memories, photos, videos, and family history in one online
  memorial page &mdash; whether you are telling your own story or remembering
  someone who has passed.
</p>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">{"\uD83D\uDD12"}</div>

        <h3 className="mt-3 text-xl font-bold text-stone-900">
          You stay in control
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          MyEMemorial members control updates, stories, photos, videos, music,
          family information, and other details added to the MyEMemorial.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">{"\u2705"}</div>

        <h3 className="text-xl font-bold text-stone-900">
          Family and friends can contribute
        </h3>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Invite family and friends to share memories and media while you
          retain approval over what becomes part of the public MyEMemorial.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
        <div className="text-2xl">{"\uD83C\uDF33"}</div>

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
</details>


<details className="rounded-[1.5rem] bg-white/95 p-6 shadow-sm md:p-8">
  <summary className="cursor-pointer py-2 text-xl font-bold text-stone-900">Helpful memorial and life story guides</summary>
  <div className="mx-auto max-w-6xl">
    <div className="text-center">
      <p className="text-base font-semibold uppercase tracking-[0.18em] text-stone-500">
        Helpful Guides
      </p>

      <h2 className="mt-2 text-2xl font-bold text-stone-900 md:text-3xl">
        Explore Memorial, Life Story &amp; Legacy Guides
      </h2>

      <p className="mx-auto mt-3 max-w-3xl text-lg leading-7 text-stone-700">
        Learn more about online memorial websites, preserving a life story, digital
        legacy, and meaningful ways to help someone you love preserve their memories.
      </p>
    </div>

    <div className="mt-7 grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Online Memorials &amp; Memorial Websites
        </h3>
        <div className="mt-4 grid gap-3">
          <Link
            href="/memorial-websites"
            className="text-lg font-semibold text-blue-950 underline decoration-stone-300 underline-offset-4 hover:decoration-blue-950"
          >
            Memorial Websites: What They Are &amp; What to Look For
          </Link>
          <Link
            href="/what-is-an-online-memorial"
            className="text-lg font-semibold text-blue-950 underline decoration-stone-300 underline-offset-4 hover:decoration-blue-950"
          >
            What Is an Online Memorial?
          </Link>
          <Link
            href="/create-an-online-memorial"
            className="text-lg font-semibold text-blue-950 underline decoration-stone-300 underline-offset-4 hover:decoration-blue-950"
          >
            How to Create an Online Memorial
          </Link>
          <Link
            href="/online-memorial-vs-obituary"
            className="text-lg font-semibold text-blue-950 underline decoration-stone-300 underline-offset-4 hover:decoration-blue-950"
          >
            Online Memorial vs. Obituary
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-xl font-bold text-stone-900">
          Life Stories, Legacy &amp; Meaningful Gifts
        </h3>
        <div className="mt-4 grid gap-3">
          <Link
            href="/preserve-your-life-story"
            className="text-lg font-semibold text-blue-950 underline decoration-amber-300 underline-offset-4 hover:decoration-blue-950"
          >
            Preserve Your Life Story
          </Link>
          <Link
            href="/digital-legacy"
            className="text-lg font-semibold text-blue-950 underline decoration-amber-300 underline-offset-4 hover:decoration-blue-950"
          >
            What Is a Digital Legacy?
          </Link>
          <Link
            href="/life-story-gift"
            className="text-lg font-semibold text-blue-950 underline decoration-amber-300 underline-offset-4 hover:decoration-blue-950"
          >
            Give the Gift of a Life Story
          </Link>
          <Link
            href="/meaningful-gifts-for-parents"
            className="text-lg font-semibold text-blue-950 underline decoration-amber-300 underline-offset-4 hover:decoration-blue-950"
          >
            Meaningful Gifts for Parents Who Have Everything
          </Link>
        </div>
      </div>
    </div>
  </div>
</details>


  <details className="rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm md:px-8">
  <summary className="cursor-pointer py-2 text-xl font-bold text-stone-900">The story behind MyEMemorial</summary>
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
    the creation of MyEMemorial &mdash; a place where future generations can truly
    know and remember the people who came before them.
  </p>

  <Link
    href="/our-story"
    className="mt-8 inline-flex rounded-full bg-blue-950 px-6 py-3 text-lg leading-7 font-semibold text-white hover:bg-blue-900"
  >
    Read Our Story
  </Link>
  </div>
</details>
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
      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          What is MyEMemorial?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          MyEMemorial is an online memorial website for preserving and sharing
          the story of a life. You can create a Living MyEMemorial for yourself
          or someone living, or create a MyEMemorial for someone who
          has passed.
        </p>
      </details>
<details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
    Do I have to create my MyEMemorial all at once?
  </summary>

  <p className="mt-2 text-lg leading-7 text-stone-600">
    No. You can save your progress and return anytime to continue adding
    stories, photos, family history, videos, and other memories. Your
    MyEMemorial can grow over time.
  </p>
</details>
      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          What is a Living MyEMemorial?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          A Living MyEMemorial lets someone preserve their
          own stories, memories, photos, family history, and
          experiences while they can still help tell the story
          themselves. They can also assign a Designated Person who,
          after independent death verification, can handle permitted
          after-death updates without changing the life story the member
          preserved.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Can I create a MyEMemorial for someone who has passed?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. You can create a lasting MyEMemorial that brings together their
          life story, photos, videos, favorite music, family history, obituary
          information, final resting place details, and shared memories.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Is there a Free plan?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. You can start with a Free MyEMemorial and preserve the basic story
          of a life, including a featured photo, life story, and a small photo
          gallery. You can upgrade later if you want additional features.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Can family and friends contribute memories?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. Family and friends can submit memories and media, while the
          MyEMemorial member controls what is approved and displayed publicly.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          How much does MyEMemorial cost?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          You can start with the Free plan. Paid plans are one-time purchases:
          Basic is $49.95, Plus is $69.95, and Premium is $89.95.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Is there a monthly subscription fee?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          No. Paid MyEMemorial plans are one-time purchases with no recurring
          subscription fee.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Can I upgrade later?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. You can begin with the Free plan or a paid plan and upgrade
          later as you add more photos, videos, stories, and other memories.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Can MyEMemorial be used for a Celebration of Life?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. Basic, Plus, and Premium plans for both Living MyEMemorials and MyEMemorials include a Celebration of Life
          Presentation. It can play approved photos and videos on a television
          or projector for a funeral, memorial service, or Celebration of Life.
          For a Living MyEMemorial, the presentation is intended for use after
          the owner has passed.
        </p>
      </details>

      <details className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
<summary className="cursor-pointer text-xl font-bold text-stone-900">
          Can a MyEMemorial be shared with others?
        </summary>

        <p className="mt-2 text-lg leading-7 text-stone-600">
          Yes. MyEMemorials can be shared with family and friends by link,
          email, text message, social media, and QR code.
        </p>
      </details>
    </div>
  </div>
</section>
            <section className="rounded-[1.5rem] bg-[#edf2e9] px-6 py-7 text-stone-900 shadow-sm md:px-8">
  <div className="flex flex-col gap-6 text-center md:text-left">
    <div className="max-w-3xl">
      <p className="text-base font-semibold uppercase tracking-[0.18em] text-stone-700">
        Begin today
      </p>

      <h2 className="mt-2 text-xl font-bold md:text-2xl">
        Create an Online Memorial Today
      </h2>

      <p className="mt-3 text-lg leading-7 text-stone-700">
        Start a memorial page today and continue adding stories, photos,
        memories, videos, and family history over time.
      </p>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
<Link
  href="/memorials"
  className="flex min-h-[84px] items-center justify-center rounded-full bg-white px-5 py-3 text-center text-base font-semibold leading-tight text-stone-900 transition hover:bg-stone-200"
>
  <span>Explore MyEMemorials</span>
</Link>

      <Link
  href="/personal-e-memorials"
  className="flex min-h-[84px] items-center justify-center rounded-full bg-[#e6cda2] px-5 py-3 text-center text-base font-semibold leading-tight text-stone-900 transition hover:bg-[#dbc08e]"
>
  <span>Explore<br />Living<br />MyEMemorials</span>
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

          <aside className="hidden self-stretch lg:block">
            <div className="sticky top-28">
              <SideAd
                pageType="home"
                memorialZip={visitorZip}
                forcedCategory="monument_company"
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
