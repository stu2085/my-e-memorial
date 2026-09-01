import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Online Memorial vs. Obituary: What's the Difference? | MyEMemorial",
  },
  description:
    "Learn the difference between an obituary and an online memorial, what each is used for, what information they can include, and why families may choose to use both.",
  keywords: [
    "online memorial vs obituary",
    "memorial vs obituary",
    "difference between obituary and memorial",
    "obituary vs memorial website",
    "online obituary",
    "online memorial",
    "memorial website",
    "memorial page",
    "digital memorial",
    "virtual memorial",
  ],
  alternates: {
    canonical: "/online-memorial-vs-obituary",
  },
  openGraph: {
    title: "Online Memorial vs. Obituary: What's the Difference? | MyEMemorial",
    description:
      "A practical comparison of obituaries and online memorials, including what each preserves and why families may choose to use both.",
    url: "/online-memorial-vs-obituary",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Memorial vs. Obituary: What's the Difference? | MyEMemorial",
    description:
      "Understand how an obituary differs from an online memorial and how the two can work together.",
  },
};

const faqItems = [
  {
    question: "What is the difference between an obituary and an online memorial?",
    answer:
      "An obituary is usually a concise written notice that summarizes important facts about a person's life and death and may include funeral or service information. An online memorial can preserve a much broader collection of stories, photos, videos, music, family history, and memories over time.",
  },
  {
    question: "Can an online memorial include an obituary?",
    answer:
      "Yes. An online memorial can include obituary information while also preserving additional stories, photographs, videos, music, family history, and other memories.",
  },
  {
    question: "Do I need both an obituary and a memorial website?",
    answer:
      "Not necessarily, but many families may find that they serve different purposes. An obituary can provide the formal announcement and summary, while a memorial website can become the longer-term place where the person's story and memories are preserved.",
  },
  {
    question: "Can an online memorial be updated later?",
    answer:
      "Depending on the memorial service, an online memorial can be updated as additional photographs, stories, videos, and other information are collected.",
  },
  {
    question: "Can family and friends contribute to an online memorial?",
    answer:
      "Some memorial websites allow family and friends to submit written stories, photographs, or videos. The memorial owner may be able to review contributions before they are published.",
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
      name: "Online Memorial vs. Obituary",
      item: "https://www.myememorial.com/online-memorial-vs-obituary",
    },
  ],
};

export default function OnlineMemorialVsObituaryPage() {
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
              Memorial Planning Guide
            </p>

            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Online Memorial vs. Obituary: What&apos;s the Difference?
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              An obituary and an online memorial can both honor someone who has passed,
              but they serve different purposes. An obituary usually summarizes the
              important facts. A memorial website can preserve the fuller story of the
              person&apos;s life.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[310px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Explore Online Memorials
              </Link>

              <Link
                href="/what-is-an-online-memorial"
                className="inline-flex min-h-[56px] w-full max-w-[310px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                What Is an Online Memorial?
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Is an Obituary?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              An obituary is generally a written notice about a person&apos;s death
              that summarizes important parts of their life. It may be published by a
              newspaper, funeral home, family, or online service.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Obituaries often include the person&apos;s name, birth and death dates,
              family relationships, career or accomplishments, and funeral, visitation,
              or memorial service information. Because an obituary is usually written
              as a concise announcement or summary, there may be limited room for the
              stories and media that show the personality behind those facts.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Is an Online Memorial?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              An online memorial is a dedicated memorial page or website where the
              person&apos;s story can be preserved in greater depth. It can bring
              together written memories, photographs, videos, music, family history,
              life details, obituary information, and other meaningful material in one
              place.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Instead of serving mainly as an announcement, an online memorial can
              become a place family and friends return to over time to remember the
              person and share the story with future generations.
            </p>

            <Link
              href="/memorial-websites"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-base font-bold text-stone-900 shadow-sm transition hover:bg-stone-100"
            >
              Read the Memorial Website Guide
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Obituary and Online Memorial Compared
            </h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border-b border-stone-300 bg-stone-100 p-4 text-lg font-bold text-stone-900">
                      Feature
                    </th>
                    <th className="border-b border-stone-300 bg-stone-100 p-4 text-lg font-bold text-stone-900">
                      Obituary
                    </th>
                    <th className="border-b border-stone-300 bg-stone-100 p-4 text-lg font-bold text-stone-900">
                      Online Memorial
                    </th>
                  </tr>
                </thead>
                <tbody className="text-base leading-7 text-stone-700">
                  {[
                    ["Announces the death", "Common", "Can include it"],
                    ["Basic biographical facts", "Common", "Common"],
                    ["Funeral/service information", "Common", "Can include it"],
                    ["Long-form life story", "Usually limited", "Can be extensive"],
                    ["Photo gallery", "Usually limited", "Common feature"],
                    ["Video memories", "Uncommon", "Possible"],
                    ["Favorite music", "Uncommon", "Possible"],
                    ["Family history", "Usually brief", "Can be detailed"],
                    ["Memories from family and friends", "Usually limited", "Can be collected over time"],
                    ["Updated over time", "Usually static", "Often possible"],
                    ["Shared by direct web link", "Sometimes", "Common"],
                  ].map(([feature, obituary, memorial]) => (
                    <tr key={feature}>
                      <td className="border-b border-stone-200 p-4 font-semibold text-stone-900">
                        {feature}
                      </td>
                      <td className="border-b border-stone-200 p-4">{obituary}</td>
                      <td className="border-b border-stone-200 p-4">{memorial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              You Do Not Have to Choose One or the Other
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              An obituary and an online memorial can work together. The obituary can
              provide the formal summary and immediate service information, while the
              memorial website can become the longer-term place where the person&apos;s
              fuller story is preserved.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              Families can also include obituary information within a MyEMemorial so
              visitors can find that information alongside photographs, videos, music,
              family history, stories, and other memories.
            </p>

            <Link
              href="/create-an-online-memorial"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-amber-400 px-6 text-base font-bold text-stone-900 transition hover:bg-amber-300"
            >
              Learn How to Create an Online Memorial
            </Link>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Why an Online Memorial Can Preserve More of the Person
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A life is usually too large to fit into a few paragraphs. The details
              family members remember may include childhood stories, favorite sayings,
              vacations, work experiences, traditions, music, friendships, hobbies,
              family photographs, and countless everyday moments that would not
              normally appear in an obituary.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A memorial website gives those memories a place to live together. That
              can make the memorial more useful to children, grandchildren, extended
              family, old friends, and future generations who want to understand the
              person beyond their name and dates.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Can a MyEMemorial Preserve Beyond an Obituary?
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "A detailed life story",
                "Featured and gallery photos",
                "Video Memories",
                "Favorite music",
                "Family history",
                "Places lived and worked",
                "Schools and awards",
                "Social media links",
                "Newspaper articles",
                "Obituary information",
                "Final resting place details",
                "Stories, photos and videos contributed by family and friends",
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
              When Might a Memorial Website Be Especially Helpful?
            </h2>

            <ul className="mt-5 space-y-3 text-lg leading-8 text-stone-700">
              <li>
                <strong>When family members live in different places:</strong> A shared
                online memorial gives everyone the same place to visit.
              </li>
              <li>
                <strong>When there are many photographs or videos:</strong> A memorial
                website can keep media connected to the person&apos;s story.
              </li>
              <li>
                <strong>When family wants to preserve memories over time:</strong>{" "}
                Additional stories and photographs may surface months or years later.
              </li>
              <li>
                <strong>When future generations matter:</strong> Children and
                grandchildren can learn more than what a short obituary records.
              </li>
              <li>
                <strong>When friends and relatives have stories to contribute:</strong>{" "}
                A memorial can help gather memories held by different people.
              </li>
            </ul>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Frequently Asked Questions
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
              Preserve More Than the Facts
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              A Departed MyEMemorial can preserve the obituary while also giving your
              family room for the stories, photographs, videos, music, family history,
              and memories that show who the person really was.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Explore MyEMemorial Plans
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
