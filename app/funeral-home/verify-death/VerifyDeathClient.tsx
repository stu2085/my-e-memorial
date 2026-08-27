"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerifyDeathContent() {
  const searchParams = useSearchParams();

  const memorialId = Number(
    searchParams.get("memorialId")
  );

  const funeralHomeType =
    searchParams.get("funeralHomeType");

  const token =
    searchParams.get("token") || "";

  async function verifyDeath(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    if (
      !Number.isFinite(memorialId) ||
      memorialId <= 0 ||
      (
        funeralHomeType !== "primary" &&
        funeralHomeType !== "alternate"
      ) ||
      !token
    ) {
      window.alert(
        "This death-verification link is not valid."
      );
      return;
    }

    const confirmed = window.confirm(
      "Please confirm that your funeral home is currently handling arrangements for this person and that you are confirming the reported death."
    );

    if (!confirmed) {
      return;
    }

    const button = event.currentTarget;
    const resultBox =
      document.getElementById(
        "death-verification-result"
      );

    button.disabled = true;
    button.textContent = "Verifying...";

    try {
      const response = await fetch(
        "/api/funeral-home/verify-death",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            memorialId,
            funeralHomeType,
            token,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "The death could not be verified."
        );
      }

      button.textContent = "Death Confirmed";

      if (resultBox) {
        resultBox.className =
          "mt-8 rounded-2xl border border-green-300 bg-green-50 p-5";

        resultBox.textContent =
          result.alreadyVerified
            ? "This death has already been verified."
            : "Thank you. The reported death has been independently verified.";
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = "Confirm Death";

      const errorMessage =
        error instanceof Error
          ? error.message
          : "The death could not be verified.";

      if (resultBox) {
        resultBox.className =
          "mt-8 rounded-2xl border border-red-300 bg-red-50 p-5";

        resultBox.textContent =
          errorMessage;
      }

      console.error(
        "DEATH VERIFICATION ERROR:",
        error
      );
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm sm:p-10">
        <div className="text-center">
          <img
            src="/myememorial-logo.png"
            alt="MyEMemorial"
            className="mx-auto h-auto w-[220px] max-w-full"
          />

          <h1 className="mt-8 text-3xl font-bold text-stone-900 sm:text-4xl">
            Death Verification
          </h1>

          <p className="mt-6 text-lg leading-8 text-stone-700">
            MyEMemorial received a death
            report for a Living MyEMemorial
            that identified your funeral home
            as the current funeral provider.
          </p>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left">
            <p className="text-lg font-bold text-blue-900">
              Independent verification required
            </p>

            <p className="mt-2 text-base leading-7 text-blue-900">
              Please confirm only if your
              funeral home is currently handling
              arrangements for this person and
              you can verify that the person
              has died.
            </p>
          </div>

          <button
            type="button"
            onClick={verifyDeath}
            className="mt-8 w-full rounded-xl bg-stone-900 px-6 py-4 text-lg font-bold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Confirm Death
          </button>

          <div
            id="death-verification-result"
            className="hidden"
          />

          <p className="mt-8 text-base text-stone-500">
            MyEMemorial — Where Life’s Stories
            Are Told.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyDeathClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-12">
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-base text-stone-700">
              Loading verification...
            </p>
          </div>
        </main>
      }
    >
      <VerifyDeathContent />
    </Suspense>
  );
}