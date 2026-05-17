"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function RenewSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [message, setMessage] = useState("Verifying your renewal payment...");

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setMessage("Missing payment session. Please contact MyEMemorial.");
        return;
      }

      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (data.paid) {
        setMessage("Thank you. Your advertising renewal was successful.");
      } else {
        setMessage("Payment could not be verified. Please contact MyEMemorial.");
      }
    }

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="mb-4 text-2xl font-semibold">Renewal Status</h1>
        <p className="text-stone-700">{message}</p>
      </div>
    </div>
  );
}

export default function RenewSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenewSuccessContent />
    </Suspense>
  );
}