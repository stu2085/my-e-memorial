import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Preserve Your Life Story Online | MyEMemorial",
  },
  description:
    "Learn how to preserve your life story online while you can tell it in your own words. Save memories, photos, videos, family history, favorite music, and important life experiences for future generations.",
  keywords: [
    "preserve your life story",
    "preserve my life story",
    "life story website",
    "personal history website",
    "living legacy",
    "preserve memories",
    "record your life story",
    "tell your life story",
    "family history website",
    "digital legacy",
    "life story online",
    "legacy website",
  ],
  alternates: {
    canonical: "/preserve-your-life-story",
  },
  openGraph: {
    title: "Preserve Your Life Story Online | MyEMemorial",
    description:
      "Preserve your life story, memories, photos, videos, family history, and meaningful experiences in your own words for the people you love.",
    url: "/preserve-your-life-story",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preserve Your Life Story Online | MyEMemorial",
    description:
      "Learn how to preserve your own life story and memories online for family and future generations.",
  },
};

const faqItems = [
  {
    question: "Why should I preserve my life story while I am living?",
    answer:
      "Preserving your life story while you are living lets you decide what is remembered and tell important experiences in your own words instead of leaving future generations to reconstruct the story later.",
  },
  {
    question: "What should I include in my life story?",
    answer:
      "You can include childhood memories, family history, places lived and worked, education, accomplishments, relationships, traditions, favorite music, photographs, videos, lessons learned, meaningful experiences, and anything else you want future generations to know.",
  },
  {
    question: "Do I have to write my entire life story at once?",
    answer:
      "No. A life story can be built gradually. You can begin with basic information or one chapter of your life and continue adding memories, photographs, videos, and other details over time.",
  },
  {
    question: "Can I preserve photos and videos with my life story?",
    answer:
      "Yes. A digital life story can combine written memories with photographs, videos, favorite music, captions, family history, and other media that help tell the story more completely.",
  },
  {
    question: "What is a living legacy?",
    answer:
      "A living legacy is the story, memories, values, experiences, and information a person intentionally preserves while they are still living so family and future generations can understand their life in their own words.",
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
      name: "Preserve Your Life Story",
      item: "https://www.myememorial.com/preserve-your-life-story",
    },
  ],
};

export default function PreserveYourLifeStoryPage() {
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
              Preserve Your Story
            </p>

            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Preserve Your Life Story in Your Own Words
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              Your family may know many things about you, but only you know the whole
              story. Preserving your life story while you are living lets you record
              the memories, people, places, experiences, values, and moments you want
              future generations to understand.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Explore Living MyEMemorials
              </Link>

              <Link
                href="/gift?type=personal"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Give Someone the Gift of Their Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Why Preserve Your Life Story While You Can Tell It Yourself?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Family members often know the broad outline of a person&apos;s life but
              not the details behind it. They may know where you worked without knowing
              why you chose that career. They may recognize an old photograph without
              knowing who took it, where it was taken, or why that day mattered.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              When you preserve your own life story, you can explain those details in
              your voice and from your point of view. You decide which memories matter,
              which stories deserve to be told, and how you want your life to be
              understood.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Should You Include in a Life Story?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              There is no single correct way to tell a life story. The most meaningful
              version is the one that reflects the experiences, relationships, and
              memories you want preserved.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[
                [
                  "Childhood & Family",
                  "Where you grew up, the people who influenced you, family traditions, early memories, and stories about parents, grandparents, siblings, and relatives.",
                ],
                [
                  "Places You Lived",
                  "Homes, towns, cities, neighborhoods, moves, travels, and the places that became important parts of your story.",
                ],
                [
                  "Work & Education",
                  "Schools, careers, jobs, businesses, mentors, accomplishments, awards, challenges, and lessons learned along the way.",
                ],
                [
                  "Relationships",
                  "Friendships, marriage, children, grandchildren, relatives, coworkers, neighbors, and the people who shaped your life.",
                ],
                [
                  "Milestones & Memories",
                  "Celebrations, turning points, vacations, achievements, difficulties overcome, funny stories, traditions, and ordinary moments worth remembering.",
                ],
                [
                  "Values & Lessons",
                  "Beliefs, advice, lessons learned, hopes for future generations, and the things experience taught you that you want your family to know.",
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
              A Life Story Is More Than Written Words
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              The story of a life can be richer when the words are preserved together
              with the photographs, videos, music, and family information connected to
              those memories.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Photographs from different stages of life",
                "Video Memories and recorded stories",
                "Favorite songs and meaningful music",
                "Family history and relationships",
                "Places lived and worked",
                "Schools and awards",
                "Newspaper articles and accomplishments",
                "Social media links you want remembered",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base font-semibold leading-7 text-stone-800"
                >
                  <span className="font-bold text-blue-950">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              What Is a Living Legacy?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              A living legacy is what you intentionally preserve and pass forward while
              you are still here to explain it. It can include your stories, memories,
              values, photographs, family history, accomplishments, traditions, and
              the lessons you want the people you love to remember.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              Creating that legacy while you are living is different from having
              someone else reconstruct your life later. You can correct details,
              explain why events mattered, add context to photographs, and decide what
              belongs in the story.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              You Do Not Need to Write an Autobiography
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Preserving your life story does not mean sitting down and writing a book
              from childhood to the present in one attempt. A digital life story can be
              built chapter by chapter and memory by memory.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              You might begin with your family history, then record the places you have
              lived, add a story about your first job, upload a favorite photograph,
              or preserve a video memory. Over time, those individual pieces create a
              much fuller record of your life.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              How a Living MyEMemorial Helps Preserve Your Story
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A Living MyEMemorial gives you a guided place to preserve your own story
              while you are living. Instead of leaving photographs, videos, stories,
              and important family information scattered in different places, you can
              organize them around the story of your life.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Basic information",
                "Family history",
                "Life story",
                "Places lived",
                "Places worked",
                "Schools and awards",
                "Social media",
                "Newspaper articles",
                "Favorite songs",
                "Photo gallery",
                "Video Memories",
                "A Designated Person for permitted future updates",
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

            <Link
              href="/personal-e-memorials"
              className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-full bg-blue-950 px-6 text-base font-bold text-white transition hover:bg-blue-900"
            >
              See Living MyEMemorial Plans
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Preserve the Story for Children and Grandchildren
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Future generations may inherit family photographs, but photographs alone
              cannot explain everything. Without names, dates, stories, and context,
              even meaningful family pictures can eventually become mysteries.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Preserving your life story now can help children, grandchildren, and
              later generations understand not just who appears in the family history,
              but how those people lived, what mattered to them, and how one
              generation&apos;s experiences shaped the next.
            </p>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              A Life Story Can Also Be a Meaningful Gift
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              Sometimes the hardest part is simply getting started. A Living
              MyEMemorial can also be given to a parent, grandparent, spouse, or another
              person as an invitation to preserve their own memories and story.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              Instead of giving another object, the gift gives someone a place to tell
              the stories only they can tell.
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
              Frequently Asked Questions About Preserving Your Life Story
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
              Your Story Is Yours to Tell
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Preserve the memories, experiences, photographs, videos, family history,
              and lessons you want the people you love to remember — in your own words.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Explore Living MyEMemorials
              </Link>

              <Link
                href="/gift?type=personal"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Give the Gift of a Life Story
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
