"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type PlanLockedSectionProps = {
  locked: boolean;
  featureName: string;
  children: ReactNode;
  isPersonalMyEMemorial?: boolean;
  memorialId?: number | null;
  paymentPending?: boolean;
  onCompletePayment?: () => void | Promise<void>;
  isStartingPayment?: boolean;
};

export default function PlanLockedSection({
  locked,
  featureName,
  children,
  isPersonalMyEMemorial,
  memorialId,
  paymentPending = false,
  onCompletePayment,
  isStartingPayment = false,
}: PlanLockedSectionProps) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const personalFromUrl = mode === "personal" || mode === "preplan";
  const isPersonal = isPersonalMyEMemorial ?? personalFromUrl;

  const editMemorialId = Number(searchParams.get("edit") || 0);
  const resolvedMemorialId =
    Number.isInteger(memorialId) && Number(memorialId) > 0
      ? Number(memorialId)
      : Number.isInteger(editMemorialId) && editMemorialId > 0
        ? editMemorialId
        : null;

  if (!locked) {
    return <>{children}</>;
  }

  const upgradeHref = isPersonal
    ? resolvedMemorialId
      ? `/personal-e-memorials?upgrade=${resolvedMemorialId}#pricing`
      : "/personal-e-memorials#pricing"
    : "/#pricing";

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div
        className="pointer-events-none select-none opacity-40 grayscale"
        aria-hidden="true"
      >
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-stone-200/55 p-6 backdrop-blur-[1px]">
        <div className="max-w-md rounded-3xl border border-stone-300 bg-white/95 p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-2xl">
            🔒
          </div>

          <h3 className="mt-4 text-lg font-bold text-stone-900">
            {featureName}
          </h3>

          {paymentPending ? (
            <>
              <p className="mt-2 text-base font-semibold text-amber-800">
                Payment required for your selected plan
              </p>

              <p className="mt-2 text-base leading-6 text-stone-600">
                Your plan selection is saved, but payment has not been completed.
                This feature will unlock as soon as payment is confirmed.
              </p>

              {onCompletePayment && (
                <button
                  type="button"
                  onClick={() => void onCompletePayment()}
                  disabled={isStartingPayment}
                  className="mt-5 inline-flex rounded-full bg-blue-950 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isStartingPayment
                    ? "Opening Payment..."
                    : "Complete Payment"}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="mt-2 text-base font-semibold text-stone-700">
                Available with Basic or higher
              </p>

              <p className="mt-2 text-base leading-6 text-stone-600">
                Upgrade to a paid MyEMemorial plan to unlock this feature.
              </p>

              <Link
                href={upgradeHref}
                className="mt-5 inline-flex rounded-full bg-blue-950 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-900"
              >
                Upgrade
              </Link>
            </>
          )}

          <p className="mt-4 text-base font-semibold text-stone-700">
            Or click Save &amp; Continue
          </p>
        </div>
      </div>
    </div>
  );
}
