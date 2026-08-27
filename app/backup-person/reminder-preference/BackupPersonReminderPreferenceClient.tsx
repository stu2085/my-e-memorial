"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PreferenceInfo = {
  ownerName: string;
  backupName: string;
  roleLabel: string;
  alreadyDisabled: boolean;
};

function BackupPersonReminderPreferenceContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [info, setInfo] =
    useState<PreferenceInfo | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreference() {
      setLoading(true);
      setErrorMessage("");

      if (!token) {
        setErrorMessage(
          "This secure Backup Person link is missing its token."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/backup-person/reminder-preference?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "This secure Backup Person link could not be verified."
          );
        }

        if (!cancelled) {
          setInfo({
            ownerName:
              result.ownerName || "",
            backupName:
              result.backupName || "",
            roleLabel:
              result.roleLabel ||
              "Backup Person",
            alreadyDisabled:
              result.alreadyDisabled === true,
          });

          if (
            result.alreadyDisabled === true
          ) {
            setSuccessMessage(
              "Your Backup Person access has already been ended and your annual reminder emails are turned off."
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "This secure Backup Person link could not be verified."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreference();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function disableReminders() {
    if (!token || submitting) {
      return;
    }

    const confirmed = window.confirm(
      "Confirm that you can no longer serve as this Backup Person. Your Backup Person access will end immediately, your stored Backup Person password will be removed, annual reminder emails will stop, and the memorial owner will be notified."
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/backup-person/reminder-preference?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Your Backup Person status could not be updated."
        );
      }

      setSuccessMessage(
        result.message ||
          "Your Backup Person access has been ended immediately and your annual reminder emails have been turned off."
      );

      setInfo((current) =>
        current
          ? {
              ...current,
              alreadyDisabled: true,
            }
          : current
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Your Backup Person status could not be updated."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm md:p-10">
          <div className="text-center">
            <img
              src="/myememorial-logo.png"
              alt="MyEMemorial"
              className="mx-auto h-auto w-[320px] max-w-full"
            />

            <h1 className="mt-7 text-3xl font-bold text-stone-900">
              Backup Person Status
            </h1>
          </div>

          {loading ? (
            <p className="mt-8 text-center text-base leading-7 text-stone-700">
              Verifying your secure link...
            </p>
          ) : errorMessage ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-base leading-7 text-red-800">
                {errorMessage}
              </p>
            </div>
          ) : successMessage ? (
            <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-base font-semibold leading-7 text-green-800">
                {successMessage}
              </p>

              <p className="mt-3 text-base leading-7 text-green-800">
                Your Backup Person access for this assignment has ended. No further annual reminder emails will be sent to you.
              </p>
            </div>
          ) : info ? (
            <>
              <div className="mt-8 space-y-4 text-base leading-7 text-stone-700">
                <p>
                  You are currently listed as the{" "}
                  <strong>{info.roleLabel}</strong>
                  {info.ownerName
                    ? ` for ${info.ownerName}.`
                    : "."}
                </p>

                <p>
                  If you are still willing and able to serve, you do not need to do anything.
                </p>

                <p>
                  If you can no longer serve, use the button below. Your Backup Person access will end immediately, your stored Backup Person password will be removed, future annual reminder emails will stop, and the memorial owner will be notified that their Backup Person information needs to be updated.
                </p>

                <p className="rounded-2xl bg-amber-50 p-4 text-base leading-7 text-amber-900">
                  Ending your Backup Person role removes your access immediately. It does not publish, delete, or otherwise change the memorial or its Legacy Instructions.
                </p>
              </div>

              <button
                type="button"
                onClick={disableReminders}
                disabled={submitting}
                className="mt-8 w-full rounded-full bg-red-700 px-6 py-4 text-base font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Updating..."
                  : "I Can No Longer Serve as Backup Person"}
              </button>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}


export default function BackupPersonReminderPreferenceClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
          <div className="mx-auto max-w-2xl">
            <section className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-sm md:p-10">
              <img
                src="/myememorial-logo.png"
                alt="MyEMemorial"
                className="mx-auto h-auto w-[320px] max-w-full"
              />
              <p className="mt-8 text-base leading-7 text-stone-700">
                Loading Backup Person status...
              </p>
            </section>
          </div>
        </main>
      }
    >
      <BackupPersonReminderPreferenceContent />
    </Suspense>
  );
}
