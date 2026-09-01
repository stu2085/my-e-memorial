import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "What Is an Online Memorial? | MyEMemorial",
  },
  description:
    "Learn what an online memorial is, what it can include, how families use memorial websites, and how an online memorial differs from an obituary or social media tribute.",
  keywords: [
    "what is an online memorial",
    "online memorial",
    "online memorials",
    "online memorial site",
    "online memorial website",
    "digital memorial",
    "virtual memorial",
    "memorial page",
    "online tribute",
    "memorial for a loved one",
  ],
  alternates: {
    canonical: "/what-is-an-online-memorial",
  },
  openGraph: {
    title: "What Is an Online Memorial? | MyEMemorial",
    description:
      "A practical explanation of online memorials, what they can preserve, how families use them, and how they differ from traditional obituaries.",
    url: "/what-is-an-online-memorial",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is an Online Memorial? | MyEMemorial",
    description:
      "Learn what an online memorial is and how families can preserve life stories, photos, videos, music, and memories in one place.",
  },
};

const faqItems = [
  {
    question: "What is an online memorial?",
    answer:
      "An online memorial is a dedicated web page or memorial website created to preserve and share the life story, memories, photographs, videos, and other meaningful details of someone who has passed.",
  },
  {
    question: "Who can create an online memorial?",
    answer:
      "Online memorials are commonly created by family members, close friends, or another person who wants to preserve and share the story of someone they love.",
  },
  {
    question: "What can be included in an online memorial?",
    answer:
      "Depending on the service, an online memorial may include a life story, photographs, videos, favorite music, family history, obituary information, places lived and worked, schools, awards, final resting place information, and memories contributed by family and friends.",
  },
  {
    question: "Is an online memorial the same as an obituary?",
    answer:
      "No. An obituary usually summarizes important facts about a person's life and death. An online memorial can preserve a much broader collection of stories, photos, videos, music, family history, and personal memories over time.",
  },
  {
    question: "Can an online memorial be shared with family and friends?",
    answer:
      "Yes. Public online memorials can generally be shared through a direct web link so relatives and friends can visit the memorial from a phone, tablet, or computer.",
  },
  {
    question: "Can family and friends add memories to an online memorial?",
    answer:
      "Some memorial services allow relatives and friends to submit written memories, photos, or videos. The memorial owner may be able to review those contributions before they appear publicly.",
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

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is an Online Memorial?",
  description:
    "A practical guide explaining online memorials, what they can include, how families use them, and how they differ from obituaries.",
  mainEntityOfPage: "https://www.myememorial.com/what-is-an-online-memorial",
  publisher: {
    "@type": "Organization",
    name: "MyEMemorial",
    url: "https://www.myememorial.com/",
  },
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
      name: "What Is an Online Memorial?",
      item: "https://www.myememorial.com/what-is-an-online-memorial",
    },
  ],
};

export default function WhatIsAnOnlineMemorialPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
              What Is an Online Memorial?
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              An online memorial is a dedicated place on the web where family and
              friends can preserve and share the story of someone who has passed —
              including the memories, photographs, videos, music, relationships, and
              experiences that made their life unique.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Explore Online Memorials
              </Link>

              <Link
                href="/memorial-websites"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Memorial Website Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              An Online Place for the Story Behind a Life
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Traditional memorials often focus on a few dates, an obituary, or a
              funeral service. An online memorial can preserve much more. It gives a
              family one web address where the person&apos;s story and meaningful
              memories can remain together instead of being scattered among photo
              albums, phones, social media accounts, old computers, and separate
              family collections.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              An online memorial may also be called a memorial website, digital
              memorial, virtual memorial, memorial page, memorial site, or online
              tribute. The names vary, but the basic purpose is similar: creating a
              lasting digital place to remember a person and preserve what mattered
              about their life.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Can an Online Memorial Include?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Different memorial platforms provide different features. A more complete
              memorial can go beyond a basic tribute page and preserve many parts of a
              person&apos;s life in one place.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[
                [
                  "Life Story",
                  "Stories and experiences that explain who the person was, not just the dates and facts of their life.",
                ],
                [
                  "Photos",
                  "Featured photographs, family pictures, milestones, vacations, celebrations, and everyday moments.",
                ],
                [
                  "Video Memories",
                  "Recorded memories and videos that preserve movement, expressions, voices, and meaningful moments.",
                ],
                [
                  "Favorite Music",
                  "Songs associated with the person, important memories, or meaningful periods of their life.",
                ],
                [
                  "Family History",
                  "Relationships and family information that help future generations understand where they came from.",
                ],
                [
                  "Life Details",
                  "Places lived and worked, schools, awards, accomplishments, interests, and other parts of the person's story.",
                ],
                [
                  "Obituary & Final Resting Information",
                  "Important after-death information can be kept alongside the broader story of the person's life.",
                ],
                [
                  "Memories From Others",
                  "Some memorial websites allow family and friends to contribute written stories, photographs, or videos.",
                ],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <h3 className="text-xl font-bold text-stone-900">{title}</h3>
                  <p className="mt-2 text-base leading-7 text-stone-700">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              How Does an Online Memorial Work?
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-950 text-lg font-bold text-white">
                  1
                </div>
                <h3 className="mt-4 text-xl font-bold text-stone-900">
                  Create the Memorial
                </h3>
                <p className="mt-2 text-base leading-7 text-stone-700">
                  Start a memorial page for the person you want to remember.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-950 text-lg font-bold text-white">
                  2
                </div>
                <h3 className="mt-4 text-xl font-bold text-stone-900">
                  Add Their Story
                </h3>
                <p className="mt-2 text-base leading-7 text-stone-700">
                  Add stories, photographs, videos, music, family history, and other
                  memories you want preserved.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-950 text-lg font-bold text-white">
                  3
                </div>
                <h3 className="mt-4 text-xl font-bold text-stone-900">
                  Share It
                </h3>
                <p className="mt-2 text-base leading-7 text-stone-700">
                  Share the memorial link so relatives and friends can remember the
                  person wherever they live.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              Online Memorial vs. Social Media Tribute
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              Social media can be useful for announcing a death, sharing condolences,
              or posting memories. But those posts can quickly become difficult to
              find as feeds change and new content appears.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              A dedicated online memorial gives the person&apos;s story its own
              permanent destination. Instead of mixing memories into a general social
              feed, a memorial website organizes the life story and related media
              around the person being remembered.
            </p>

            <Link
              href="/memorial-websites"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-base font-bold text-stone-900 transition hover:bg-stone-100"
            >
              Learn More About Memorial Websites
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Is an Online Memorial the Same as an Obituary?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              No. An obituary usually provides a concise summary of a person&apos;s
              life and death and may include funeral or service details. An online
              memorial can preserve the obituary while also giving the family room for
              photographs, videos, music, family history, detailed stories, and
              memories that continue well beyond the original announcement.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              That makes an online memorial useful not only immediately after a loss,
              but also later when children, grandchildren, relatives, and friends want
              to return to the person&apos;s story.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Why Families Create Online Memorials
            </h2>

            <ul className="mt-5 space-y-3 text-lg leading-8 text-stone-700">
              <li>
                <strong>To preserve more than an obituary:</strong> Families can keep
                stories, photos, videos, and meaningful details together.
              </li>
              <li>
                <strong>To make memories easier to share:</strong> Relatives in
                different cities or countries can visit the same memorial online.
              </li>
              <li>
                <strong>To gather memories from others:</strong> Friends and relatives
                may remember stories or have photographs the immediate family does not.
              </li>
              <li>
                <strong>To help future generations:</strong> A memorial can give
                children and grandchildren a richer understanding of the person&apos;s
                life.
              </li>
              <li>
                <strong>To create a lasting place to return to:</strong> Family members
                can revisit the memorial on birthdays, anniversaries, holidays, or
                whenever they want to remember.
              </li>
            </ul>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Is a MyEMemorial?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A Departed MyEMemorial is MyEMemorial&apos;s online memorial for someone
              who has passed. It is designed to preserve the story between the dates —
              combining the person&apos;s life story, photographs, Video Memories,
              favorite music, family history, important life details, obituary
              information, and other memories in one shareable place.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              MyEMemorial also offers a Living MyEMemorial so a person can preserve
              their own story while they are living and decide how they want their life
              to be remembered.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[52px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Explore Departed MyEMemorials
              </Link>

              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[52px] w-full max-w-[300px] items-center justify-center rounded-full border-2 border-stone-300 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Explore Living MyEMemorials
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Frequently Asked Questions About Online Memorials
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
              Preserve the Story of Someone You Love
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              See how a Departed MyEMemorial works, experience a sample, or begin
              preserving a life story, photographs, videos, music, and memories in one
              lasting online memorial.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                View Memorial Plans
              </Link>

              <Link
                href="/memorial/daniel-james-whitmore"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Experience a Sample
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
