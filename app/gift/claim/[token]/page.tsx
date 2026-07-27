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
  `/login?mode=choice&redirect=${encodeURIComponent(
    automaticClaimPath
  )}`;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          A Gift from MyEMemorial
        </p>

        <h1 className="mt-3 text-4xl font-bold text-stone-900">
          Hello {gift.recipientName}
        </h1>

        <p className="mt-5 text-lg leading-8 text-stone-700">
  <strong>{gift.purchaserName}</strong> has gifted you a{" "}
  <strong>MyEMemorial</strong>.
</p>

        {gift.personalMessage && (
          <div className="mt-6 rounded-2xl border-l-4 border-blue-700 bg-stone-50 p-5">
            <p className="text-sm font-semibold text-stone-700">
              A personal message from {gift.purchaserName}:
            </p>

            <p className="mt-3 whitespace-pre-wrap text-stone-700">
              {gift.personalMessage}
            </p>
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-blue-50 p-5">
          <p className="font-semibold text-stone-900">
            Your gift is fully paid.
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-700">
            There is no payment required from you. Sign in or create an
            account to accept the gift and begin building your MyEMemorial.
          </p>
        </div>

        {gift.expiresAt && (
          <p className="mt-6 text-sm text-stone-600">
            This gift must be claimed by{" "}
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
    </main>
  );
}