import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "MyEMemorial Plans & Pricing | Free, Basic, Plus & Premium",
  },
  description:
    "Compare MyEMemorial plans and pricing for Departed MyEMemorials and Living MyEMemorials. Start free or choose Basic, Plus, or Premium with one-time pricing.",
  alternates: {
    canonical: "/plans-pricing",
  },
  openGraph: {
    title: "MyEMemorial Plans & Pricing | Free, Basic, Plus & Premium",
    description:
      "Compare Free, Basic, Plus, and Premium plans for both Departed MyEMemorials and Living MyEMemorials.",
    url: "/plans-pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyEMemorial Plans & Pricing | Free, Basic, Plus & Premium",
    description:
      "Compare Free, Basic, Plus, and Premium plans for both Departed MyEMemorials and Living MyEMemorials.",
  },
};

type PricingPlan = {
  name: string;
  price: string;
  href: string;
  features: string[];
  popular?: boolean;
  free?: boolean;
};

const departedPlans: PricingPlan[] = [
  {
    name: "Free Departed MyEMemorial",
    price: "$0",
    href: "/create?mode=memorial&plan=free",
    free: true,
    features: [
      "Featured photo",
      "Up to 5 gallery photos",
      "Life story",
      "Basic personal information",
      "Obituary & Service Information",
      "Final Resting Place",
      "Shared Memories Approval",
      "Public & shareable MyEMemorial",
      "Upgrade anytime",
    ],
  },
  {
    name: "Basic Departed MyEMemorial",
    price: "$49.95",
    href: "/create?mode=memorial&plan=basic",
    features: [
      "Up to 50 photos",
      "Up to 15 minutes of Video Memories",
      "Favorite music",
      "Life story",
      "Family history",
      "Places lived & worked",
      "Schools & awards",
      "Social media links",
      "Obituary & Service Information",
      "Final Resting Place",
      "Shared Memories Approval",
      "Celebration of Life Presentation",
    ],
  },
  {
    name: "Plus Departed MyEMemorial",
    price: "$69.95",
    href: "/create?mode=memorial&plan=plus",
    popular: true,
    features: [
      "Up to 150 photos",
      "Up to 30 minutes of Video Memories",
      "Favorite music",
      "Life story",
      "Family history",
      "Places lived & worked",
      "Schools & awards",
      "Social media links",
      "Obituary & Service Information",
      "Final Resting Place",
      "Shared Memories Approval",
      "Celebration of Life Presentation",
    ],
  },
  {
    name: "Premium Departed MyEMemorial",
    price: "$89.95",
    href: "/create?mode=memorial&plan=premium",
    features: [
      "Unlimited photos",
      "Up to 60 minutes of Video Memories",
      "Favorite music",
      "Life story",
      "Family history",
      "Places lived & worked",
      "Schools & awards",
      "Social media links",
      "Obituary & Service Information",
      "Final Resting Place",
      "Shared Memories Approval",
      "Celebration of Life Presentation",
    ],
  },
];

const livingPlans: PricingPlan[] = [
  {
    name: "Free Living MyEMemorial",
    price: "$0",
    href: "/create?mode=personal&plan=free",
    free: true,
    features: [
      "Featured photo",
      "Up to 5 gallery photos",
      "Life story",
      "Basic personal information",
      "Shared Memories Approval",
      "Public & shareable MyEMemorial",
      "Upgrade anytime",
    ],
  },
  {
    name: "Basic Living MyEMemorial",
    price: "$49.95",
    href: "/create?mode=personal&plan=basic",
    features: [
      "Up to 50 photos",
      "Up to 15 minutes of Video Memories",
      "Favorite music",
      "Life story",
      "Family history",
      "Places lived & worked",
      "Schools & awards",
      "Social media links",
      "Shared Memories Approval",
      "Legacy Instructions",
      "Celebration of Life Presentation",
    ],
  },
  {
    name: "Plus Living MyEMemorial",
    price: "$69.95",
    href: "/create?mode=personal&plan=plus",
    popular: true,
    features: [
      "Up to 150 photos",
      "Up to 30 minutes of Video Memories",
      "Favorite music",
      "Life story",
      "Family history",
      "Places lived & worked",
      "Schools & awards",
      "Social media links",
      "Shared Memories Approval",
      "Legacy Instructions",
      "Celebration of Life Presentation",
    ],
  },
  {
    name: "Premium Living MyEMemorial",
    price: "$89.95",
    href: "/create?mode=personal&plan=premium",
    features: [
      "Unlimited photos",
      "Up to 60 minutes of Video Memories",
      "Favorite music",
      "Life story",
      "Family history",
      "Places lived & worked",
      "Schools & awards",
      "Social media links",
      "Shared Memories Approval",
      "Legacy Instructions",
      "Celebration of Life Presentation",
    ],
  },
];

function PricingCard({ plan }: { plan: PricingPlan }) {
  const dark = plan.popular === true;

  return (
    <div
      className={`relative flex min-w-0 flex-col rounded-[1.5rem] p-5 pt-8 shadow-sm ${
        dark
          ? "border-2 border-blue-950 bg-blue-950 text-white"
          : "border border-stone-200 bg-amber-50 text-stone-900"
      }`}
    >
      {(plan.popular || plan.free) && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold uppercase tracking-[0.14em] shadow-sm ${
              plan.popular
                ? "bg-amber-400 text-stone-900"
                : "border border-amber-200 bg-[#fff8e8] text-stone-700"
            }`}
          >
            {plan.popular ? "Most Popular" : "Free Plan"}
          </div>
        </div>
      )}

      <div className="min-h-[110px] text-center">
        <h3 className="text-base font-bold uppercase tracking-[0.12em]">
          {plan.name}
        </h3>

        <div className="mt-3">
          <span className="text-3xl font-bold">{plan.price}</span>
          <span
            className={`ml-2 text-base ${
              dark ? "text-stone-300" : "text-stone-500"
            }`}
          >
            one-time
          </span>
        </div>
      </div>

      <ul className="mt-2 flex-1 space-y-2 text-base leading-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden="true">{"\u2713"}</span>
            <span className={dark ? "font-semibold" : ""}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.href}
        className={`mt-7 inline-flex min-h-[54px] w-full items-center justify-center rounded-full px-5 text-center text-base font-bold transition ${
          dark
            ? "bg-white text-blue-950 hover:bg-stone-100"
            : "bg-stone-900 text-white hover:bg-stone-700"
        }`}
      >
        {plan.free ? "Free Plan" : "Choose Plan"}
      </Link>
    </div>
  );
}

function PricingSection({
  eyebrow,
  title,
  description,
  plans,
}: {
  eyebrow: string;
  title: string;
  description: string;
  plans: PricingPlan[];
}) {
  return (
    <section className="mt-12 rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
      <div className="text-center">
        <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-stone-900 md:text-4xl">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-3xl text-lg leading-8 text-stone-600">
          {description}
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </div>

      <p className="mt-6 text-center text-base leading-7 text-stone-500">
        Paid plans are one-time payments with no recurring subscription fee.
      </p>
    </section>
  );
}

export default function PlansPricingPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <section className="text-center">
          <p className="text-base font-bold uppercase tracking-[0.18em] text-blue-900">
            MyEMemorial Plans & Pricing
          </p>

          <h1 className="mx-auto mt-3 max-w-4xl text-3xl font-bold leading-tight text-stone-900 md:text-5xl">
            Choose the MyEMemorial Plan That Fits the Story You Want to Preserve
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-stone-600">
            Start free or choose Basic, Plus, or Premium. MyEMemorial offers
            separate options for those who have passed and for those still here
            who want to tell their own story.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-stone-300 bg-stone-900 p-7 text-white shadow-sm">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-300">
              For Those Who Have Passed
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Departed MyEMemorials
            </h2>

            <p className="mt-4 text-base leading-7 text-stone-200">
              Create an online memorial for someone who has passed and preserve
              their life story, photographs, videos, music, family history,
              obituary and service information, final resting place, and
              memories in one lasting place.
            </p>

            <Link
              href="/memorials"
              className="mt-6 inline-flex min-h-[56px] items-center justify-center rounded-full bg-amber-400 px-6 text-base font-bold text-stone-900 transition hover:bg-amber-300"
            >
              Explore Departed MyEMemorials
            </Link>
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-7 shadow-sm">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-800">
              For Those Still Here Who Want to Tell Their Own Story
            </p>

            <h2 className="mt-3 text-3xl font-bold text-stone-900">
              Living MyEMemorials
            </h2>

            <p className="mt-4 text-base leading-7 text-stone-700">
              Create your own Living MyEMemorial while you are here so you can
              tell your story in your own words and preserve your memories,
              photographs, videos, family history, and legacy for future
              generations.
            </p>

            <Link
              href="/personal-e-memorials"
              className="mt-6 inline-flex min-h-[56px] items-center justify-center rounded-full bg-blue-950 px-6 text-base font-bold text-white transition hover:bg-blue-900"
            >
              Explore Living MyEMemorials
            </Link>
          </div>
        </section>

        <PricingSection
          eyebrow="For Those Who Have Passed"
          title="Departed MyEMemorial Plans"
          description="Choose a Departed MyEMemorial to preserve the life and memories of someone who has passed."
          plans={departedPlans}
        />

        <PricingSection
          eyebrow="For Those Still Here Who Want to Tell Their Own Story"
          title="Living MyEMemorial Plans"
          description="Choose a Living MyEMemorial to preserve your own life story in your own words while you are here."
          plans={livingPlans}
        />


      </div>
    </main>
  );
}