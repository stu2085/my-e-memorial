"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import SideAd from "../components/SideAd";
import { supabase } from "../lib/supabase";

const benefits = [
  {
    icon: "🎙️",
    title: "Tell Your Story in Your Own Words",
    text: "Preserve the experiences, memories, lessons, and moments that shaped your life while you can still tell them yourself.",
  },
  {
    icon: "📷",
    title: "Preserve Photos and Memories",
    text: "Bring together meaningful photos, stories, videos, favorite songs, family history, and important life events.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Share With Family",
    text: "Give your children, grandchildren, relatives, and future generations a place where they can truly know your story.",
  },
  {
    icon: "🔐",
    title: "You Stay in Control",
    text: "Continue updating your Living MyEMemorial throughout your life and decide how and when it is shared.",
  },
];

function PersonalEMemorialPageContent() {
  const searchParams = useSearchParams();
  const [resourceZip, setResourceZip] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [zipError, setZipError] = useState("");
  const adGroupRef = useRef<HTMLDivElement | null>(null);
  const [adStickyTop, setAdStickyTop] = useState(160);
  const [showLegacyInstructions, setShowLegacyInstructions] = useState(false);
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const upgradeMemorialId = Number(searchParams.get("upgrade") || 0);
  const isUpgradeFlow =
    Number.isInteger(upgradeMemorialId) && upgradeMemorialId > 0;

  useEffect(() => {
    async function loadVisitorZip() {
      try {
        const res = await fetch("/api/ip-lookup");
        const data = await res.json();

        if (data.zip) {
          const detectedZip = String(data.zip).slice(0, 5);
          setResourceZip(detectedZip);
          setZipInput(detectedZip);
        }
      } catch (err) {
        console.error("VISITOR ZIP ERROR:", err);
      }
    }

    loadVisitorZip();
  }, []);

  useEffect(() => {
    const adGroup = adGroupRef.current;

    if (!adGroup) {
      return;
    }

    const updateStickyTop = () => {
      const navClearance = 160;
      const bottomGap = 16;
      const groupHeight = adGroup.getBoundingClientRect().height;
      const viewportAwareTop = window.innerHeight - groupHeight - bottomGap;

      setAdStickyTop(Math.min(navClearance, viewportAwareTop));
    };

    updateStickyTop();

    const resizeObserver = new ResizeObserver(updateStickyTop);
    resizeObserver.observe(adGroup);
    window.addEventListener("resize", updateStickyTop);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [resourceZip]);

  function handleUpdateResourceZip() {
    const cleanedZip = zipInput.replace(/\D/g, "").slice(0, 5);

    if (cleanedZip.length !== 5) {
      setZipError("Enter a valid 5-digit ZIP code.");
      return;
    }

    setZipInput(cleanedZip);
    setResourceZip(cleanedZip);
    setZipError("");
  }

  function openLocalResourceSearch(searchTerm: string) {
    const zip = resourceZip || zipInput.replace(/\D/g, "").slice(0, 5);
    const query = zip ? `${searchTerm} near ${zip}` : searchTerm;

    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleNewPaidPlanCheckout(
    plan: "basic" | "plus" | "premium"
  ) {
    if (isStartingUpgrade) {
      return;
    }

    setUpgradeError("");
    setIsStartingUpgrade(true);

    const planPrices = {
      basic: 4995,
      plus: 6995,
      premium: 8995,
    } as const;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          amount: planPrices[plan],
          returnUrl:
            `${window.location.origin}/create?mode=personal` +
            `&plan=${encodeURIComponent(plan)}`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.url) {
        setUpgradeError(
          result?.error || "Could not start checkout. Please try again."
        );
        return;
      }

      if (
        typeof window !== "undefined" &&
        typeof (window as any).fbq === "function"
      ) {
        (window as any).fbq("track", "InitiateCheckout", {
          value: planPrices[plan] / 100,
          currency: "USD",
          content_name: plan,
        });
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("PERSONAL MYEMEMORIAL CHECKOUT ERROR:", error);
      setUpgradeError(
        "There was a problem starting checkout. Please try again."
      );
    } finally {
      setIsStartingUpgrade(false);
    }
  }

  async function handleExistingMemorialUpgrade(
    toPlan: "basic" | "plus" | "premium"
  ) {
    if (!isUpgradeFlow || isStartingUpgrade) {
      return;
    }

    setUpgradeError("");
    setIsStartingUpgrade(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setUpgradeError(
          "Please sign in again before upgrading your Living MyEMemorial."
        );
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: toPlan,
          amount: 0,
          memorialId: upgradeMemorialId,
          checkoutType: "upgrade",
          fromPlan: "free",
          toPlan,
          returnUrl:
            `${window.location.origin}/create?edit=${upgradeMemorialId}` +
            `&mode=personal&upgrade_success=true`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.url) {
        setUpgradeError(
          result?.error || "Could not start the upgrade checkout."
        );
        return;
      }

      // This pricing page is only an intermediate step for an existing
      // memorial upgrade. Replace it in browser history so the browser Back
      // button from Stripe returns to the memorial instead of the pricing page.
      window.location.replace(result.url);
    } catch (error) {
      console.error("PERSONAL MYEMEMORIAL UPGRADE ERROR:", error);
      setUpgradeError(
        "There was a problem starting the upgrade checkout. Please try again."
      );
    } finally {
      setIsStartingUpgrade(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec]">
      <section className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <div
              className="aspect-[9/4] w-full bg-stone-100 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  "url('/personal-myememorial-create-hero.png')",
              }}
              role="img"
              aria-label="A life journey from babyhood through young family years with the message Tell it here, Be Remembered Forever."
            />

            <div className="flex flex-col items-center justify-center gap-3 border-t border-stone-200 bg-white px-6 py-6 sm:flex-row sm:flex-wrap md:py-7">
              <Link
                href="#pricing"
                className="inline-flex min-h-[68px] w-full max-w-[390px] items-center justify-center rounded-full bg-amber-400 px-8 text-center text-lg font-bold text-stone-900 shadow-sm transition hover:bg-amber-300"
              >
                Choose Your Living MyEMemorial Plan
              </Link>

              <Link
                href="/gift?type=personal"
                className="inline-flex min-h-[68px] w-full max-w-[390px] items-center justify-center rounded-full bg-blue-950 px-8 text-center text-lg font-bold text-white shadow-sm transition hover:bg-blue-900"
              >
                🎁 Gift a Living MyEMemorial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-base font-bold uppercase tracking-[0.16em] text-stone-500">
                    Local Living Resources
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-stone-900">
                    Planning Ahead
                  </h2>

                  <p className="mt-2 text-base leading-7 text-stone-600">
                    Find local services to help plan and protect your legacy.
                  </p>

                  <label
                    htmlFor="personal-resource-zip"
                    className="mt-4 block text-base font-bold text-stone-900"
                  >
                    ZIP Code
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      id="personal-resource-zip"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={zipInput}
                      onChange={(event) => {
                        setZipInput(
                          event.target.value.replace(/\D/g, "").slice(0, 5)
                        );
                        setZipError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleUpdateResourceZip();
                        }
                      }}
                      placeholder="Enter ZIP"
                      className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-amber-500"
                      aria-describedby={
                        zipError ? "personal-resource-zip-error" : undefined
                      }
                    />

                    <button
                      type="button"
                      onClick={handleUpdateResourceZip}
                      className="rounded-xl bg-blue-950 px-3 py-2 text-base font-bold text-white transition hover:bg-blue-900"
                    >
                      Update
                    </button>
                  </div>

                  {zipError && (
                    <p
                      id="personal-resource-zip-error"
                      className="mt-2 text-base font-semibold text-red-700"
                    >
                      {zipError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openLocalResourceSearch("estate planning attorneys")}
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">⚖️</span>
                  <span className="mt-2 block font-bold text-stone-900">
                    Estate Planning Attorneys
                  </span>
                  <span className="mt-1 block text-base text-stone-600">
                    Find local attorneys
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openLocalResourceSearch("wills and trusts attorneys")}
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">📜</span>
                  <span className="mt-2 block font-bold text-stone-900">
                    Wills & Trusts
                  </span>
                  <span className="mt-1 block text-base text-stone-600">
                    Find planning resources
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openLocalResourceSearch("financial advisors")}
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">📈</span>
                  <span className="mt-2 block font-bold text-stone-900">
                    Financial Planning
                  </span>
                  <span className="mt-1 block text-base text-stone-600">
                    Find local advisors
                  </span>
                </button>
              </div>

              <div
                ref={adGroupRef}
                className="sticky mt-6 space-y-4"
                style={{ top: `${adStickyTop}px` }}
              >
                <SideAd
                  pageType="personal"
                  memorialZip={resourceZip || null}
                  forcedCategory="funeral_home"
                  sticky={false}
                />

                <SideAd
                  pageType="personal"
                  memorialZip={resourceZip || null}
                  forcedCategory="monument_company"
                  sticky={false}
                />
              </div>
            </aside>

            <div className="space-y-8">
              <section className="overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-sm">
  <div className="grid items-stretch lg:grid-cols-[0.9fr_1.1fr]">
    <div className="flex flex-col justify-center p-7 md:p-9">
      <p className="text-base font-bold uppercase tracking-[0.2em] text-amber-300">
        See What a Living MyEMemorial Can Become
      </p>

      <h2 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">
        Preserve Your Story in Your Own Voice
      </h2>

      <p className="mt-4 text-base leading-7 text-stone-200 md:text-lg">
        In just a few moments, see how a Living MyEMemorial helps you
        preserve the stories, memories, photos, videos, music, and experiences
        that make your life uniquely yours.
      </p>

    <ul className="mt-5 list-disc space-y-2 pl-6 text-base font-semibold text-stone-200">
  <li>Tell your story</li>
  <li>Add photos & videos</li>
  <li>Share with family</li>
  <li>Plus much more</li>
</ul>
    </div>

    <div className="relative min-h-[300px] bg-black lg:min-h-[390px]">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        loop
        poster="/Images/homepage-hero.png"
        aria-label="Introduction to Living MyEMemorials"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

      <div className="absolute bottom-5 left-5 right-5">
        <div className="inline-flex items-center gap-3 rounded-full bg-black/65 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-blue-950">
            ▶
          </span>

          Living MyEMemorial Introduction
        </div>
      </div>
    </div>
  </div>
</section>

              <section>
                <div className="text-center">
                  <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
                    Why Create One?
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    Your Life Is More Than Two Dates
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
                    >
                      <div className="text-3xl">{benefit.icon}</div>

                      <h3 className="mt-3 text-lg font-bold text-stone-900">
                        {benefit.title}
                      </h3>

                     <p className="mt-2 text-lg leading-7 text-stone-600">
  {benefit.text}
</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                <div className="text-center">
                  <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
                    How It Works
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    Create It Now. Keep Adding to It. Preserve It Forever.
                  </h2>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  <div className="rounded-2xl bg-stone-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                      1
                    </div>

                    <h3 className="mt-4 font-bold text-stone-900">
                      Create Your Story
                    </h3>

                    <p className="mt-2 text-lg leading-7 text-stone-600">
                      Add your life story, photos, family history, memories,
                      videos, music, and meaningful experiences.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-stone-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                      2
                    </div>

                    <h3 className="mt-4 font-bold text-stone-900">
                      Keep It Growing
                    </h3>

                    <p className="mt-2 text-lg leading-7 text-stone-600">
                      Continue adding memories throughout your life and decide
                      when and how you want your Living MyEMemorial shared.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-stone-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                      3
                    </div>

                    <h3 className="mt-4 font-bold text-stone-900">
                      Add Legacy Instructions
                    </h3>

                    <p className="mt-2 text-lg leading-7 text-stone-600">
                      Basic, Plus, and Premium plans let you name trusted Backup
                      Persons and leave private instructions for the future.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-8">
                <div className="grid items-center gap-8 lg:grid-cols-2">
                  <div>
                    <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
                      In Your Own Voice
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-stone-900">
                      Record Memories Directly From Your Phone or Computer
                    </h2>

                    <p className="mt-4 text-lg leading-7 text-stone-700">
                      Living MyEMemorials will allow you to record video
                      memories directly from your camera and microphone, making
                      it easier to preserve your voice, expressions, stories,
                      and personality.
                    </p>

                    <p className="mt-4 text-lg leading-7 text-stone-600">
                      This feature is integrated with the existing Video
                      Memories system so recorded videos become part of your
                      memorial just like uploaded videos.
                    </p>
                  </div>

                  <div className="flex min-h-[280px] items-center justify-center rounded-3xl bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <div className="text-6xl">🎥</div>
                      <p className="mt-4 text-lg font-bold text-stone-900">
                        Write Your Answer
                      </p>
                      <p className="mt-1 text-base text-stone-500">or</p>
                      <p className="mt-1 text-lg font-bold text-amber-700">
                        Record Your Answer
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="pricing" className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                <div className="text-center">
                  <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-700">
                    Living MyEMemorial Plans
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    {isUpgradeFlow
                      ? "Choose Your Upgrade Plan"
                      : "Start Free or Choose the Plan That Fits Your Story"}
                  </h2>

                  <p className="mx-auto mt-3 max-w-3xl text-lg leading-7 text-stone-600">
                    {isUpgradeFlow
                      ? "Your Free Living MyEMemorial is already saved. Choose Basic, Plus, or Premium below to unlock more features without starting over."
                      : "Basic, Plus, and Premium Living MyEMemorial plans include Legacy Instructions for trusted Designated Person access and private planning information, plus the optional Celebration of Life Presentation at no additional charge."}
                  </p>

                  {upgradeError && (
                    <p className="mx-auto mt-5 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
                      {upgradeError}
                    </p>
                  )}
                </div>

                <div
                  className={`mt-8 grid gap-6 md:grid-cols-2 ${
                    isUpgradeFlow ? "xl:grid-cols-3" : "xl:grid-cols-4"
                  }`}
                >
                  {!isUpgradeFlow && (
                    <PlanCard
                      title="Free Living MyEMemorial"
                      price="$0"
                      href="/create?mode=personal&plan=free"
                      badge="Start Free"
                      items={[
                        "Featured photo",
                        "Up to 5 gallery photos",
                        "Life story",
                        "Basic personal information",
                        "Shared Memories Approval",
                        "Public & shareable MyEMemorial",
                        "Upgrade anytime",
                      ]}
                    />
                  )}

                  <PlanCard
                    title="Basic Living MyEMemorial"
                    price="$49.95"
                    href="/create?mode=personal&plan=basic"
                    buttonLabel={isUpgradeFlow ? "Upgrade to Basic" : "Choose Plan"}
                    onChoosePlan={
                      isUpgradeFlow
                        ? () => handleExistingMemorialUpgrade("basic")
                        : () => handleNewPaidPlanCheckout("basic")
                    }
                    disabled={isStartingUpgrade}
                    legacyInstructions
                    onShowLegacyInstructions={() => setShowLegacyInstructions(true)}
                    items={[
                      "Up to 50 photos",
                      "Up to 15 minutes of Video Memories",
                      "Favorite music",
                      "Life story",
                      "Family history",
                      "Places lived & worked",
                      "Schools & awards",
                      "Social media links",
                      "Shared Memories Approval",
                      "__NEW_CELEBRATION_PRESENTATION__",
                    ]}
                  />

                  <PlanCard
                    title="Plus Living MyEMemorial"
                    price="$69.95"
                    href="/create?mode=personal&plan=plus"
                    dark
                    badge="Most Popular"
                    buttonLabel={isUpgradeFlow ? "Upgrade to Plus" : "Choose Plan"}
                    onChoosePlan={
                      isUpgradeFlow
                        ? () => handleExistingMemorialUpgrade("plus")
                        : () => handleNewPaidPlanCheckout("plus")
                    }
                    disabled={isStartingUpgrade}
                    legacyInstructions
                    onShowLegacyInstructions={() => setShowLegacyInstructions(true)}
                    items={[
                      "Up to 150 photos",
                      "Up to 30 minutes of Video Memories",
                      "Favorite music",
                      "Life story",
                      "Family history",
                      "Places lived & worked",
                      "Schools & awards",
                      "Social media links",
                      "Shared Memories Approval",
                      "__NEW_CELEBRATION_PRESENTATION__",
                    ]}
                  />

                  <PlanCard
                    title="Premium Living MyEMemorial"
                    price="$89.95"
                    href="/create?mode=personal&plan=premium"
                    buttonLabel={isUpgradeFlow ? "Upgrade to Premium" : "Choose Plan"}
                    onChoosePlan={
                      isUpgradeFlow
                        ? () => handleExistingMemorialUpgrade("premium")
                        : () => handleNewPaidPlanCheckout("premium")
                    }
                    disabled={isStartingUpgrade}
                    legacyInstructions
                    onShowLegacyInstructions={() => setShowLegacyInstructions(true)}
                    items={[
                      "Unlimited photos",
                      "Up to 60 minutes of Video Memories",
                      "Favorite music",
                      "Life story",
                      "Family history",
                      "Places lived & worked",
                      "Schools & awards",
                      "Social media links",
                      "Shared Memories Approval",
                      "__NEW_CELEBRATION_PRESENTATION__",
                    ]}
                  />
                </div>

                <p className="mt-5 text-center text-base leading-7 text-stone-500">
                  Paid plans are one-time payments with no recurring subscription fee.
                </p>
              </section>

              <section className="rounded-[2rem] bg-blue-950 p-7 text-center text-white shadow-sm md:p-10">
                <p className="text-base font-bold uppercase tracking-[0.18em] text-amber-300">
                  Preserve the Story Only You Can Tell
                </p>

                <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Give Your Family More Than Names, Dates, and Photographs
                </h2>

                <p className="mx-auto mt-4 max-w-3xl text-lg leading-7 text-stone-200">
                  Create a place where future generations can hear your voice, see your memories, understand your experiences, and truly know your story.
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="#pricing"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-base font-bold text-stone-900 transition hover:bg-amber-300"
                  >
                    Choose Your Living MyEMemorial Plan
                  </Link>

                  <Link
                    href="/gift?type=personal"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/20"
                  >
                    🎁 Give One as a Gift
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {showLegacyInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={() => setShowLegacyInstructions(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legacy-instructions-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold uppercase tracking-[0.16em] text-amber-700">
                  Included With Paid Living Plans
                </p>
                <h2
                  id="legacy-instructions-title"
                  className="mt-2 text-3xl font-bold text-stone-900"
                >
                  Legacy Instructions Package
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowLegacyInstructions(false)}
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-stone-300 bg-white text-xl font-bold text-stone-700 transition hover:bg-stone-100"
                aria-label="Close Legacy Instructions details"
              >
                ×
              </button>
            </div>

            <p className="mt-5 text-lg leading-7 text-stone-700">
              The Legacy Instructions Package gives you a private way to name
              trusted people and leave helpful information for the future. It is
              included with Basic, Plus, and Premium Living MyEMemorial plans.
            </p>

            <ul className="mt-5 space-y-3 text-lg leading-7 text-stone-700">
              <li>✓ Primary and Secondary Backup Person</li>
              <li>✓ Important document locations</li>
              <li>✓ Funeral-home preferences and contact information</li>
              <li>✓ Private Legacy Instructions and a private message</li>
              <li>✓ Controlled Backup Person access when needed</li>
            </ul>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-base font-semibold leading-7 text-blue-950">
                Your Legacy Instructions stay private and do not appear on the
                public Living MyEMemorial. Use them to explain where important
                documents can be found — never to store passwords, PINs, account
                numbers, Social Security numbers, or other confidential credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLegacyInstructions(false)}
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-blue-950 px-6 text-base font-bold text-white transition hover:bg-blue-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PersonalEMemorialPage() {
  return (
    <Suspense fallback={null}>
      <PersonalEMemorialPageContent />
    </Suspense>
  );
}

function NewBurst({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center bg-yellow-300 text-stone-950 shadow-lg font-black uppercase ${
        compact
          ? "h-16 w-16 text-base tracking-normal"
          : "h-28 w-28 text-xl tracking-[0.08em]"
      }`}
      style={{
        clipPath:
          "polygon(50% 0%, 59% 18%, 76% 6%, 78% 27%, 98% 24%, 84% 40%, 100% 50%, 82% 59%, 96% 76%, 76% 75%, 74% 96%, 58% 82%, 50% 100%, 41% 82%, 24% 95%, 23% 75%, 3% 77%, 17% 59%, 0% 50%, 17% 41%, 3% 24%, 24% 27%, 25% 5%, 42% 18%)",
      }}
      aria-label="All New"
    >
      <span className={`text-center ${compact ? "leading-none" : "leading-tight"}`}>
        ALL
        <br />
        NEW
      </span>
    </div>
  );
}

function PlanCard({
  title,
  price,
  items,
  href,
  dark = false,
  badge,
  legacyInstructions = false,
  onShowLegacyInstructions,
  onChoosePlan,
  buttonLabel,
  disabled = false,
}: {
  title: React.ReactNode;
  price: string;
  items: string[];
  href: string;
  dark?: boolean;
  badge?: string;
  legacyInstructions?: boolean;
  onShowLegacyInstructions?: () => void;
  onChoosePlan?: () => void;
  buttonLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`relative flex min-w-0 flex-col rounded-[1.25rem] p-5 pt-8 shadow-sm ${
        dark
          ? "border-2 border-blue-950 bg-blue-950 text-white"
          : "border border-stone-200 bg-stone-50 text-stone-900"
      }`}
    >
      {badge && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
          {badge === "Most Popular" ? (
            <div className="whitespace-nowrap rounded-full bg-amber-400 px-5 py-2 text-center text-base font-bold uppercase tracking-[0.12em] text-stone-900 shadow">
              {badge}
            </div>
          ) : (
            <div
              className={`whitespace-nowrap rounded-full px-4 py-2 text-base font-bold uppercase tracking-[0.12em] shadow-sm ${
                dark
                  ? "bg-white text-blue-950"
                  : "border border-stone-300 bg-white text-stone-700"
              }`}
            >
              {badge}
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-[94px] flex-col items-center justify-start text-center">
        <p
          className={`text-base font-bold uppercase tracking-[0.12em] ${
            dark ? "text-stone-200" : "text-stone-600"
          }`}
        >
          {title}
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-center gap-2">
          <span className="text-3xl font-bold">{price}</span>
          <span
            className={`pb-1 text-base ${
              dark ? "text-stone-300" : "text-stone-500"
            }`}
          >
            one-time
          </span>
        </div>
      </div>

      <ul
        className={`mt-2 space-y-1.5 text-base leading-6 ${
          dark ? "text-stone-100" : "text-stone-700"
        }`}
      >
        {items.map((item) =>
          item === "__NEW_CELEBRATION_PRESENTATION__" ? (
            <li
              key={item}
              className="mt-3 rounded-xl border-2 border-yellow-300 bg-yellow-50 px-2.5 py-2.5 text-center text-stone-950 shadow-sm"
            >
              <div className="flex items-center justify-center gap-1">
                <NewBurst compact />
                <p className="min-w-0 flex-1 pr-1 text-base font-medium leading-5">
                  Celebration
                  <br />
                  of Life
                  <br />
                  Presentation
                </p>
              </div>
            </li>
          ) : (
            <li key={item} className="flex items-start gap-2">
              <span className="shrink-0 font-bold">✓</span>
              <span>{item}</span>
            </li>
          )
        )}
      </ul>

      {legacyInstructions && (
        <div
          className={`mt-4 border-t pt-4 ${
            dark ? "border-white/25" : "border-stone-300"
          }`}
        >
          <p className="text-base font-bold">✓ Legacy Instructions</p>
          <button
            type="button"
            onClick={onShowLegacyInstructions}
            className={`mt-2 inline-flex text-base font-bold underline decoration-2 underline-offset-4 transition ${
              dark
                ? "text-amber-300 hover:text-amber-200"
                : "text-blue-900 hover:text-blue-700"
            }`}
            aria-haspopup="dialog"
          >
            See what&apos;s included →
          </button>
        </div>
      )}

      <div className="mt-auto pt-5">
        {onChoosePlan ? (
          <button
            type="button"
            onClick={onChoosePlan}
            disabled={disabled}
            className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              dark
                ? "bg-white text-stone-900 hover:bg-stone-200"
                : "bg-stone-900 text-white hover:bg-stone-700"
            }`}
          >
            {disabled ? "Opening Checkout..." : buttonLabel || "Upgrade"}
          </button>
        ) : (
          <Link
            href={href}
            className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-full px-5 py-2.5 text-base font-semibold transition ${
              dark
                ? "bg-white text-stone-900 hover:bg-stone-200"
                : "bg-stone-900 text-white hover:bg-stone-700"
            }`}
          >
            {buttonLabel || (badge === "Start Free" ? "Start Free" : "Choose Plan")}
          </Link>
        )}
      </div>
    </div>
  );
}

