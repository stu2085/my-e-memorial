import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Best Memorial Slideshow Makers in 2026 | MyEMemorial",
  },
  description:
    "Compare MyEMemorial, Dignity Memorial, Keeper Memorials, ForeverMissed, Ever Loved, and Canva for memorial slideshows, tribute videos, online memorials, sharing, downloads, and pricing.",
  alternates: {
    canonical: "/best-memorial-slideshow-makers",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Best Memorial Slideshow Makers in 2026: Side-by-Side Comparison",
    description:
      "Compare major memorial and slideshow options by photos, video, music, online sharing, offline playback, memorial pages, and pricing.",
    url: "/best-memorial-slideshow-makers",
    siteName: "MyEMemorial",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Memorial Slideshow Makers in 2026",
    description:
      "Compare major memorial slideshow, tribute video, and online memorial options.",
  },
};

type Provider = {
  key: string;
  name: string;
  price: string;
  href: string;
  internal?: boolean;
};

const providers: Provider[] = [
  {
    key: "myememorial",
    name: "MyEMemorial",
    price: "$29.95 one-time Presentation",
    href: "/celebration-of-life-presentation",
    internal: true,
  },
  {
    key: "dignity",
    name: "Dignity Memorial",
    price: "Tribute Movie offered through participating funeral providers; standalone price not clearly listed",
    href: "https://www.dignitymemorial.com/",
  },
  {
    key: "keeper",
    name: "Keeper Memorials",
    price: "$50 one-time Tribute Video; memorial page can start free",
    href: "https://mykeeper.com/",
  },
  {
    key: "forevermissed",
    name: "ForeverMissed",
    price: "Free memorial; Premium $9.95/mo or $79.95/yr; Lifetime $159.95",
    href: "https://www.forevermissed.com/ourplans",
  },
  {
    key: "everloved",
    name: "Ever Loved",
    price: "Free standard memorial; Premium $199.99 one-time",
    href: "https://everloved.com/online-memorials/",
  },
  {
    key: "canva",
    name: "Canva",
    price: "Free slideshow maker; premium assets/features also available",
    href: "https://www.canva.com/create/slideshows/",
  },
];

type FeatureRow = {
  feature: string;
  note?: string;
  values: Record<string, string>;
};

const featureRows: FeatureRow[] = [
  {
    feature: "Photos, captions & music",
    values: {
      myememorial: "Yes - photos, captions and favorite music",
      dignity:
        "Tribute Movie is built from cherished photos; the current provider pages do not clearly describe self-service captions or music controls",
      keeper:
        "Yes - Tribute Videos use memorial photos and videos and let families choose music",
      forevermissed:
        "Photos plus music and video galleries on paid plans; background music playlist on paid plans",
      everloved:
        "Memorial pages support photos, videos and messages; a built-in slideshow music workflow is not clearly listed",
      canva:
        "Yes - photos, text/captions, video and music",
    },
  },
  {
    feature: "Video / tribute presentation",
    values: {
      myememorial:
        "Yes - photos and video clips play together in the Celebration of Life Presentation",
      dignity:
        "Yes - Dignity advertises a Tribute Movie made from cherished photos",
      keeper:
        "Yes - $50 Tribute Video can use photos and videos from the memorial",
      forevermissed:
        "Video galleries are available on paid memorial plans; a built-in funeral slideshow maker is not clearly listed",
      everloved:
        "Memorial pages accept videos; a built-in memorial slideshow maker is not clearly listed",
      canva:
        "Yes - general-purpose photo and video slideshow creation",
    },
  },
  {
    feature: "How it is created",
    note: "This distinguishes self-service slideshow builders from memorial services and memorial-site features.",
    values: {
      myememorial:
        "Guided online builder - add media, arrange the order and preview in the browser",
      dignity:
        "Provided through participating Dignity Memorial funeral providers rather than advertised as a standalone self-service slideshow builder",
      keeper:
        "Memorial owner starts the Tribute Video and can invite family and friends to contribute",
      forevermissed:
        "Build and manage an online memorial; no separate self-service slideshow builder is clearly listed",
      everloved:
        "Build and manage an online memorial; no separate built-in slideshow builder is clearly listed",
      canva:
        "General-purpose drag-and-drop online editor with templates and manual design controls",
    },
  },
  {
    feature: "Online sharing",
    values: {
      myememorial:
        "Yes - 60 days of hosted Presentation access plus the connected MyEMemorial",
      dignity:
        "Yes - free online memorial lets family and friends contribute photos, videos and memories",
      keeper:
        "Yes - Tribute Video is published on the memorial page",
      forevermissed:
        "Yes - online memorial with collaboration and privacy controls",
      everloved:
        "Yes - online memorial can be shared and can receive photos, videos and messages",
      canva:
        "Yes - designs can be shared by link",
    },
  },
  {
    feature: "Offline copy / no-internet playback",
    note: "An offline copy can be important when the funeral or Celebration of Life venue has no Wi-Fi or internet.",
    values: {
      myememorial:
        "Yes - downloadable MP4 Offline Copy for dependable playback if the funeral or Celebration of Life venue has no Wi-Fi or internet.",
      dignity:
        "Dignity says the Tribute Movie is given to the family to play again; the current public page does not specify the file format",
      keeper:
        "The Tribute Video is published to the memorial page; a downloadable offline video file is not clearly stated on the current Tribute Video help page",
      forevermissed:
        "A downloadable memorial slideshow/video file is not clearly listed",
      everloved:
        "A built-in downloadable memorial slideshow/video file is not clearly listed",
      canva:
        "Yes - high-resolution MP4 download",
    },
  },
  {
    feature: "Free online memorial included or available",
    values: {
      myememorial:
        "Yes - a Free Departed MyEMemorial is included with the $29.95 Presentation",
      dignity:
        "Yes - Dignity advertises a free online memorial through its providers",
      keeper:
        "Yes - one memorial can be created free; Keeper Plus is $99 one-time",
      forevermissed:
        "Yes - Basic memorial is free",
      everloved:
        "Yes - standard memorial websites are free",
      canva:
        "No dedicated online memorial product",
    },
  },
  {
    feature: "Presentation purchase credited toward a paid memorial",
    values: {
      myememorial:
        "Yes - the full $29.95 is a single-use credit toward a new Basic, Plus or Premium MyEMemorial",
      dignity:
        "No comparable purchase-price credit toward a separate online memorial upgrade is publicly listed",
      keeper:
        "No comparable $50 Tribute Video purchase credit toward Keeper Plus is publicly listed",
      forevermissed:
        "Not applicable - no separate slideshow purchase is clearly listed",
      everloved:
        "Not applicable - no separate built-in slideshow purchase is clearly listed",
      canva:
        "Not applicable",
    },
  },
  {
    feature: "Presentation connected to a paid memorial",
    note: "The final row focuses on whether the slideshow purchase becomes part of a broader paid memorial relationship.",
    values: {
      myememorial:
        "Yes - Basic, Plus and Premium include the Celebration Presentation at no additional charge, and a linked standalone Presentation is preserved with the paid MyEMemorial after upgrade",
      dignity:
        "Tribute Movie and online memorial are both offered through Dignity Memorial providers, but a separate paid online-memorial upgrade path is not publicly described",
      keeper:
        "Yes - Tribute Video is created from memorial content and is published on the Keeper memorial page; Keeper Plus is a separate $99 one-time upgrade",
      forevermissed:
        "Paid memorial plans add unlimited photos, music/video galleries and background music, but no separate slideshow product is clearly listed",
      everloved:
        "Premium upgrades the memorial website for $199.99 one-time; no separate built-in slideshow product is clearly listed",
      canva:
        "No memorial-specific paid memorial product",
    },
  },
];

const faqItems = [
  {
    question: "Why compare memorial websites with slideshow makers?",
    answer:
      "Families often encounter both when planning a funeral or Celebration of Life. Some services focus on the event presentation, some focus on the lasting online memorial, and some connect the two. Canva is included as a major general-purpose slideshow alternative.",
  },
  {
    question: "What should I compare when choosing a memorial slideshow or tribute option?",
    answer:
      "Compare the media you can include, how the presentation is created, whether relatives can view it online, whether you receive an offline copy, whether a memorial page is included, and whether the presentation connects to a longer-term memorial.",
  },
  {
    question: "Why is an offline copy important for a funeral or Celebration of Life?",
    answer:
      "An offline copy reduces dependence on the venue's Wi-Fi or internet connection. Save it on the device that will be used at the service, test it before the event, and keep a second copy on a USB drive when possible.",
  },
  {
    question: "What does the MyEMemorial $29.95 Presentation include?",
    answer:
      "It includes the Celebration of Life Presentation, 60 days of hosted online access, an MP4 Offline Copy, a Free Departed MyEMemorial, and a single-use $29.95 credit toward a new Basic, Plus, or Premium MyEMemorial.",
  },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Memorial Slideshow Makers in 2026: Side-by-Side Comparison",
  description:
    "A comparison of major memorial slideshow, tribute video, online memorial, and general slideshow options using publicly listed features and pricing.",
  datePublished: "2026-09-24",
  dateModified: "2026-09-24",
  author: {
    "@type": "Organization",
    name: "MyEMemorial",
    url: "https://www.myememorial.com",
  },
  publisher: {
    "@type": "Organization",
    name: "MyEMemorial",
    url: "https://www.myememorial.com",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.myememorial.com/best-memorial-slideshow-makers",
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
      name: "Best Memorial Slideshow Makers",
      item: "https://www.myememorial.com/best-memorial-slideshow-makers",
    },
  ],
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Memorial slideshow and tribute options compared in 2026",
  itemListElement: providers.map((provider, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: provider.name,
    url: provider.internal
      ? `https://www.myememorial.com${provider.href}`
      : provider.href,
  })),
};

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

function ProviderLink({ provider }: { provider: Provider }) {
  if (provider.internal) {
    return (
      <Link
        href={provider.href}
        className="font-bold text-blue-950 underline underline-offset-4"
      >
        {provider.name}
      </Link>
    );
  }

  return (
    <a
      href={provider.href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-blue-950 underline underline-offset-4"
    >
      {provider.name}
    </a>
  );
}

export default function BestMemorialSlideshowMakersPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] bg-blue-950 px-6 py-10 text-center text-white shadow-sm md:px-10 md:py-14">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-300">
              2026 Memorial Slideshow & Tribute Comparison
            </p>

            <h1 className="mx-auto mt-3 max-w-5xl text-4xl font-bold leading-tight md:text-5xl">
              Best Memorial Slideshow Makers in 2026
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-stone-200">
              Compare MyEMemorial with major memorial brands and Canva, starting
              with the presentation features families commonly need and ending
              with the ways each option connects - or does not connect - to a
              lasting online memorial.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/celebration-of-life-presentation"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                See MyEMemorial Presentation
              </Link>

              <Link
                href="/celebration-of-life-presentation/sample"
                className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center rounded-full border-2 border-white/30 bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                View a Sample Presentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">How This Comparison Was Prepared</h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              MyEMemorial publishes this comparison and is one of the services
              shown below. The other entries were checked against the providers&apos;
              own current websites and help pages.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Information was reviewed on <strong>September 24, 2026</strong>.
              Pricing and features can change. Where a current provider page does
              not clearly confirm a feature, we say that instead of assuming the
              answer is no.
            </p>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">
              Memorial Slideshow & Tribute Options Compared
            </h2>
            <p className="mt-4 text-lg leading-8 text-stone-700">
              Dignity Memorial, Keeper, ForeverMissed and Ever Loved are included
              because families frequently encounter them while looking for memorial
              services. Canva represents the major general-purpose slideshow
              alternative. Not every provider sells a standalone slideshow, so the
              table identifies those differences directly.
            </p>
          </section>

          <section className="relative left-1/2 w-[calc(100vw-1rem)] max-w-[1600px] -translate-x-1/2 rounded-[2rem] bg-white p-4 shadow-sm md:p-8">
            <div className="px-2">
              <p className="text-base font-bold uppercase tracking-[0.16em] text-blue-900">
                At a Glance
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Side-by-Side Comparison
              </h2>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-stone-700">
                Scroll horizontally on smaller screens. The rows move from common
                presentation features down to memorial and upgrade features where
                the products differ most.
              </p>
            </div>

            <div
              className="mt-6 overflow-x-auto rounded-2xl border border-stone-200"
              tabIndex={0}
              aria-label="Scrollable memorial slideshow and tribute comparison table"
            >
              <table className="min-w-[1580px] border-collapse text-left text-base leading-6">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="sticky left-0 z-20 w-[240px] border-b border-r border-stone-200 bg-stone-100 px-4 py-4 font-bold">
                      Feature
                    </th>
                    {providers.map((provider) => (
                      <th
                        key={provider.key}
                        className={`w-[220px] border-b border-r border-stone-200 px-4 py-4 align-top ${
                          provider.key === "myememorial" ? "bg-amber-50" : ""
                        }`}
                      >
                        <div className="text-lg font-bold">{provider.name}</div>
                        <div className="mt-2 text-sm font-semibold leading-5 text-stone-600">
                          {provider.price}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {featureRows.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 border-r border-t border-stone-200 px-4 py-4 align-top font-bold ${
                          index % 2 === 0 ? "bg-white" : "bg-stone-50"
                        }`}
                      >
                        {row.feature}
                        {row.note ? (
                          <p className="mt-2 text-sm font-normal leading-5 text-stone-600">
                            {row.note}
                          </p>
                        ) : null}
                      </th>

                      {providers.map((provider) => (
                        <td
                          key={provider.key}
                          className={`border-r border-t border-stone-200 px-4 py-4 align-top text-stone-700 ${
                            provider.key === "myememorial"
                              ? "bg-amber-50/70 font-semibold"
                              : ""
                          }`}
                        >
                          {row.values[provider.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <p className="text-base font-bold uppercase tracking-[0.16em] text-amber-300">
              MyEMemorial
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              From the Service Presentation to a Lasting MyEMemorial
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              The standalone Celebration of Life Presentation costs $29.95 and
              includes photos, videos, captions, music, 60 days of hosted online
              access, and an MP4 Offline Copy.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              The purchase also includes a{" "}
              <strong className="text-white">Free Departed MyEMemorial</strong>.
              The full $29.95 Presentation purchase can then be used as a
              single-use credit toward a new Basic, Plus, or Premium MyEMemorial.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              Basic, Plus, and Premium Departed MyEMemorial plans include the
              Celebration of Life Presentation at no additional charge. If a linked
              standalone Presentation is upgraded into a paid MyEMemorial before its
              60-day hosted period ends, the Presentation is preserved with the
              MyEMemorial.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/celebration-of-life-presentation"
                className="inline-flex min-h-[52px] w-full max-w-[315px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                View Presentation Details
              </Link>
              <Link
                href="/memorials"
                className="inline-flex min-h-[52px] w-full max-w-[315px] items-center justify-center rounded-full bg-white px-6 text-center text-base font-bold text-stone-900 transition hover:bg-stone-100"
              >
                Compare MyEMemorial Plans
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">Provider Sources</h2>
            <p className="mt-4 text-lg leading-8 text-stone-700">
              Use the provider links below to review current pricing and features
              directly before purchasing.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <div
                  key={provider.key}
                  className={`rounded-2xl border p-5 ${
                    provider.key === "myememorial"
                      ? "border-amber-300 bg-amber-50"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <ProviderLink provider={provider} />
                  <p className="mt-2 text-base leading-7 text-stone-700">
                    {provider.price}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>

            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <summary className="cursor-pointer text-lg font-bold">
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
            <h2 className="text-3xl font-bold">
              See the MyEMemorial Celebration of Life Presentation
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Create and share a memorial presentation with photos, videos,
              captions, and music, then keep an MP4 Offline Copy for the service.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/celebration-of-life-presentation"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Create a Presentation
              </Link>
              <Link
                href="/how-to-make-a-celebration-of-life-presentation"
                className="inline-flex min-h-[56px] w-full max-w-[330px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Read the Step-by-Step Guide
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}


