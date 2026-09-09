import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Best Memorial Websites in 2026 | MyEMemorial",
  },
  description:
    "Compare leading memorial websites in 2026 by pricing, photos, video, music, family contributions, living memorial options, presentations, privacy, and more.",
  keywords: [
    "best memorial websites",
    "best online memorial websites",
    "best memorial website",
    "online memorial website comparison",
    "memorial website comparison",
    "online memorials",
    "digital memorial websites",
    "memorial websites 2026",
    "CreateMemorial alternative",
    "Ever Loved alternative",
    "ForeverMissed alternative",
    "Keeper Memorials alternative",
  ],
  alternates: {
    canonical: "/best-memorial-websites",
  },
  openGraph: {
    title: "Best Memorial Websites in 2026: Side-by-Side Comparison",
    description:
      "Compare MyEMemorial, CreateMemorial, Ever Loved, ForeverMissed, Keeper, Scan2Remember, Kudoboard, and Willowise using current pricing and publicly listed features.",
    url: "/best-memorial-websites",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Memorial Websites in 2026: Side-by-Side Comparison",
    description:
      "Compare leading memorial websites by pricing, media, family contributions, living memorial options, presentations, privacy, and more.",
  },
};

type ComparisonRow = {
  feature: string;
  myememorial: string;
  createMemorial: string;
  everLoved: string;
  foreverMissed: string;
  keeper: string;
  scan2Remember: string;
  kudoboard: string;
  willowise: string;
};

const comparisonRows: ComparisonRow[] = [
  {
    feature: "Starting option",
    myememorial: "Free",
    createMemorial: "Free",
    everLoved: "Free",
    foreverMissed: "Free",
    keeper: "1 memorial free",
    scan2Remember: "Free digital memorial",
    kudoboard: "Free Mini Memorial, up to 10 posts",
    willowise: "Premium website is paid",
  },
  {
    feature: "Paid pricing",
    myememorial: "$49.95 / $69.95 / $89.95 — one-time",
    createMemorial: "$199 — one-time Premium",
    everLoved: "$199.99 — one-time Premium",
    foreverMissed: "$9.95/mo, $79.95/yr, or $159.95 lifetime",
    keeper: "$99 — one-time Keeper Plus",
    scan2Remember: "$9.90/mo Plus; $19.90/mo Pro",
    kudoboard: "$99 — one-time Full Memorial",
    willowise: "$650 + $35/yr for Premium Memorial Website",
  },
  {
    feature: "Photo capacity",
    myememorial: "5 Free; 50 Basic; 150 Plus; unlimited Premium",
    createMemorial: "5 Free; unlimited Premium",
    everLoved: "Primary + 4 additional; contributed photos can also be added",
    foreverMissed: "5 Free; unlimited Premium/Lifetime",
    keeper: "Photos supported; Keeper Plus includes unlimited image storage",
    scan2Remember: "10 Free; unlimited Plus/Pro",
    kudoboard: "Photos in posts; Full Memorial has unlimited posts",
    willowise: "Up to 50 photos on Premium Memorial Website",
  },
  {
    feature: "Direct camera recording",
    myememorial: "Built-in recording from desktop, laptop or phone camera",
    createMemorial: "No built-in direct camera recording clearly listed",
    everLoved: "No built-in direct camera recording clearly listed",
    foreverMissed: "No built-in direct camera recording clearly listed",
    keeper: "No built-in direct camera recording clearly listed",
    scan2Remember: "No built-in direct camera recording clearly listed",
    kudoboard: "Can record video posts",
    willowise: "No self-service direct camera recording clearly listed",
  },
  {
    feature: "Video",
    myememorial: "Video Memories: 15 / 30 / 60 minutes on paid plans",
    createMemorial: "Unlimited video on Premium",
    everLoved: "Visitors can contribute videos",
    foreverMissed: "Music & Video Galleries on paid plans",
    keeper: "Video supported; Keeper Plus includes unlimited video storage",
    scan2Remember: "3 videos Free; unlimited Plus/Pro",
    kudoboard: "Full Memorial supports added or recorded video posts",
    willowise: "Custom embedded multimedia, including videos",
  },
  {
    feature: "Music / audio",
    myememorial: "Favorite music included on paid plans",
    createMemorial: "Unlimited audio on Premium",
    everLoved: "No dedicated music feature clearly listed",
    foreverMissed: "Music gallery + background music playlist on paid plans",
    keeper: "Music can be used in Tribute Videos",
    scan2Remember: "Background music on Plus/Pro",
    kudoboard: "No dedicated memorial music feature clearly listed",
    willowise: "Custom embeds can include playlists",
  },
  {
    feature: "Family & friend contributions",
    myememorial: "Written stories, photos & videos",
    createMemorial: "Tributes and visitor participation",
    everLoved: "Photos, stories, condolences & videos",
    foreverMissed: "Unlimited collaborators on paid plans",
    keeper: "Unlimited tributes with messages, images & videos",
    scan2Remember: "Unlimited tributes; collaborators on Plus/Pro",
    kudoboard: "Collaborative memorial posts",
    willowise: "Live guest book with guest-uploaded photos",
  },
  {
    feature: "Contribution approval / moderation",
    myememorial: "Shared Memories Approval before public display",
    createMemorial: "No equivalent pre-publication approval clearly listed",
    everLoved: "Premium can control who may post",
    foreverMissed: "Role-based permissions on paid plans",
    keeper: "Keeper administrators + privacy/moderation controls",
    scan2Remember: "Tribute moderation on Pro",
    kudoboard: "Proactive moderation before posts go live",
    willowise: "Moderation included in virtual service/reception plans",
  },
  {
    feature: "Create while the person is living",
    myememorial: "Yes — Living MyEMemorial",
    createMemorial: "Not advertised as a pre-need memorial feature",
    everLoved: "Not advertised as a pre-need memorial feature",
    foreverMissed: "Not advertised as a pre-need memorial feature",
    keeper: "Yes — Living Memorial",
    scan2Remember: "No pre-need memorial feature clearly advertised",
    kudoboard: "No pre-need memorial feature clearly advertised",
    willowise: "No pre-need memorial feature clearly advertised",
  },
  {
    feature: "Future management / handoff",
    myememorial:
      "Designated Person can handle permitted after-death updates after independent death verification",
    createMemorial: "Legacy Contact & Handoff on Premium",
    everLoved: "Additional memorial co-managers",
    foreverMissed: "Customizable collaborator roles",
    keeper: "Multiple Keeper administrators",
    scan2Remember: "Up to 5 family admins on Plus; 15 on Pro",
    kudoboard: "Multiple memorial administrators",
    willowise: "Premium website is professionally managed by Willowise",
  },
  {
    feature: "Funeral / Celebration of Life presentation",
    myememorial:
      "Celebration of Life Presentation — FREE with every paid plan",
    createMemorial:
      "Memorial slideshow plus 1080p funeral slideshow export; export uses credits",
    everLoved: "Funeral livestream tools; no dedicated presentation clearly listed",
    foreverMissed: "Music/video galleries; no dedicated service presentation clearly listed",
    keeper: "Collaborative Tribute Video",
    scan2Remember: "Photo slideshow on Plus/Pro",
    kudoboard: "Embeddable memorial slideshow",
    willowise: "Professionally designed slideshow in service/event plans",
  },
  {
    feature: "Privacy / access controls",
    myememorial: "Member controls published content and approved contributions",
    createMemorial: "Public, invite-only & password-protected options",
    everLoved: "Password access and posting controls on Premium",
    foreverMissed: "Advanced privacy + role permissions on paid plans",
    keeper: "Private, family-only, invitation-only & password options",
    scan2Remember: "Privacy controls on Plus/Pro",
    kudoboard: "Admin controls + proactive moderation",
    willowise: "Professionally managed memorial and event access",
  },
  {
    feature: "QR connection",
    myememorial: "Shareable QR code available",
    createMemorial: "No core QR feature clearly listed",
    everLoved: "No core QR feature clearly listed",
    foreverMissed: "No core QR feature clearly listed",
    keeper: "QR memorial products are available",
    scan2Remember: "Core specialty: optional weatherproof QR plaque",
    kudoboard: "QR is not a primary Memorial Board feature",
    willowise: "No core QR feature clearly listed",
  },
];

const services = [
  {
    name: "MyEMemorial",
    bestFor: "Best for preserving the complete story of a life",
    body:
      "MyEMemorial combines a guided life-story structure with photos, Video Memories, favorite music, family history, places lived and worked, schools and awards, obituary information, final resting place details, and family contributions. It also offers Living MyEMemorials so a person can preserve their own story while living, including recording Video Memories directly through the built-in camera system on a desktop, laptop, or phone.",
    pricing:
      "Free to start. Basic is $49.95, Plus is $69.95, and Premium is $89.95. Paid plans are one-time purchases with no recurring subscription fee.",
    standout:
      "Every paid plan includes the Celebration of Life Presentation at no additional charge. Living MyEMemorials can also use a Designated Person process for permitted after-death updates after independent death verification.",
    href: "/memorials",
    internal: true,
  },
  {
    name: "CreateMemorial",
    bestFor: "Strong for privacy controls and funeral slideshow tools",
    body:
      "CreateMemorial offers a free memorial with up to five photos and a $199 Premium upgrade with unlimited photos, videos, audio, advanced privacy controls, and legacy handoff.",
    pricing: "Free Basic plan; $199 one-time Premium.",
    standout:
      "Its Premium plan includes 3,000 tool credits that can be used for obituary exports and 1080p funeral slideshow exports.",
    href: "https://creatememorial.com/pricing",
  },
  {
    name: "Ever Loved",
    bestFor: "Strong for funeral logistics, fundraising and community participation",
    body:
      "Ever Loved combines memorial pages with funeral details, RSVPs, livestream information, fundraising, photos, stories, condolences, and memorial co-managers.",
    pricing:
      "Standard memorial websites are free. Premium is a $199.99 one-time upgrade.",
    standout:
      "The service is especially useful when a family wants memorial content and funeral-related logistics in the same place.",
    href: "https://everloved.com/online-memorials/",
  },
  {
    name: "ForeverMissed",
    bestFor: "Strong for traditional memorials, themes and multimedia",
    body:
      "ForeverMissed offers biographies, stories, photo galleries, music and video galleries, background music, collaborators, privacy controls, and more than 100 themes.",
    pricing:
      "Free Basic; $9.95 monthly; $79.95 yearly; or $159.95 Lifetime.",
    standout:
      "Its Lifetime plan is a one-time payment and its paid plans include unlimited photo storage plus music and video features.",
    href: "https://www.forevermissed.com/ourplans",
  },
  {
    name: "Keeper",
    bestFor: "Strong for living memorials, family relationships and collaborative management",
    body:
      "Keeper supports memorials for people who have passed as well as Living Memorial pages. It offers photos, videos, Stories, family relationships, tributes, privacy controls, multiple administrators, and Tribute Videos.",
    pricing: "One memorial is free; Keeper Plus is $99 one-time.",
    standout:
      "Keeper is one of the competitors in this comparison that clearly offers a memorial created while a person is living.",
    href: "https://www.mykeeper.com/",
  },
  {
    name: "Scan2Remember",
    bestFor: "Best fit when a physical QR plaque is a priority",
    body:
      "Scan2Remember centers its service around digital memorial pages that can connect to weatherproof QR plaques for graves, urns, benches, or keepsakes. Paid tiers add unlimited media, background music, family admins, privacy controls, and slideshows.",
    pricing:
      "Digital memorials are free to start. Plus is $9.90/month and Pro is $19.90/month. A single QR memorial plaque is listed at $49.90 one-time.",
    standout:
      "Its clearest differentiator is the direct physical-to-digital connection through a weatherproof QR memorial plaque.",
    href: "https://scan2remember.com/pages/digital-memorial",
  },
  {
    name: "Kudoboard",
    bestFor: "Best for collaborative tribute boards",
    body:
      "Kudoboard Memorial Boards are designed around contributions from groups. They support multiple admins, proactive moderation, personalized URLs, reactions, content export, video posts, and an embeddable slideshow.",
    pricing:
      "Mini Memorial is free for up to 10 posts; Full Memorial is $99 one-time with unlimited posts.",
    standout:
      "Kudoboard is particularly well suited to gathering many short messages, photographs and video posts from a group.",
    href: "https://www.kudoboard.com/online-memorial/",
  },
  {
    name: "Willowise",
    bestFor: "Best for professionally managed virtual services",
    body:
      "Willowise combines professionally designed memorial websites with optional hosted virtual memorial services and receptions. Its service packages can include slideshows, registration, recorded events, moderation and professional video editing.",
    pricing:
      "Premium Memorial Website is listed at $650 plus $35 per year for URL and hosting renewal. Larger virtual-service packages cost more.",
    standout:
      "Willowise is less of a self-service memorial builder and more of a professionally managed memorial and virtual-event service.",
    href: "https://willowise.com/pricing/",
  },
];

const faqItems = [
  {
    question: "What is the best memorial website in 2026?",
    answer:
      "There is no single best memorial website for every family. MyEMemorial is especially strong for families who want a structured, comprehensive life story with photos, Video Memories, favorite music, family history, family contributions, one-time paid pricing, and a Celebration of Life Presentation included with every paid plan. Other services may be a better fit when fundraising, a physical QR plaque, a collaborative tribute board, or a professionally managed virtual service is the main priority.",
  },
  {
    question: "Which memorial websites offer a free option?",
    answer:
      "MyEMemorial, CreateMemorial, Ever Loved, ForeverMissed, Keeper, Scan2Remember, and Kudoboard currently advertise a free starting option. Limits and included features differ by service.",
  },
  {
    question: "Which memorial websites have one-time paid plans?",
    answer:
      "MyEMemorial, CreateMemorial, Ever Loved, ForeverMissed, Keeper, and Kudoboard currently list at least one one-time paid option. Scan2Remember offers monthly digital plans plus a separately priced one-time QR plaque, while Willowise lists annual hosting renewal for its Premium Memorial Website.",
  },
  {
    question: "Which memorial websites can be created while someone is still living?",
    answer:
      "MyEMemorial and Keeper both clearly advertise options that can be created while the person is living. MyEMemorial calls this a Living MyEMemorial and includes a Designated Person process for permitted after-death updates after independent death verification.",
  },
  {
    question: "Does MyEMemorial include a Celebration of Life Presentation?",
    answer:
      "Yes. MyEMemorial Basic, Plus, and Premium plans include the Celebration of Life Presentation at no additional charge. It can use approved photos, captions, Video Memories, and favorite music already preserved in the MyEMemorial.",
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
      name: "Best Memorial Websites",
      item: "https://www.myememorial.com/best-memorial-websites",
    },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Memorial Websites in 2026: Side-by-Side Comparison",
  description:
    "A comparison of leading memorial websites using publicly listed pricing, multimedia features, family contribution tools, living memorial options, presentations, privacy, and related services.",
  datePublished: "2026-09-09",
  dateModified: "2026-09-09",
  author: {
    "@type": "Organization",
    name: "MyEMemorial",
    url: "https://www.myememorial.com",
  },
  publisher: {
    "@type": "Organization",
    name: "MyEMemorial",
    url: "https://www.myememorial.com",
    logo: {
      "@type": "ImageObject",
      url: "https://www.myememorial.com/myememorial-logo.png",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.myememorial.com/best-memorial-websites",
  },
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Memorial websites compared in 2026",
  itemListElement: services.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: service.name,
  })),
};

export default function BestMemorialWebsitesPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec]">
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
              2026 Memorial Website Comparison
            </p>

            <h1 className="mx-auto mt-3 max-w-5xl text-4xl font-bold leading-tight md:text-5xl">
              Best Memorial Websites in 2026: Side-by-Side Comparison
            </h1>

            <p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-stone-200">
              Compare leading memorial websites by price, photos, video, music,
              family contributions, living memorial options, future management,
              privacy, slideshows and Celebration of Life features.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Compare MyEMemorial Plans
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
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              How This Comparison Was Prepared
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              This guide is published by MyEMemorial. We therefore have an
              obvious interest in explaining what makes MyEMemorial different.
              To keep the comparison useful, competitor prices and features
              below are based on information publicly listed on each
              company&apos;s own website rather than assumptions about what a
              service may or may not provide.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Information was reviewed on <strong>September 9, 2026</strong>.
              Products, prices and features can change, so families should
              confirm current details with a provider before purchasing.
            </p>
          </section>

          <section className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1650px] -translate-x-1/2 rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <div className="max-w-4xl">
              <p className="text-base font-bold uppercase tracking-[0.16em] text-blue-900">
                At a Glance
              </p>
              <h2 className="mt-2 text-3xl font-bold text-stone-900">
                Memorial Website Feature Comparison
              </h2>
              <p className="mt-4 text-lg leading-8 text-stone-700">
                The table is intentionally specific. When a provider does not
                clearly advertise a feature, we say so instead of guessing.
                On smaller screens, scroll the table horizontally to compare
                every service.
              </p>
            </div>

            <div
              className="mt-7 overflow-x-auto rounded-2xl border border-stone-200"
              tabIndex={0}
              aria-label="Scrollable memorial website comparison table"
            >
              <table className="min-w-[1600px] border-collapse text-left text-base leading-6">
                <thead>
                  <tr className="bg-stone-100">
                    <th
                      scope="col"
                      className="sticky left-0 z-20 w-[175px] border-b border-r border-stone-200 bg-stone-100 px-4 py-4 font-bold text-stone-900"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="w-[215px] border-b border-r border-blue-200 bg-blue-950 px-4 py-4 font-bold text-white"
                    >
                      MyEMemorial
                    </th>
                    <th scope="col" className="w-[175px] border-b border-r border-stone-200 px-4 py-4 font-bold text-stone-900">
                      CreateMemorial
                    </th>
                    <th scope="col" className="w-[175px] border-b border-r border-stone-200 px-4 py-4 font-bold text-stone-900">
                      Ever Loved
                    </th>
                    <th scope="col" className="w-[175px] border-b border-r border-stone-200 px-4 py-4 font-bold text-stone-900">
                      ForeverMissed
                    </th>
                    <th scope="col" className="w-[175px] border-b border-r border-stone-200 px-4 py-4 font-bold text-stone-900">
                      Keeper
                    </th>
                    <th scope="col" className="w-[175px] border-b border-r border-stone-200 px-4 py-4 font-bold text-stone-900">
                      Scan2Remember
                    </th>
                    <th scope="col" className="w-[175px] border-b border-r border-stone-200 px-4 py-4 font-bold text-stone-900">
                      Kudoboard
                    </th>
                    <th scope="col" className="w-[175px] border-b border-stone-200 px-4 py-4 font-bold text-stone-900">
                      Willowise
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 border-r border-t border-stone-200 px-4 py-4 font-bold text-stone-900 ${
                          index % 2 === 0 ? "bg-white" : "bg-stone-50"
                        }`}
                      >
                        {row.feature}
                      </th>
                      <td className="border-r border-t border-blue-200 bg-blue-50 px-4 py-4 font-semibold text-stone-900">
                        {row.myememorial}
                      </td>
                      <td className="border-r border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.createMemorial}
                      </td>
                      <td className="border-r border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.everLoved}
                      </td>
                      <td className="border-r border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.foreverMissed}
                      </td>
                      <td className="border-r border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.keeper}
                      </td>
                      <td className="border-r border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.scan2Remember}
                      </td>
                      <td className="border-r border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.kudoboard}
                      </td>
                      <td className="border-t border-stone-200 px-4 py-4 text-stone-700">
                        {row.willowise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-base leading-7 text-stone-600">
              “Not clearly listed” means we did not find that feature clearly
              described on the provider&apos;s current public pages reviewed
              for this comparison. It does not necessarily mean the provider
              can never offer it.
            </p>
          </section>

          <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-9">
            <p className="text-base font-bold uppercase tracking-[0.16em] text-amber-300">
              MyEMemorial
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              Best for Preserving the Complete Story of a Life
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-200">
              MyEMemorial is designed around a simple idea:{" "}
              <strong className="text-white">Where Life&apos;s Stories Are Told.</strong>{" "}
              Instead of focusing only on an obituary, guest book, slideshow or
              photo board, it gives families a structured place to preserve the
              many parts of a person&apos;s story together.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Life story",
                "Family history",
                "Places lived & worked",
                "Schools & awards",
                "Newspaper articles",
                "Favorite music",
                "Photo gallery",
                "Video Memories",
                "Built-in desktop, laptop & phone camera recording",
                "Obituary information",
                "Final resting place details",
                "Family & friend submissions",
                "Shared Memories Approval",
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

            <div className="mt-7 rounded-2xl border border-amber-300/40 bg-white/10 p-5">
              <h3 className="text-2xl font-bold text-amber-300">
                Celebration of Life Presentation — Free With Every Paid Plan
              </h3>
              <p className="mt-3 text-lg leading-8 text-stone-100">
                Basic, Plus and Premium MyEMemorial plans include the optional
                Celebration of Life Presentation at no additional charge. It
                uses approved photos, captions, Video Memories and favorite
                music already preserved in the MyEMemorial and can be shown
                full-screen on a television or projector at a funeral,
                memorial service or Celebration of Life.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-5 text-stone-900">
              <h3 className="text-2xl font-bold">
                Living MyEMemorial + Designated Person
              </h3>
              <p className="mt-3 text-lg leading-8 text-stone-700">
                A Living MyEMemorial lets someone preserve their own story while
                they are living. After independent death verification, an
                authorized Designated Person can handle permitted after-death
                updates without changing the life story the member preserved. A
                member can also record Video Memories directly into the Living
                MyEMemorial using the built-in camera system on a desktop, laptop,
                or phone, making it possible to preserve stories in their own voice.
              </p>
              <Link
                href="/personal-e-memorials"
                className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full bg-blue-950 px-6 text-base font-bold text-white transition hover:bg-blue-900"
              >
                Explore Living MyEMemorials
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              The Memorial Websites Compared
            </h2>

            <div className="mt-7 space-y-6">
              {services.map((service) => (
                <article
                  key={service.name}
                  className={`rounded-2xl border p-5 md:p-6 ${
                    service.name === "MyEMemorial"
                      ? "border-blue-300 bg-blue-50"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-stone-900">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-base font-bold text-blue-900">
                        {service.bestFor}
                      </p>
                    </div>

                    {service.internal ? (
                      <Link
                        href={service.href}
                        className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-full bg-stone-900 px-5 text-base font-bold text-white transition hover:bg-stone-700"
                      >
                        View MyEMemorial
                      </Link>
                    ) : (
                      <a
                        href={service.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white px-5 text-base font-bold text-stone-900 transition hover:bg-stone-100"
                      >
                        View Provider Source
                      </a>
                    )}
                  </div>

                  <p className="mt-4 text-lg leading-8 text-stone-700">
                    {service.body}
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-base font-bold text-stone-900">Pricing</p>
                      <p className="mt-2 text-base leading-7 text-stone-700">
                        {service.pricing}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-base font-bold text-stone-900">
                        What stands out
                      </p>
                      <p className="mt-2 text-base leading-7 text-stone-700">
                        {service.standout}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Which Memorial Website May Be Best for Your Family?
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[
                [
                  "Choose MyEMemorial if...",
                  "You want a comprehensive, guided life story with photos, Video Memories, favorite music, family history and other life details; you want to record stories directly using your desktop, laptop or phone camera; you value one-time paid pricing; or you want a Living MyEMemorial and a Celebration of Life Presentation included with every paid plan.",
                ],
                [
                  "Choose Ever Loved if...",
                  "Fundraising, funeral RSVPs, event information, livestream details and community participation are central to what your family needs.",
                ],
                [
                  "Choose Scan2Remember if...",
                  "A weatherproof physical QR plaque connecting a grave, urn, bench or keepsake to the digital memorial is your main priority.",
                ],
                [
                  "Choose Kudoboard if...",
                  "Your primary goal is gathering a large number of short messages, photographs and video posts from a group in a collaborative tribute-board format.",
                ],
                [
                  "Choose Keeper if...",
                  "You want a living memorial option, family relationships, multiple administrators and a broad collection of photos, videos, Stories and tributes.",
                ],
                [
                  "Choose Willowise if...",
                  "You want professionals to help build the memorial website and coordinate a hosted virtual memorial service or reception.",
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
              A Note About Long-Term Availability
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Long-term availability matters when choosing any memorial
              service. Some companies specifically advertise lifetime or
              indefinite hosting. Others use subscriptions or annual hosting
              charges. MyEMemorial&apos;s paid plans use one-time purchase
              pricing rather than monthly or annual subscription fees, but
              MyEMemorial does not promise guaranteed permanent or indefinite
              availability in its Terms of Service.
            </p>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              Families should review the current terms of any memorial service
              they choose, especially when a provider uses words such as
              “forever,” “permanent,” or “lifetime.”
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Sources Used for Competitor Information
            </h2>

            <p className="mt-4 text-lg leading-8 text-stone-700">
              The comparison above was checked against current public pages
              published by the providers themselves. These links are provided
              so readers can verify details directly.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                ["CreateMemorial Pricing", "https://creatememorial.com/pricing"],
                ["Ever Loved Memorial Websites", "https://everloved.com/online-memorials/"],
                ["ForeverMissed Plans", "https://www.forevermissed.com/ourplans"],
                ["Keeper Memorials", "https://www.mykeeper.com/"],
                ["Keeper Living Memorial", "https://faq.mykeeper.com/en/docs/memorial-management/living-memorial/living-memorial-overview"],
                ["Scan2Remember Digital Memorial", "https://scan2remember.com/pages/digital-memorial"],
                ["Kudoboard Online Memorial", "https://www.kudoboard.com/online-memorial/"],
                ["Willowise Pricing", "https://willowise.com/pricing/"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  {label} ↗
                </a>
              ))}
            </div>

            <p className="mt-5 text-base leading-7 text-stone-600">
              Last reviewed September 9, 2026. Prices and features may change.
            </p>
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
            <p className="text-base font-bold uppercase tracking-[0.16em] text-blue-900">
              Where Life&apos;s Stories Are Told.
            </p>
            <h2 className="mt-2 text-3xl font-bold text-stone-900">
              See What a MyEMemorial Can Preserve
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Start free, compare paid plans, or experience a sample
              MyEMemorial before deciding what is right for your family.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/memorials"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-base font-bold text-white transition hover:bg-blue-900"
              >
                Compare Departed Plans
              </Link>

              <Link
                href="/personal-e-memorials"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-stone-900 px-6 text-center text-base font-bold text-white transition hover:bg-stone-700"
              >
                Explore Living MyEMemorials
              </Link>

              <Link
                href="/memorial/daniel-james-whitmore"
                className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-base font-bold text-stone-900 transition hover:bg-amber-300"
              >
                Experience a Sample
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-9">
            <h2 className="text-3xl font-bold text-stone-900">
              Continue Comparing Memorial Options
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/memorial-websites"
                className="rounded-2xl border border-stone-200 bg-stone-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <h3 className="text-xl font-bold text-stone-900">
                  Memorial Websites: What to Look For
                </h3>
                <p className="mt-2 text-base leading-7 text-stone-600">
                  Learn what memorial websites can preserve and which features
                  may matter most to your family.
                </p>
              </Link>

              <Link
                href="/create-an-online-memorial"
                className="rounded-2xl border border-stone-200 bg-stone-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <h3 className="text-xl font-bold text-stone-900">
                  How to Create an Online Memorial
                </h3>
                <p className="mt-2 text-base leading-7 text-stone-600">
                  Follow a practical guide to gathering memories and building
                  a memorial website.
                </p>
              </Link>

              <Link
                href="/online-memorial-vs-obituary"
                className="rounded-2xl border border-stone-200 bg-stone-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <h3 className="text-xl font-bold text-stone-900">
                  Online Memorial vs. Obituary
                </h3>
                <p className="mt-2 text-base leading-7 text-stone-600">
                  Compare the role of an obituary with the broader story a
                  memorial website can preserve.
                </p>
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
