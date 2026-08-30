"use client";

import { FormEvent, useEffect, useState } from "react";

type GiftPlan = "basic" | "plus" | "premium";
type GiftType = "memorial" | "personal";

type GiftCheckoutDraft = {
  giftType: GiftType;
  purchaserName: string;
  purchaserEmail: string;
  recipientName: string;
  recipientEmail: string;
  personalMessage: string;
  plan: GiftPlan;
  agreedToTerms: boolean;
};

const GIFT_CHECKOUT_DRAFT_KEY = "myememorial_gift_checkout_draft";

const plans: Array<{
  id: GiftPlan;
  name: string;
  price: string;
  description: string;
  videoMinutes: string;
}> = [
  {
    id: "basic",
    name: "Basic MyEMemorial",
    price: "$49.95",
    description: "A meaningful way to preserve a loved one’s story.",
    videoMinutes: "Up to 15 minutes of video memories",
  },
  {
    id: "plus",
    name: "Plus MyEMemorial",
    price: "$69.95",
    description: "More room for photos, videos, stories, and memories.",
    videoMinutes: "Up to 30 minutes of video memories",
  },
  {
    id: "premium",
    name: "Premium MyEMemorial",
    price: "$89.95",
    description: "Our most complete memorial experience.",
    videoMinutes: "Up to 60 minutes of video memories",
  },
];

export default function GiftPage() {
  const [giftType, setGiftType] = useState<GiftType>("memorial");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [plan, setPlan] = useState<GiftPlan>("plus");

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [wasCancelled, setWasCancelled] = useState(false);

  useEffect(() => {
    const handlePageShow = () => {
      setIsSubmitting(false);
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedGiftType: GiftType =
      params.get("type") === "personal" ? "personal" : "memorial";
    const cancelled = params.get("cancelled") === "true";

    setGiftType(requestedGiftType);
    setWasCancelled(cancelled);

    if (!cancelled) {
      return;
    }

    try {
      const savedDraft = window.sessionStorage.getItem(
        GIFT_CHECKOUT_DRAFT_KEY
      );

      if (!savedDraft) {
        return;
      }

      const draft = JSON.parse(savedDraft) as Partial<GiftCheckoutDraft>;

      if (draft.giftType !== requestedGiftType) {
        return;
      }

      if (typeof draft.purchaserName === "string") {
        setPurchaserName(draft.purchaserName);
      }

      if (typeof draft.purchaserEmail === "string") {
        setPurchaserEmail(draft.purchaserEmail);
      }

      if (typeof draft.recipientName === "string") {
        setRecipientName(draft.recipientName);
      }

      if (typeof draft.recipientEmail === "string") {
        setRecipientEmail(draft.recipientEmail);
      }

      if (typeof draft.personalMessage === "string") {
        setPersonalMessage(draft.personalMessage);
      }

      if (
        draft.plan === "basic" ||
        draft.plan === "plus" ||
        draft.plan === "premium"
      ) {
        setPlan(draft.plan);
      }

      if (typeof draft.agreedToTerms === "boolean") {
        setAgreedToTerms(draft.agreedToTerms);
      }
    } catch (error) {
      console.error("GIFT CHECKOUT DRAFT RESTORE ERROR:", error);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setWasCancelled(false);

    if (
      !purchaserName.trim() ||
      !purchaserEmail.trim() ||
      !recipientName.trim() ||
      !recipientEmail.trim()
    ) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(
        "Please confirm that you understand how the Gift a MyEMemorial purchase works."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/gift-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  purchaserName,
  purchaserEmail,
  recipientName,
  recipientEmail,
  personalMessage,
  plan,
  giftType,
}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Could not begin the gift purchase."
        );
      }

      if (!result.checkoutUrl) {
        throw new Error("Stripe Checkout did not return a payment link.");
      }

      try {
        const draft: GiftCheckoutDraft = {
          giftType,
          purchaserName,
          purchaserEmail,
          recipientName,
          recipientEmail,
          personalMessage,
          plan,
          agreedToTerms,
        };

        window.sessionStorage.setItem(
          GIFT_CHECKOUT_DRAFT_KEY,
          JSON.stringify(draft)
        );
      } catch (error) {
        console.error("GIFT CHECKOUT DRAFT SAVE ERROR:", error);
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      console.error("Gift checkout error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not begin the gift purchase."
      );

      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-10">
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="text-center md:text-left">
              <p className="mb-3 text-base font-semibold uppercase tracking-[0.2em] text-amber-700">
                {giftType === "personal"
                  ? "Gift a Living MyEMemorial"
                  : "Gift a Departed MyEMemorial"}
              </p>

              <img
                src="/Images/gift-myememorial-reaction.webp"
                alt="A delighted recipient reacting to a MyEMemorial gift on a laptop"
                className="float-right mb-2 ml-4 block h-[92px] w-[138px] rounded-xl object-cover shadow-sm md:hidden"
              />

              <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
                {giftType === "personal"
                  ? "Give someone living the opportunity to preserve their own life story"
                  : "Give someone a meaningful way to preserve the life of someone they love"}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
                {giftType === "personal"
                  ? "Purchase a Living MyEMemorial for someone you care about. They will receive an invitation to claim the gift and preserve their story while they can still help tell it themselves."
                  : "Purchase a Departed MyEMemorial for someone you care about. They will receive an invitation to claim the gift and begin preserving the story and memories of a loved one who has passed away."}
              </p>
            </div>

            <div className="hidden md:block">
              <img
                src="/Images/gift-myememorial-reaction.webp"
                alt="A delighted recipient reacting to a MyEMemorial gift on a laptop"
                className="h-[145px] w-full rounded-2xl object-cover shadow-sm lg:h-[155px]"
              />
            </div>
          </div>
        </section>

        {wasCancelled && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-base text-amber-900">
            Your payment was cancelled. You have not been charged. You may
            review the information below and try again.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="text-xl font-bold text-stone-900">
              Choose the Gift Plan
            </h2>

            <p className="mt-2 text-base text-stone-600">
              The recipient will receive the plan you select below.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {plans.map((giftPlan) => {
                const isSelected = plan === giftPlan.id;

                return (
                  <label
                    key={giftPlan.id}
                    className={`relative cursor-pointer rounded-2xl border p-5 transition ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                        : "border-stone-200 bg-white hover:border-stone-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={giftPlan.id}
                      checked={isSelected}
                      onChange={() => setPlan(giftPlan.id)}
                      className="sr-only"
                    />

                    {giftPlan.id === "plus" && (
                      <span className="absolute right-4 top-4 rounded-full bg-stone-900 px-3 py-1 text-base font-semibold text-white">
                        Popular
                      </span>
                    )}

                    <div className="pr-16">
                      <h3 className="font-bold text-stone-900">
                        {giftType === "personal" ? `${giftPlan.name.replace(" MyEMemorial", "")} Living MyEMemorial` : `${giftPlan.name.replace(" MyEMemorial", "")} Departed MyEMemorial`}
                      </h3>

                      <p className="mt-2 text-2xl font-bold text-stone-900">
                        {giftPlan.price}
                      </p>
                    </div>

                    <p className="mt-4 text-base leading-6 text-stone-600">
                      {giftPlan.description}
                    </p>

                    <p className="mt-3 text-base font-semibold text-stone-800">
                      {giftPlan.videoMinutes}
                    </p>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="border-t border-stone-200 pt-8">
            <h2 className="text-xl font-bold text-stone-900">
              Your Information
            </h2>

            <p className="mt-2 text-base text-stone-600">
              We will send the purchase confirmation to this email address.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="purchaserName"
                  className="block text-base font-semibold text-stone-800"
                >
                  Your name
                </label>

                <input
                  id="purchaserName"
                  name="purchaserName"
                  type="text"
                  autoComplete="name"
                  required
                  value={purchaserName}
                  onChange={(event) => setPurchaserName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label
                  htmlFor="purchaserEmail"
                  className="block text-base font-semibold text-stone-800"
                >
                  Your email
                </label>

                <input
                  id="purchaserEmail"
                  name="purchaserEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={purchaserEmail}
                  onChange={(event) => setPurchaserEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-stone-200 pt-8">
            <h2 className="text-xl font-bold text-stone-900">
              Gift Recipient
            </h2>

            <p className="mt-2 text-base text-stone-600">
  {giftType === "personal"
    ? "This is the person who will receive, claim, and create their own Living MyEMemorial."
    : "This is the person who will receive the gift and create a memorial for someone who has passed away."}
</p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="recipientName"
                  className="block text-base font-semibold text-stone-800"
                >
                  Recipient’s name
                </label>

                <input
                  id="recipientName"
                  name="recipientName"
                  type="text"
                  required
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label
                  htmlFor="recipientEmail"
                  className="block text-base font-semibold text-stone-800"
                >
                  Recipient’s email
                </label>

                <input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="personalMessage"
                className="block text-base font-semibold text-stone-800"
              >
                Personal message{" "}
                <span className="font-normal text-stone-500">(optional)</span>
              </label>

              <textarea
                id="personalMessage"
                name="personalMessage"
                rows={5}
                maxLength={2000}
                value={personalMessage}
                onChange={(event) => setPersonalMessage(event.target.value)}
                placeholder="Add a personal message for the recipient..."
                className="mt-2 w-full resize-y rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />

              <p className="mt-1 text-right text-base text-stone-500">
                {personalMessage.length}/2000
              </p>
            </div>
          </section>

          <section className="border-t border-stone-200 pt-8">
            <div className="rounded-2xl bg-stone-100 p-5">
              <h2 className="font-bold text-stone-900">
                How the Gift Works
              </h2>

              <ol className="mt-3 space-y-2 text-base leading-6 text-stone-700">
                <li>1. You purchase the selected MyEMemorial plan.</li>
                <li>
                  2. You receive an email confirming your Gift purchase.
                </li>
                <li>
                  3. The recipient will receive an invitation to claim the
                  Gift.
                </li>
                <li>
                  4. After claiming it, the recipient can begin creating their
                  MyEMemorial.
                </li>
              </ol>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />

              <span className="text-base leading-6 text-stone-700">
                I understand that I am purchasing a{" "}{giftType === "personal" ? "Living MyEMemorial" : "Departed MyEMemorial"}{" "}plan as a Gift
                for the recipient listed above. The recipient must claim the
                Gift before beginning their memorial.
              </span>
            </label>
          </section>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-base font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          <div className="border-t border-stone-200 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-amber-400 px-6 py-3 font-bold text-stone-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Opening Secure Checkout..."
                : "Continue to Secure Payment"}
            </button>

            <p className="mt-3 text-center text-base text-stone-500">
              You will be redirected to Stripe to complete the payment
              securely.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
