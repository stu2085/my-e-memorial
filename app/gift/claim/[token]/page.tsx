"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
type GiftDetails = {
  purchaserName: string;
  recipientName: string;
  recipientEmail: string;
  personalMessage: string;
  plan: string;
  giftType: "memorial" | "personal";
  expiresAt: string | null;
  claimed: boolean;
};

export default function GiftClaimPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const searchParams = useSearchParams();
const shouldAutomaticallyClaim =
  searchParams.get("autoClaim") === "1";

  const [gift, setGift] = useState<GiftDetails | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
const [isClaiming, setIsClaiming] = useState(false);
const [claimError, setClaimError] = useState("");

const automaticClaimStartedRef = useRef(false);
useEffect(() => {
  async function checkSignedInUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setSignedInEmail(user?.email || null);
    } finally {
      setHasCheckedAuth(true);
    }
  }

  checkSignedInUser();
}, []);
  useEffect(() => {
    async function loadGift() {
      try {
        const response = await fetch(
          `/api/gift-claim/${encodeURIComponent(token)}`
        );

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Could not load this gift invitation.");
          return;
        }

        setGift(result.gift);
      } catch (error) {
        console.error("Gift claim page error:", error);
        setError("Could not load this gift invitation.");
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadGift();
    }
  }, [token]);
async function handleSwitchAccount() {
  await supabase.auth.signOut();

  window.location.assign(loginUrl);
}
function handleContinueGift() {
  const createParams = new URLSearchParams({
    gift: token,
    plan: gift?.plan || "basic",
  });

  if (gift?.giftType === "personal") {
    createParams.set("mode", "personal");
  }

  window.location.assign(`/create?${createParams.toString()}`);
}
async function handleClaimGift() {
  setClaimError("");
  setIsClaiming(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setClaimError("Your sign-in session could not be found.");
      return;
    }

    const response = await fetch(
      `/api/gift-claim/${encodeURIComponent(token)}/claim`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      setClaimError(result.error || "Could not claim this gift.");
      return;
    }

    const createParams = new URLSearchParams({
  gift: token,
  plan: result.plan,
});

if (gift?.giftType === "personal") {
  createParams.set("mode", "personal");
}

window.location.assign(`/create?${createParams.toString()}`);
  } catch (error) {
    console.error("Claim gift error:", error);
    setClaimError("Could not claim this gift.");
  } finally {
    setIsClaiming(false);
  }
}
useEffect(() => {
  if (
    !shouldAutomaticallyClaim ||
    !hasCheckedAuth ||
    !gift ||
    gift.claimed ||
    !signedInEmail ||
    signedInEmail.toLowerCase() !== gift.recipientEmail.toLowerCase() ||
    automaticClaimStartedRef.current
  ) {
    return;
  }

  automaticClaimStartedRef.current = true;
  void handleClaimGift();
}, [
  gift,
  hasCheckedAuth,
  shouldAutomaticallyClaim,
  signedInEmail,
]);
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-stone-600">Loading your gift...</p>
        </div>
      </main>
    );
  }

  if (error || !gift) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-stone-900">
            Gift Invitation
          </h1>

          <p className="mt-4 text-stone-600">
            {error || "This gift invitation could not be found."}
          </p>
        </div>
      </main>
    );
  }

 

  const claimPath = `/gift/claim/${token}`;
const automaticClaimPath = `${claimPath}?autoClaim=1`;

const loginUrl =
  `/login?mode=choice&email=${encodeURIComponent(
    gift.recipientEmail
  )}&redirect=${encodeURIComponent(automaticClaimPath)}`;

  return (
  <main className="min-h-screen bg-gradient-to-b from-blue-50 via-stone-50 to-stone-100 px-4 py-10 md:py-16">
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
      <div className="bg-[#082454] px-6 py-4 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-white">
          A Gift from MyEMemorial
        </p>
      </div>

      <div className="px-6 py-8 md:px-12 md:py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            🎁
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-700">
            A thoughtful gift has been waiting for you
          </p>

          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
            Hello {gift.recipientName}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-stone-700">
            <strong>{gift.purchaserName}</strong> has given you a{" "}
            <strong>
              {gift.giftType === "personal"
                ? "Personal MyEMemorial"
                : "MyEMemorial"}
            </strong>
            .
          </p>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-stone-600">
            {gift.giftType === "personal"
              ? "A lasting place to preserve your memories, stories, photos, videos, and life experiences for future generations."
              : "A lasting place to preserve the life story, memories, photos, videos, and legacy of someone you love."}
          </p>
        </div>

        {gift.personalMessage && (
          <div className="relative mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6">
            <p className="text-sm font-semibold text-amber-900">
              A personal message from {gift.purchaserName}
            </p>

            <p className="mt-3 whitespace-pre-wrap font-serif text-lg italic leading-8 text-stone-700">
              “{gift.personalMessage}”
            </p>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <p className="text-lg font-semibold text-stone-900">
            Your gift has already been paid for.
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-700">
            There is nothing to purchase. Simply accept your gift and
            begin whenever you are ready.
          </p>
        </div>

        {gift.expiresAt && (
          <p className="mt-5 text-center text-sm text-stone-600">
            Please accept this gift by{" "}
            <strong>
              {new Date(gift.expiresAt).toLocaleDateString("en-US")}
            </strong>
            .
          </p>
        )}

       {gift.claimed ? (
  signedInEmail ? (
    signedInEmail.toLowerCase() ===
    gift.recipientEmail.toLowerCase() ? (
      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-stone-900">
  Your Gift has been accepted.
</p>

<p className="mt-2 text-sm leading-6 text-stone-700">
  Your MyEMemorial is ready whenever you would like to continue.
</p>

        <button
          type="button"
          onClick={handleContinueGift}
          className="mt-5 w-full rounded-full bg-stone-900 px-6 py-4 text-center font-semibold text-white hover:bg-stone-700"
        >
          Continue Creating Your Memorial
        </button>
      </div>
    ) : (
      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-800">
          You are signed in with a different email address.
        </p>

        <p className="mt-2 text-sm text-red-700">
          This Gift was sent to{" "}
          <strong>{gift.recipientEmail}</strong>, but you are signed in
          as <strong>{signedInEmail}</strong>.
        </p>

        <button
          type="button"
          onClick={handleSwitchAccount}
          className="mt-5 w-full rounded-full bg-stone-900 px-6 py-3 text-center font-semibold text-white hover:bg-stone-700"
        >
          Log Out and Use the Gift Recipient Email
        </button>
      </div>
    )
  ) : (
    <a
      href={loginUrl}
      className="mt-8 block w-full rounded-full bg-stone-900 px-6 py-4 text-center font-semibold text-white hover:bg-stone-700"
    >
      Sign In to Continue Your Memorial
    </a>
  )
) : signedInEmail ? (
  signedInEmail.toLowerCase() === gift.recipientEmail.toLowerCase() ? (
  <div className="mt-8">
    {claimError && (
      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-700">
          We could not finish accepting your Gift.
        </p>

        <p className="mt-2 text-sm text-red-600">
          {claimError}
        </p>
      </div>
    )}

    <button
      type="button"
      onClick={handleClaimGift}
      disabled={isClaiming}
      className="w-full rounded-full bg-stone-900 px-6 py-4 text-center font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isClaiming ? "Accepting Your Gift..." : "Accept Your Gift"}
    </button>
  </div>
  ) : (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
      <p className="font-semibold text-red-800">
        You are signed in with a different email address.
      </p>

      <p className="mt-2 text-sm text-red-700">
        This Gift was sent to <strong>{gift.recipientEmail}</strong>, but
        you are signed in as <strong>{signedInEmail}</strong>.
      </p>

      <button
        type="button"
        onClick={handleSwitchAccount}
        className="mt-5 w-full rounded-full bg-stone-900 px-6 py-3 text-center font-semibold text-white hover:bg-stone-700"
      >
        Log Out and Use the Gift Recipient Email
      </button>
    </div>
  )
) : (
  <a
    href={loginUrl}
    className="mt-8 block w-full rounded-full bg-stone-900 px-6 py-4 text-center font-semibold text-white hover:bg-stone-700"
  >
    Accept Your Gift
  </a>
)}
      </div>
    </div>
  </main>
  );
}