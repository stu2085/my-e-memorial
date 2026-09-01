import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Digital Legacy: Preserve Your Story for Future Generations | MyEMemorial",
  },
  description:
    "Learn what a digital legacy is and how to preserve your life story, memories, photos, videos, family history, values, and meaningful experiences for future generations.",
  keywords: [
    "digital legacy",
    "living legacy",
    "digital legacy website",
    "family legacy",
    "preserve your legacy",
    "online legacy",
    "legacy website",
    "personal legacy",
    "preserve family memories",
    "preserve life story",
    "family history",
    "future generations",
  ],
  alternates: {
    canonical: "/digital-legacy",
  },
  openGraph: {
    title: "Digital Legacy: Preserve Your Story for Future Generations | MyEMemorial",
    description:
      "A practical guide to digital legacy, living legacy, family memories, life stories, and what you may want to preserve for future generations.",
    url: "/digital-legacy",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Legacy: Preserve Your Story for Future Generations | MyEMemorial",
    description:
      "Learn what a digital legacy is and how to preserve the stories, memories, media, and family history you want future generations to know.",
  },
};

const faqItems = [
  {
    question: "What is a digital legacy?",
    answer:
      "A digital legacy is the collection of stories, memories, photographs, videos, family information, values, accomplishments, and other digital material that helps preserve how a person's life is remembered.",
  },
  {
    question: "What is a living legacy?",
    answer:
      "A living legacy is the story, memories, values, and information a person intentionally preserves while they are still living, so they can explain their experiences in their own words.",
  },
  {
    question: "What should I include in my digital legacy?",
    answer:
      "You may want to include your life story, family history, photographs, videos, favorite music, places lived and worked, schools, accomplishments, traditions, important relationships, lessons learned, and messages you want family to remember.",
  },
  {
    question: "Is a digital legacy the same as social media?",
    answer:
      "No. Social media accounts may contain pieces of a person's life, but a dedicated digital legacy can organize the stories, memories, family history, media, and meaningful information around the person rather than around a changing social feed.",
  },
  {
    question: "When should I start preserving my digital legacy?",
    answer:
      "There is no required age or life stage. Starting while you are able to tell the stories yourself gives you time to add context, correct details, identify photographs, and build the record gradually.",
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
      name: "Digital Legacy",
      item: "https://www.myememorial.com/digital-legacy",
    },
  ],
};

export default function DigitalLegacyPage() {
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
              Your Story. Your Legacy.
            </p>

            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              What Is a Digital Legacy?
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              A digital legacy can preserve the stories, photographs, videos, family
              history, values, accomplishments, and memories that help future
              generations understand not only that you lived, but how you lived.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Explore Living MyEMemorials
              </Link>

              <Link
                href="/preserve-your-life-story"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Preserve Your Life Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              A Digital Legacy Is More Than a Collection of Files
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Most people already leave pieces of their lives in digital form:
              photographs on phones, videos on computers, posts on social media,
              documents in cloud storage, and messages scattered across different
              services.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A meaningful digital legacy brings the important pieces together with
              context. Instead of leaving future generations to guess who appears in a
              photograph or why an event mattered, you can connect those memories to
              the story of your life.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Can Be Part of a Digital Legacy?
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[
                [
                  "Your Life Story",
                  "The experiences, turning points, challenges, successes, relationships, and memories you want preserved in your own words.",
                ],
                [
                  "Family History",
                  "Parents, grandparents, siblings, children, grandchildren, family relationships, traditions, and stories that connect generations.",
                ],
                [
                  "Photographs",
                  "Family pictures, milestones, everyday moments, vacations, celebrations, and images from different stages of your life.",
                ],
                [
                  "Videos & Recorded Memories",
                  "Video Memories can preserve your voice, expressions, personality, and stories in ways that written words alone cannot.",
                ],
                [
                  "Music & Meaningful Media",
                  "Favorite songs and other media can help connect memories with the people, places, and moments that mattered to you.",
                ],
                [
                  "Life Details & Accomplishments",
                  "Places lived and worked, education, awards, accomplishments, organizations, newspaper articles, and other parts of your history.",
                ],
                [
                  "Values & Lessons",
                  "Advice, beliefs, traditions, lessons learned, and messages you want children, grandchildren, and future family members to know.",
                ],
                [
                  "The Context Behind the Memories",
                  "Names, dates, places, captions, and explanations that keep family photographs and stories from losing their meaning over time.",
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
              Digital Legacy vs. Social Media
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Social media can contain important photographs, videos, comments, and
              memories, but it was not designed to tell the complete story of a life.
              Posts appear in chronological feeds, platforms change, and meaningful
              content can become difficult to locate.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A dedicated legacy website can organize the information around you and
              your story. Family history, life chapters, photographs, videos, music,
              accomplishments, and memories can be connected instead of remaining
              scattered across unrelated accounts.
            </p>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              What Is a Living Legacy?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              A living legacy is created intentionally while you are still here to tell
              the story. That matters because you can explain what happened, why it
              mattered, who the people were, and what you learned from the experience.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              It also gives you control over how your story is preserved. Instead of
              relying entirely on what other people remember later, you can record the
              parts of your life you consider important and put them in your own words.
            </p>

            <Link
              href="/preserve-your-life-story"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-amber-400 px-6 text-base font-bold text-stone-900 transition hover:bg-amber-300"
            >
              Learn How to Preserve Your Life Story
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Why Context Matters to Future Generations
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Families often inherit boxes of photographs or folders of digital images
              without enough information to understand them. Over time, names are
              forgotten, locations become uncertain, and the stories behind important
              moments disappear.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A digital legacy can connect the photograph to the people, the place, the
              date, and the memory behind it. That context can turn an unidentified
              family image into a story that still makes sense several generations
              later.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              You Can Build Your Legacy Gradually
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Preserving a digital legacy does not require finishing your entire life
              story at once. You can begin with one memory, one photograph, one family
              branch, or one chapter and continue adding to it over time.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Identify people in old photographs",
                "Write down a childhood memory",
                "Record a Video Memory",
                "Add your parents and grandparents",
                "Preserve the story of your career",
                "Explain a family tradition",
                "Add favorite songs and what they mean to you",
                "Record advice or lessons you want remembered",
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
              How a Living MyEMemorial Can Become Part of Your Digital Legacy
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A Living MyEMemorial gives you a guided place to organize many parts of
              your life story while you are living. You can preserve written stories,
              family history, photographs, Video Memories, favorite music, places,
              accomplishments, and other information you want remembered.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              The purpose is not simply to store files. It is to connect those files
              and memories to the story of your life so the people who come after you
              can understand what they mean.
            </p>

            <Link
              href="/personal-e-memorials"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-blue-950 px-6 text-base font-bold text-white transition hover:bg-blue-900"
            >
              Explore Living MyEMemorials
            </Link>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              A Digital Legacy Can Be a Gift, Too
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              A parent or grandparent may have stories the family wants preserved but
              may never think to create a place for them. Giving a Living MyEMemorial
              can be a way of saying that their memories and experiences are worth
              recording.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              The gift gives them the opportunity to tell those stories themselves,
              rather than leaving the family to reconstruct them later.
            </p>

            <Link
              href="/gift?type=personal"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-amber-400 px-6 text-base font-bold text-stone-900 transition hover:bg-amber-300"
            >
              Give a Living MyEMemorial
            </Link>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Frequently Asked Questions About Digital Legacy
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
              Preserve What You Want Future Generations to Know
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Your digital legacy can be more than a collection of files. Preserve the
              stories, people, photographs, videos, values, and memories that give
              those files meaning.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Explore Living MyEMemorials
              </Link>

              <Link
                href="/preserve-your-life-story"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Preserve Your Life Story
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
