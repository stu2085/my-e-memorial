"use client";

import { use } from "react";

export default function RenewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const handleRenew = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: "advertiser",
        amount: 9900,
        advertiserId: id,
        isRenewal: true,
        returnUrl: `${window.location.origin}/renew-success?session_id={CHECKOUT_SESSION_ID}`,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error starting checkout");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
        <h1 className="text-xl font-semibold mb-4">Renew Your Advertising</h1>

        <p className="text-sm text-stone-600 mb-6">
          Continue your ad placement for another 30 days and keep your exclusive
          zip/category placement active.
        </p>

        <button
          onClick={handleRenew}
          className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800"
        >
          Renew Now – $99
        </button>
      </div>
    </div>
  );
}