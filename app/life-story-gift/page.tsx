import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Life Story Gift for Parents & Grandparents | MyEMemorial",
  },
  description:
    "Give a meaningful life story gift that helps a parent, grandparent, spouse, or loved one preserve their memories, photos, videos, family history, and life experiences in their own words.",
  keywords: [
    "life story gift",
    "meaningful gift for parents",
    "gift for parents who have everything",
    "gift for grandparents",
    "preserve parents stories",
    "family legacy gift",
    "memory gift",
    "story gift",
    "gift to preserve memories",
    "gift for dad",
    "gift for mom",
    "gift for grandparents who have everything",
  ],
  alternates: {
    canonical: "/life-story-gift",
  },
  openGraph: {
    title: "Life Story Gift for Parents & Grandparents | MyEMemorial",
    description:
      "Give someone you love a place to preserve their life story, memories, photos, videos, family history, and experiences in their own words.",
    url: "/life-story-gift",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Story Gift for Parents & Grandparents | MyEMemorial",
    description:
      "A meaningful gift that gives parents, grandparents, and loved ones a place to preserve their own story.",
  },
};

const faqItems = [
  {
    question: "What is a life story gift?",
    answer:
      "A life story gift gives someone a way to preserve their memories, experiences, family history, photographs, videos, values, and important stories so the people they love can understand their life in their own words.",
  },
  {
    question: "Who is a life story gift good for?",
    answer:
      "A life story gift can be meaningful for a parent, grandparent, spouse, relative, mentor, or anyone whose memories and experiences you want to help preserve.",
  },
  {
    question: "Why give a life story gift instead of another physical gift?",
    answer:
      "A life story gift focuses on memories and legacy rather than another object. It gives the recipient a place to preserve stories that might otherwise be forgotten or lost over time.",
  },
  {
    question: "Can I give a MyEMemorial as a gift?",
    answer:
      "Yes. A Living MyEMemorial can be purchased as a gift for someone who is living so they can preserve their own life story and memories.",
  },
  {
    question: "Can the recipient build their story over time?",
    answer:
      "Yes. The recipient can add to their life story gradually, including memories, photographs, videos, family history, places lived and worked, favorite music, and other details over time.",
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
      name: "Life Story Gift",
      item: "https://www.myememorial.com/life-story-gift",
    },
  ],
};

export default function LifeStoryGiftPage() {
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
              A Gift That Preserves a Life
            </p>

            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Give the Gift of Their Life Story
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              Instead of giving another object, give someone you love a place to
              preserve the memories, photographs, videos, family history, values, and
              stories that only they can tell.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/gift?type=personal"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Give a Living MyEMemorial
              </Link>

              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Explore Living MyEMemorials
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Why a Life Story Can Be a Meaningful Gift
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Parents and grandparents often have decades of memories that younger
              family members have never heard. There may be childhood stories, family
              traditions, first jobs, moves, friendships, military service, career
              experiences, vacations, challenges, accomplishments, and everyday
              moments that were never written down.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A life story gift gives the recipient a reason and a place to begin
              preserving those memories while they can still explain them in their own
              words.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              A Gift for Parents Who Already Have Everything
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Finding a meaningful gift for parents or grandparents can become harder
              over time. They may already have the things they need, and another
              physical item may not feel especially personal.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A life story gift is different because its value comes from the memories
              it helps preserve. The finished story can become meaningful not only to
              the recipient, but also to children, grandchildren, relatives, and future
              generations.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Could They Preserve?
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[
                [
                  "Childhood Memories",
                  "Stories about parents, grandparents, siblings, neighborhoods, school years, traditions, and the experiences that shaped them.",
                ],
                [
                  "Family History",
                  "Names, relationships, family branches, stories about earlier generations, and details that might otherwise be lost.",
                ],
                [
                  "Photos",
                  "Family photographs, vacations, milestones, celebrations, work memories, and everyday moments from different stages of life.",
                ],
                [
                  "Video Memories",
                  "Recorded stories and memories that preserve a person's voice, expressions, personality, and way of telling a story.",
                ],
                [
                  "Favorite Music",
                  "Songs associated with important people, places, eras, relationships, and memories.",
                ],
                [
                  "Life Experiences",
                  "Places lived and worked, education, accomplishments, awards, challenges, lessons learned, friendships, and turning points.",
                ],
                [
                  "Values & Advice",
                  "Beliefs, traditions, advice, life lessons, and the things they want children and grandchildren to remember.",
                ],
                [
                  "Stories Only They Know",
                  "The small details and personal memories that may never appear in official records, photo captions, or family documents.",
                ],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                >
                  <h3 className="text-xl font-bold text-stone-900">{title}</h3>
                  <p className="mt-2 text-base leading-7 text-stone-700">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              Good Occasions for a Life Story Gift
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Birthday",
                "Mother's Day",
                "Father's Day",
                "Grandparents Day",
                "Christmas or the holidays",
                "Anniversary",
                "Retirement",
                "Milestone birthday",
                "Family reunion",
                "A meaningful just-because gift",
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
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              A Life Story Gift for Dad
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A father may have stories about his childhood, first car, military
              service, career, friendships, travels, family traditions, mistakes,
              successes, and lessons that his children have never heard in full.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Giving Dad a place to preserve those stories can turn a birthday,
              Father&apos;s Day, retirement, or holiday gift into something the entire
              family may value for years.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              A Life Story Gift for Mom
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A mother&apos;s story may include family traditions, childhood memories,
              friendships, work, travel, raising a family, accomplishments, challenges,
              recipes, celebrations, and stories connected to generations of family
              photographs.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A life story gift gives Mom a place to preserve those memories with the
              context only she can provide.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              A Life Story Gift for Grandparents
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Grandparents often connect multiple generations of family history. They
              may remember relatives younger family members never met, places that have
              changed, traditions whose origins are becoming unclear, and stories that
              exist nowhere else.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Helping a grandparent preserve those memories can create a family record
              that children and grandchildren can return to later.
            </p>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              How the MyEMemorial Gift Works
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                  1
                </div>
                <h3 className="mt-4 text-xl font-bold">Choose a Plan</h3>
                <p className="mt-2 text-base leading-7 text-stone-200">
                  Choose the Living MyEMemorial plan you want to give.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                  2
                </div>
                <h3 className="mt-4 text-xl font-bold">Personalize the Gift</h3>
                <p className="mt-2 text-base leading-7 text-stone-200">
                  Enter the purchaser and recipient information and add a personal
                  message.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                  3
                </div>
                <h3 className="mt-4 text-xl font-bold">They Preserve Their Story</h3>
                <p className="mt-2 text-base leading-7 text-stone-200">
                  The recipient claims the gift and begins building their own Living
                  MyEMemorial.
                </p>
              </div>
            </div>

            <Link
              href="/gift?type=personal"
              className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-full bg-amber-400 px-6 text-base font-bold text-stone-900 transition hover:bg-amber-300"
            >
              Give a Living MyEMemorial
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              The Gift Does Not Have to Be Finished Immediately
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Telling a life story can happen gradually. The recipient can begin with
              basic information or one memory and continue adding stories, photographs,
              videos, family history, favorite music, and other details as time allows.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              That makes the gift less like a one-time activity and more like an
              ongoing opportunity to preserve memories that might otherwise remain
              scattered or untold.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Life Story, Living Legacy, and Digital Legacy
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A life story gift can become part of a larger living or digital legacy.
              The recipient is not only recording events. They can preserve the
              meaning behind photographs, the people connected to family history, the
              lessons behind important experiences, and the values they want future
              generations to understand.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/preserve-your-life-story"
                className="inline-flex min-h-[52px] w-full max-w-[300px] items-center justify-center rounded-full bg-white px-6 text-center text-base font-bold text-stone-900 shadow-sm transition hover:bg-stone-100"
              >
                Preserve Your Life Story
              </Link>

              <Link
                href="/digital-legacy"
                className="inline-flex min-h-[52px] w-full max-w-[300px] items-center justify-center rounded-full bg-white px-6 text-center text-base font-bold text-stone-900 shadow-sm transition hover:bg-stone-100"
              >
                Learn About Digital Legacy
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Frequently Asked Questions About Life Story Gifts
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
              Give a Gift Their Family Can Keep Coming Back To
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Give someone you love a place to preserve the stories, memories,
              photographs, videos, family history, and experiences only they can tell.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/gift?type=personal"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Give a Living MyEMemorial
              </Link>

              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                View Living Plans
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
