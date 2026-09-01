import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Memorial Websites: What They Are & What to Look For | MyEMemorial",
  },
  description:
    "Learn what memorial websites are, what they can include, how they differ from an obituary, and what to look for when choosing an online memorial website for someone you love.",
  keywords: [
    "memorial websites",
    "memorial website",
    "online memorial websites",
    "online memorial website",
    "memorial site",
    "online memorial site",
    "memorial page",
    "online memorial page",
    "digital memorial",
    "virtual memorial",
    "online tribute",
    "memorial website for a loved one",
  ],
  alternates: {
    canonical: "/memorial-websites",
  },
  openGraph: {
    title: "Memorial Websites: What They Are & What to Look For | MyEMemorial",
    description:
      "A practical guide to memorial websites, including common features, the difference between a memorial and an obituary, and what families should consider.",
    url: "/memorial-websites",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memorial Websites: What They Are & What to Look For | MyEMemorial",
    description:
      "Learn what memorial websites are, what they can preserve, and what to consider when choosing one for someone you love.",
  },
};

const faqItems = [
  {
    question: "What is a memorial website?",
    answer:
      "A memorial website is an online place created to preserve and share the life story, photographs, videos, memories, and other meaningful details of someone who has passed.",
  },
  {
    question: "How is a memorial website different from an obituary?",
    answer:
      "An obituary usually summarizes a person's life and announces their passing. A memorial website can continue beyond the obituary by preserving stories, photographs, videos, music, family history, and memories in one shareable place.",
  },
  {
    question: "Can family and friends contribute to an online memorial?",
    answer:
      "Many memorial websites allow family and friends to contribute memories, photographs, videos, or written stories. The exact controls depend on the memorial platform.",
  },
  {
    question: "Can a memorial website include photos, videos, and music?",
    answer:
      "Yes. Depending on the service and plan, an online memorial may include photographs, video memories, favorite music, captions, written stories, family history, and other personal details.",
  },
  {
    question: "Are memorial websites shareable?",
    answer:
      "Public memorial websites can typically be shared with relatives and friends using a direct web link. Some services also provide additional sharing tools.",
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
      name: "Memorial Websites",
      item: "https://www.myememorial.com/memorial-websites",
    },
  ],
};

export default function MemorialWebsitesPage() {
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
              Memorial Website Guide
            </p>

            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Memorial Websites: What They Are and What to Look For
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-200">
              Memorial websites give families an online place to preserve more than
              dates and facts. They can bring together a loved one&apos;s life story,
              photographs, videos, music, family history, and memories in one lasting,
              shareable place.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[310px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Explore Online Memorials
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
              What Is a Memorial Website?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              A memorial website is a dedicated online space where family and friends
              can remember someone who has passed and preserve the story of their life.
              Unlike a short announcement or social media post, an online memorial site
              can keep important memories together in a single place that can be shared
              with relatives, friends, and future generations.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Depending on the memorial service, a memorial page may include a life
              story, photographs, video memories, favorite music, family history,
              places lived and worked, schools, awards, obituary information, final
              resting place details, and contributions from family and friends.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Memorial Website vs. Obituary
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              An obituary and a memorial website can work together, but they serve
              different purposes. An obituary usually records key biographical facts,
              announces a death, and provides funeral or service information. A
              memorial website can go much further by preserving the stories, media,
              relationships, and experiences that show who the person was.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5">
                <h3 className="text-xl font-bold text-stone-900">An obituary often includes</h3>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-stone-700">
                  <li>Birth and death information</li>
                  <li>Family relationships</li>
                  <li>Career and major life facts</li>
                  <li>Funeral or service information</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white p-5">
                <h3 className="text-xl font-bold text-stone-900">
                  A memorial website can also preserve
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-stone-700">
                  <li>Life stories and personal memories</li>
                  <li>Photo galleries and video memories</li>
                  <li>Favorite music and meaningful media</li>
                  <li>Family history and stories from loved ones</li>
                </ul>
              </div>
            </div>

            <p className="mt-5 text-base leading-7 text-stone-700">
              Read more in our upcoming guide to{" "}
              <span className="font-semibold">online memorials vs. obituaries</span>.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              What Should You Look For in an Online Memorial Website?
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[
                [
                  "A Complete Life Story",
                  "Look for enough room to preserve the experiences, relationships, places, and memories that made the person's life unique.",
                ],
                [
                  "Photos, Videos and Music",
                  "Media can help future generations see faces, hear voices, and experience meaningful moments rather than reading facts alone.",
                ],
                [
                  "Family Contributions",
                  "A useful memorial service can make it easier for relatives and friends to contribute stories, photographs, or videos while giving the memorial owner appropriate control.",
                ],
                [
                  "Easy Sharing",
                  "A memorial should be simple to share with family and friends through a stable web address and work well on both computers and phones.",
                ],
                [
                  "Clear Pricing",
                  "Understand what is included, whether the cost is one-time or recurring, and what limits apply to photos, videos, or other media.",
                ],
                [
                  "Long-Term Purpose",
                  "The best memorial website for your family should be designed to preserve a person's story for years to come rather than acting only as a temporary event page.",
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
              What Can a MyEMemorial Include?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              A Departed MyEMemorial is designed to preserve the story between the
              dates. Families can bring together important life details and meaningful
              memories in one online memorial rather than leaving them scattered across
              phones, social media accounts, photo albums, and separate files.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Life story",
                "Featured and gallery photos",
                "Video Memories",
                "Favorite music",
                "Family history",
                "Places lived and worked",
                "Schools and awards",
                "Social media links",
                "Obituary information",
                "Final resting place details",
                "Stories, photos and videos submitted by family and friends",
                "Celebration of Life Presentation on paid plans",
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

            <div className="mt-7">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                View MyEMemorial Plans
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Can You Create a Memorial Website for Free?
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Some memorial websites offer a free starting option while others require
              payment from the beginning. MyEMemorial offers a Free Departed
              MyEMemorial so a family can begin preserving basic information, a life
              story, and a limited photo gallery before deciding whether additional
              features or media capacity are needed.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Paid MyEMemorial plans are one-time purchases rather than recurring
              subscriptions. The right choice depends on how many photographs, how
              much video, and which additional features your family wants to preserve.
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
              Frequently Asked Questions About Memorial Websites
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
              Ready to Preserve Their Story?
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Explore MyEMemorial plans, experience a sample memorial, or give a
              Departed MyEMemorial to a family who wants a lasting place to preserve
              someone they love.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Explore Departed MyEMemorials
              </Link>

              <Link
                href="/gift?type=memorial"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Give a Departed MyEMemorial
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
