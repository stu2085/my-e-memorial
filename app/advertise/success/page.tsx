"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AdvertiserSuccessContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      {success === "true" ? (
        <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-green-800 shadow-sm">
          <h1 className="text-xl font-semibold">Payment accepted</h1>
          <p className="mt-3 text-sm">
            Thank you. Your advertising payment was received.
          </p>
          <p className="mt-2 text-sm">
            Please check your email for your receipt and advertising confirmation.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-800 shadow-sm">
          <h1 className="text-xl font-semibold">Payment not completed</h1>
          <p className="mt-3 text-sm">
            Something went wrong or the payment was canceled.
          </p>
        </div>
      )}
    </div>
  );
}
export default function AdvertiserSuccessPage() {
  return (
    <Suspense fallback={null}>
      <AdvertiserSuccessContent />
    </Suspense>
  );
}