import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import type { Metadata } from "next";

type CampaignPage = {
  id: number;
  campaign_name: string;
  slug: string;
  recipient: string | null;
  event_type: string | null;
  caption: string | null;
  headline: string | null;
  story: string | null;
  media_type: "photo" | "video" | null;
  media_url: string | null;
  preview_image_url: string | null;
  primary_cta: "gift" | "sample" | "create" | "learn" | null;
  is_published: boolean;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function getCampaignBySlug(
  slug: string
): Promise<CampaignPage | null> {
  const { data, error } = await supabasePublic
    .from("campaign_pages")
    .select(
  `
    id,
    campaign_name,
    slug,
    recipient,
event_type,
    caption,
    headline,
    story,
    media_type,
    media_url,
    preview_image_url,
    primary_cta,
    is_published
  `
)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(
      "PUBLIC CAMPAIGN LOAD ERROR:",
      error
    );

    return null;
  }

  return data as CampaignPage | null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const campaign =
    await getCampaignBySlug(slug);

  if (!campaign) {
    return {
      title: "MyEMemorial",
    };
  }

  const title =
    campaign.headline ||
    campaign.campaign_name ||
    "MyEMemorial — Where Life’s Stories Are Told";

  const description =
    campaign.caption ||
    campaign.story?.slice(0, 200) ||
    "Preserve a life story with MyEMemorial — Where Life’s Stories Are Told.";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://myememorial.com";

  const campaignUrl =
    `${siteUrl}/campaign/${campaign.slug}`;

  return {
    title,
    description,

    alternates: {
      canonical: campaignUrl,
    },

    openGraph: {
      title,
      description,
      url: campaignUrl,
      siteName: "MyEMemorial",
      type: "website",
      images: campaign.preview_image_url
        ? [
            {
              url: campaign.preview_image_url,
              alt: title,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: campaign.preview_image_url
        ? [campaign.preview_image_url]
        : [],
    },
  };
}

export default async function CampaignLandingPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const campaign =
    await getCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }
const ctas = {
  gift: {
    href: "/gift?type=personal",
    label: campaign.recipient
      ? `Gift ${campaign.recipient} a MyEMemorial`
      : "Gift a MyEMemorial",
  },
  sample: {
    href: "/memorial/daniel-james-whitmore",
    label: "Experience a Sample MyEMemorial",
  },
  create: {
    href: "/create",
    label: "Create a MyEMemorial",
  },
  learn: {
    href: "/our-story",
    label: "Learn More About MyEMemorial",
  },
};

const primaryCta =
  campaign.primary_cta || "gift";

const secondaryCtas:
  Array<keyof typeof ctas> =
  primaryCta === "sample"
    ? ["gift", "learn"]
    : primaryCta === "learn"
      ? ["gift", "sample"]
      : ["sample", "learn"];
  return (
  <main className="min-h-screen bg-stone-50">
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-5 md:px-8">
        <Link href="/" className="inline-flex">
          <img
  src="/Images/myememorial-logo.png"
  alt="MyEmemorial - Where Life's Stories Are Told"
  className="h-auto w-52 max-w-full md:w-56"
/>
        </Link>
      </div>
    </header>

    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10">
            {campaign.media_url && (
        <section className="mb-7">
          {campaign.media_type === "video" ? (
            <div className="w-full overflow-hidden rounded-2xl bg-black shadow-md">
              <MuxPlayer
                playbackId={campaign.media_url}
                streamType="on-demand"
                className="max-h-[520px] w-full bg-black"
              />
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-2xl bg-black shadow-md">
              <img
                src={campaign.media_url}
                alt={campaign.campaign_name}
                className="max-h-[520px] w-full object-contain"
              />
            </div>
          )}
        </section>
      )}

      {campaign.story?.trim() && (
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="whitespace-pre-wrap text-lg leading-8 text-stone-800 md:text-xl md:leading-9">
            {campaign.story}
          </div>
        </section>
      )}

      <section className="mx-auto mt-8 max-w-xl">
  <div className="flex flex-col gap-3">
    <Link
      href={ctas[primaryCta].href}
      className="rounded-2xl bg-amber-700 px-7 py-5 text-center text-lg font-bold text-white transition hover:bg-amber-600 md:text-xl"
    >
      {ctas[primaryCta].label}
    </Link>

    {secondaryCtas.map((key) => (
      <Link
        key={key}
        href={ctas[key].href}
        className="rounded-2xl border border-stone-300 bg-white px-7 py-5 text-center text-lg font-semibold text-stone-800 transition hover:bg-stone-100 md:text-xl"
      >
        {ctas[key].label}
      </Link>
    ))}
  </div>
</section>
    </div>

    <footer className="mt-8 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-6 text-center">
        <p className="text-sm text-stone-500">
          MyEMemorial — Where Life’s Stories Are Told.
        </p>
      </div>
    </footer>
  </main>
);
}