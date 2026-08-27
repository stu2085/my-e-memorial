"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function AcknowledgeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const acknowledgementStartedRef =
    useRef(false);

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState(
    "Confirming the funeral-home preference..."
  );

  const [funeralHomeName, setFuneralHomeName] =
    useState("");

  const [followUpMessage, setFollowUpMessage] =
    useState("");

  const [warningMessage, setWarningMessage] =
    useState("");

  useEffect(() => {
    if (acknowledgementStartedRef.current) {
      return;
    }

    async function acknowledgePreference() {
      if (!token) {
        setStatus("error");
        setMessage(
          "This acknowledgement link is missing required information."
        );
        return;
      }

      acknowledgementStartedRef.current = true;

      try {
        const response = await fetch(
          "/api/funeral-home/acknowledge",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "This funeral-home preference could not be acknowledged."
          );
        }

        setFuneralHomeName(
          result.funeralHomeName || ""
        );

        setMessage(
          result.message ||
            "Thank you. The funeral-home preference has been acknowledged."
        );

        if (
          result.deathVerificationEmailStatus === "scheduled"
        ) {
          setFollowUpMessage(
            "This preference acknowledgement is complete. Because a death report is pending, MyEMemorial is also sending a separate Death Verification Request to the funeral home. That separate request must be reviewed independently."
          );
        } else if (
          result.deathVerificationEmailStatus === "sent"
        ) {
          setFollowUpMessage(
            "This preference acknowledgement is complete. Because a death report is pending, MyEMemorial also sent a separate Death Verification Request to the funeral home. That separate request must be reviewed independently."
          );
        } else if (
          result.deathVerificationEmailStatus ===
          "already_verified"
        ) {
          setFollowUpMessage(
            "This preference acknowledgement is complete. The reported death has already been independently verified."
          );
        } else {
          setFollowUpMessage("");
        }

        setWarningMessage(
          typeof result.warning === "string"
            ? result.warning
            : ""
        );

        setStatus("success");
      } catch (error) {
        setStatus("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "This acknowledgement could not be completed."
        );
      }
    }

    acknowledgePreference();
  }, [token]);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 bg-stone-900 px-6 py-8 text-center md:px-10">
            <img
              src="/myememorial-logo.png"
              alt="MyEMemorial"
              className="mx-auto w-[220px] max-w-full"
            />

            <h1 className="mt-6 text-3xl font-bold text-white md:text-4xl">
              Funeral Home Preference
            </h1>
          </div>

          <div className="p-6 md:p-10">
            {status === "loading" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-lg font-semibold text-blue-900">
                  Confirming Preference
                </p>

                <p className="mt-3 text-base leading-7 text-blue-800">
                  {message}
                </p>
              </div>
            )}

            {status === "success" && (
              <>
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                  <p className="text-xl font-bold text-green-900">
                    Preference Acknowledged
                  </p>

                  {funeralHomeName && (
                    <p className="mt-3 text-lg font-semibold text-stone-900">
                      {funeralHomeName}
                    </p>
                  )}

                  <p className="mt-3 text-base leading-7 text-green-800">
                    {message}
                  </p>
                </div>

                {followUpMessage && (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                    <p className="text-lg font-bold text-blue-900">
                      Separate Death Verification Step
                    </p>

                    <p className="mt-3 text-base leading-7 text-blue-800">
                      {followUpMessage}
                    </p>
                  </div>
                )}

                {warningMessage && (
                  <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6">
                    <p className="text-lg font-bold text-amber-900">
                      Preference Acknowledged — Follow-Up Needed
                    </p>

                    <p className="mt-3 text-base leading-7 text-amber-900">
                      {warningMessage}
                    </p>
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-6">
                  <p className="text-base leading-7 text-stone-700">
                    This acknowledgement confirms that the funeral home
                    received notice that it was identified as a preferred
                    funeral home in a Living MyEMemorial.
                  </p>

                  <p className="mt-4 text-base leading-7 text-stone-700">
                    It does not create a prepaid funeral arrangement,
                    contract, financial obligation, or guarantee of future
                    services.
                  </p>
                </div>
              </>
            )}

            {status === "error" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="text-xl font-bold text-red-900">
                  We Could Not Complete This Acknowledgement
                </p>

                <p className="mt-3 text-base leading-7 text-red-800">
                  {message}
                </p>

                <p className="mt-4 text-base leading-7 text-stone-700">
                  If you believe this link should still be valid,
                  please contact MyEMemorial for assistance.
                </p>
              </div>
            )}

            <div className="mt-8 text-center">
              <a
                href="https://www.myememorial.com"
                className="inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700"
              >
                Visit MyEMemorial
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function FuneralHomeAcknowledgeClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-semibold text-stone-900">
              Loading acknowledgement...
            </p>
          </div>
        </main>
      }
    >
      <AcknowledgeContent />
    </Suspense>
  );
}