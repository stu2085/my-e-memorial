import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Create an Online Memorial Website for a Loved One | MyEMemorial",
  },
  description:
    "Learn how to create an online memorial website for someone you love. Preserve their life story, photos, videos, music, family history, obituary information, and memories in one shareable place.",
  keywords: [
    "create an online memorial",
    "create a memorial website",
    "make a memorial website",
    "build a memorial website",
    "memorial website for a loved one",
    "create a memorial page",
    "online memorial website",
    "online memorial",
    "memorial page",
    "digital memorial",
    "virtual memorial",
  ],
  alternates: {
    canonical: "/create-an-online-memorial",
  },
  openGraph: {
    title: "Create an Online Memorial Website for a Loved One | MyEMemorial",
    description:
      "A step-by-step guide to creating an online memorial that preserves a loved one's story, photos, videos, music, family history, and memories.",
    url: "/create-an-online-memorial",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create an Online Memorial Website for a Loved One | MyEMemorial",
    description:
      "Learn how to create an online memorial and preserve a loved one's story in one lasting, shareable place.",
  },
};

const faqItems = [
  {
    question: "How do I create an online memorial?",
    answer:
      "Choose an online memorial service, create the memorial for the person you want to remember, add their life story and meaningful details, upload photographs or other media, and then publish and share the memorial when you are ready.",
  },
  {
    question: "What information should I gather before creating a memorial website?",
    answer:
      "Helpful materials can include the person's full name, birth and death information, photographs, important life stories, family relationships, places lived and worked, schools, awards, favorite music, videos, obituary information, and final resting place details.",
  },
  {
    question: "Can I start an online memorial before I have everything ready?",
    answer:
      "Yes. A memorial can be built over time. You can begin with the basic information and life story, then add photographs, videos, music, family history, and other memories as they are collected.",
  },
  {
    question: "Can family and friends help build the memorial?",
    answer:
      "Depending on the memorial service, family and friends may be able to submit written memories, photographs, or videos. The memorial owner can retain control over what is published.",
  },
  {
    question: "Does creating an online memorial require technical skills?",
    answer:
      "A modern memorial website should guide you through the process without requiring you to build a website or write code. The memorial service provides the structure while you provide the person's story and memories.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.myememorial.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Create an Online Memorial",
      item: "https://www.myememorial.com/create-an-online-memorial",
    },
  ],
};

export default function CreateAnOnlineMemorialPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] bg-blue-950 px-6 py-10 text-center text-white shadow-sm md:px-10 md:py-14">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-300">
              Online Memorial Guide
            </p>

            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Create an Online Memorial Website for Someone You Love
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              An online memorial can preserve far more than dates and an obituary.
              Bring together their life story, photographs, videos, favorite music,
              family history, and meaningful memories in one lasting place that family
              and friends can visit and share.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials#pricing"
                className="inline-flex min-h-[56px] w-full max-w-[310px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Start an Online Memorial
              </Link>

              <Link
                href="/memorial/daniel-james-whitmore"
                className="inline-flex min-h-[56px] w-full max-w-[310px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Experience a Sample MyEMemorial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              How to Create an Online Memorial
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Creating a memorial website does not require web-design experience. The
              memorial service provides the structure, and you build the memorial by
              adding the stories, photographs, videos, music, relationships, and life
              details you want preserved.
            </p>

            <div className="mt-7 space-y-5">
              {[
                [
                  "1",
                  "Choose the Person You Want to Remember",
                  "Begin with the person's name and basic information. You do not need to have every story, photograph, or detail ready before you start.",
                ],
                [
                  "2",
                  "Tell Their Life Story",
                  "Preserve the experiences, relationships, accomplishments, personality, traditions, and moments that made their life uniquely theirs.",
                ],
                [
                  "3",
                  "Add Photos, Videos and Meaningful Media",
                  "Bring the story to life with photographs, Video Memories, favorite music, captions, and other media that family members will recognize and value.",
                ],
                [
                  "4",
                  "Add Family History and Important Life Details",
                  "Record family relationships, places lived and worked, schools, awards, social links, obituary information, and final resting place details when appropriate.",
                ],
                [
                  "5",
                  "Review, Publish and Share",
                  "Review the memorial, publish it when you are comfortable, and share the web address with family and friends so they can visit the memorial.",
                ],
              ].map(([number, title, copy]) => (
                <div
                  key={number}
                  className="grid gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:grid-cols-[56px_1fr]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-950 text-xl font-bold text-white">
                    {number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{title}</h3>
                    <p className="mt-2 text-base leading-7 text-stone-700">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Should You Gather Before You Start?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              You can begin an online memorial with very little and add more later.
              Still, gathering a few items ahead of time can make it easier to build a
              complete picture of the person&apos;s life.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Full name and important dates",
                "A featured photograph",
                "Favorite family photographs",
                "Stories and personal memories",
                "Family relationships and history",
                "Places they lived and worked",
                "Schools, awards and accomplishments",
                "Favorite songs or meaningful music",
                "Videos or recorded memories",
                "Obituary information",
                "Final resting place information",
                "Stories and media held by relatives or friends",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-base font-semibold leading-7 text-stone-800"
                >
                  <span className="font-bold text-blue-950">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              You Do Not Have to Finish the Memorial in One Sitting
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Families often discover additional photographs, stories, dates, videos,
              and documents after they begin. A memorial website can be developed over
              time instead of forcing you to collect everything at once.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Starting with the life story and a few photographs can also help other
              relatives remember details they want to contribute. Building the
              memorial can become a family effort rather than a single person trying to
              remember every part of a life.
            </p>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              What Can You Put on a MyEMemorial?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              A Departed MyEMemorial is designed to preserve the story between the
              dates. Depending on the plan, families can preserve many different parts
              of a person&apos;s life in one shareable memorial website.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Life story",
                "Featured photo and photo gallery",
                "Video Memories",
                "Favorite music",
                "Family history",
                "Places lived and worked",
                "Schools and awards",
                "Social media links",
                "Newspaper articles",
                "Obituary information",
                "Final resting place details",
                "Stories, photos and videos submitted by family and friends",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 text-base font-semibold leading-7"
                >
                  <span className="font-bold text-amber-300">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/memorials"
              className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-full bg-amber-400 px-6 text-base font-bold text-stone-900 transition hover:bg-amber-300"
            >
              See MyEMemorial Features & Plans
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Can Family and Friends Contribute?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              One person rarely has every photograph or every story. A cousin may
              remember childhood moments, a former coworker may have work photographs,
              and a friend may remember a story the immediate family has never heard.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              MyEMemorial allows family and friends to submit written stories,
              photographs, and videos for review. This helps the memorial grow while
              allowing the memorial owner to control what becomes part of the public
              story.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Should You Use a Memorial Website or Just Social Media?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Social media can help notify friends and collect immediate condolences,
              but posts can become difficult to find over time. A dedicated memorial
              website gives the person&apos;s story its own destination and organizes
              the memories around the person instead of a constantly changing social
              feed.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/what-is-an-online-memorial"
                className="inline-flex min-h-[52px] w-full max-w-[300px] items-center justify-center rounded-full bg-white px-6 text-center text-base font-bold text-stone-900 shadow-sm transition hover:bg-stone-100"
              >
                What Is an Online Memorial?
              </Link>

              <Link
                href="/memorial-websites"
                className="inline-flex min-h-[52px] w-full max-w-[300px] items-center justify-center rounded-full bg-white px-6 text-center text-base font-bold text-stone-900 shadow-sm transition hover:bg-stone-100"
              >
                Memorial Website Guide
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Can You Create a Memorial Website for Free?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              MyEMemorial offers a Free Departed MyEMemorial so a family can begin
              preserving basic information, a life story, and a limited photo gallery.
              If the family later wants more photographs, Video Memories, favorite
              music, family history, or other paid features, the memorial can be
              upgraded.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Basic, Plus, and Premium Departed MyEMemorial plans use one-time
              payments rather than recurring subscription fees.
            </p>

            <Link
              href="/memorials#pricing"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-stone-900 px-6 text-base font-bold text-white transition hover:bg-stone-700"
            >
              Compare Memorial Plans
            </Link>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Frequently Asked Questions About Creating an Online Memorial
            </h2>

            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <summary className="cursor-pointer text-lg font-bold text-stone-900">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-base leading-7 text-stone-700">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-center shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Start Preserving Their Story
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Start free or choose the MyEMemorial plan that gives your family the
              space and features needed to preserve the stories, photographs, videos,
              music, and memories of someone you love.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/create?mode=memorial&plan=free"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Start Free
              </Link>

              <Link
                href="/memorials#pricing"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Compare Plans
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
