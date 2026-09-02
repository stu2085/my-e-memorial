"use client";

import Image from "next/image";
import Link from "next/link";
import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type ReviewSubmission = {
  id: number;
  submitter_name: string | null;
  submitter_email: string | null;
  message: string | null;
  photo_urls?: string[] | string | null;
  video_urls?: string[] | string | null;
  status: string;
  created_at: string | null;
};

type MemorialSummary = {
  id: number;
  slug: string;
  fullName: string;
};

function parseUrls(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export default function ReviewSubmissionClient() {
  const params = useParams<{
    slug: string;
    submissionId: string;
  }>();

  const searchParams = useSearchParams();

  const slug = params?.slug || "";
  const submissionId = Number(
    params?.submissionId || 0
  );

  const returnedExtraPacks = Number(
    searchParams.get("extra_videos_paid") || 0
  );

  const [submission, setSubmission] =
    useState<ReviewSubmission | null>(null);

  const [memorial, setMemorial] =
    useState<MemorialSummary | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isWorking, setIsWorking] =
    useState(false);

  const [needsLogin, setNeedsLogin] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const reviewPath =
    `/memorial/${slug}/review-submission/${submissionId}`;

  const loginHref =
    `/login?mode=login&redirect=${encodeURIComponent(
      reviewPath
    )}`;

  const photos = useMemo(
    () => parseUrls(submission?.photo_urls),
    [submission?.photo_urls]
  );

  const videos = useMemo(
    () =>
      parseUrls(submission?.video_urls)
        .filter((videoId) => videoId.length > 15),
    [submission?.video_urls]
  );

  async function getRequestHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers.Authorization =
        `Bearer ${session.access_token}`;
    }

    return headers;
  }

  async function loadSubmission() {
    if (
      !Number.isSafeInteger(submissionId) ||
      submissionId <= 0
    ) {
      setErrorMessage(
        "This review link is not valid."
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setNeedsLogin(false);

    try {
      const headers = await getRequestHeaders();

      const res = await fetch(
        `/api/memorial-submissions/status?submissionId=${encodeURIComponent(
          String(submissionId)
        )}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (res.status === 403) {
        setNeedsLogin(true);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(
          result.error ||
            "Could not load this submitted memory."
        );
      }

      const loadedSubmission =
        Array.isArray(result.submissions) &&
        result.submissions.length > 0
          ? result.submissions[0]
          : null;

      setSubmission(loadedSubmission);
      setMemorial(result.memorial || null);

      if (!loadedSubmission) {
        setErrorMessage(
          "This submitted memory could not be found."
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load this submitted memory."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  useEffect(() => {
    if (returnedExtraPacks > 0) {
      setMessage(
        "Additional Video Memory time was purchased. Click Approve again to complete approval."
      );
    }
  }, [returnedExtraPacks]);

  async function startExtraVideoCheckout(
    extraPacksNeeded: number
  ) {
    if (!memorial) {
      setErrorMessage(
        "The memorial record is not loaded."
      );
      return;
    }

    const headers = await getRequestHeaders();

    if (!headers.Authorization) {
      setNeedsLogin(true);
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({
        plan: "extra_videos",
        amount: extraPacksNeeded * 995,
        quantity: extraPacksNeeded,
        memorialId: memorial.id,
        submissionId,
        returnUrl:
          `${window.location.origin}${reviewPath}` +
          `?extra_videos_paid=${extraPacksNeeded}`,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.url) {
      throw new Error(
        result.error ||
          "Could not start checkout."
      );
    }

    window.location.href = result.url;
  }

  async function updateStatus(
    nextStatus: "approved" | "rejected"
  ) {
    if (!submission) {
      return;
    }

    setIsWorking(true);
    setMessage("");
    setErrorMessage("");

    try {
      const headers = await getRequestHeaders();

      const res = await fetch(
        "/api/memorial-submissions/status",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            submissionId: submission.id,
            status: nextStatus,
          }),
        }
      );

      const result = await res.json();

      if (
        res.status === 402 &&
        result.needsExtraVideoPurchase === true
      ) {
        const extraPacksNeeded = Math.max(
          1,
          Number(result.extraPacksNeeded || 1)
        );

        const totalPrice =
          extraPacksNeeded * 9.95;

        const confirmed = window.confirm(
          `${result.error}\n\n` +
            `Purchase ${extraPacksNeeded} 10-minute Video Memory Pack${
              extraPacksNeeded === 1 ? "" : "s"
            } for $${totalPrice.toFixed(2)} now?`
        );

        if (confirmed) {
          await startExtraVideoCheckout(
            extraPacksNeeded
          );
        }

        return;
      }

      if (res.status === 403) {
        setNeedsLogin(true);
        return;
      }

      if (!res.ok) {
        throw new Error(
          result.error ||
            "Could not update this submitted memory."
        );
      }

      setSubmission((previous) =>
        previous
          ? {
              ...previous,
              status: nextStatus,
            }
          : previous
      );

      setMessage(
        nextStatus === "approved"
          ? "Memory approved and now visible on the public MyEMemorial."
          : "Memory rejected. It will not appear on the public MyEMemorial."
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update this submitted memory."
      );
    } finally {
      setIsWorking(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-base text-stone-600">
              Loading submitted memory...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (needsLogin) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm md:p-10">
            <Image
              src="/myememorial-logo.png"
              alt="MyEMemorial"
              width={360}
              height={110}
              className="mx-auto h-auto w-full max-w-[320px]"
              priority
            />

            <h1 className="mt-8 text-3xl font-bold text-stone-900">
              Review Submitted Memory
            </h1>

            <p className="mt-4 text-base leading-7 text-stone-600">
              Please log in with the memorial owner account to review this submitted memory.
            </p>

            <Link
              href={loginHref}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-base font-semibold text-white hover:bg-stone-700"
            >
              Log In to Review
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-7 text-center md:px-10 md:py-8">
            <Image
              src="/myememorial-logo.png"
              alt="MyEMemorial"
              width={360}
              height={110}
              className="mx-auto h-auto w-full max-w-[320px]"
              priority
            />

            <p className="mt-6 text-base font-semibold uppercase tracking-[0.18em] text-stone-500">
              Owner Review
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Review Submitted Memory
            </h1>

            {memorial?.fullName && (
              <p className="mt-3 text-xl font-semibold text-stone-700">
                {memorial.fullName}
              </p>
            )}
          </div>

          <div className="space-y-7 px-6 py-7 md:px-10 md:py-9">
            {message && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-base text-green-800">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-700">
                {errorMessage}
              </div>
            )}

            {submission && (
              <>
                <div className="grid gap-4 rounded-2xl bg-stone-50 p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                      Submitted by
                    </p>
                    <p className="mt-1 text-base font-semibold text-stone-900">
                      {submission.submitter_name ||
                        "Anonymous visitor"}
                    </p>

                    {submission.submitter_email && (
                      <p className="mt-1 break-all text-base text-stone-600">
                        {submission.submitter_email}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                      Submitted
                    </p>
                    <p className="mt-1 text-base text-stone-700">
                      {submission.created_at
                        ? new Date(
                            submission.created_at
                          ).toLocaleString()
                        : "Date unavailable"}
                    </p>

                    <p className="mt-2 text-base font-semibold capitalize text-stone-700">
                      Status: {submission.status}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    Written Memory
                  </h2>

                  <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-5">
                    <p className="whitespace-pre-line text-base leading-7 text-stone-700">
                      {submission.message ||
                        "No written message was included."}
                    </p>
                  </div>
                </div>

                {photos.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Submitted Photos
                    </h2>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {photos.map(
                        (photoUrl, index) => (
                          <a
                            key={`${photoUrl}-${index}`}
                            href={photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl border border-stone-200 bg-stone-50"
                          >
                            <img
                              src={photoUrl}
                              alt={`Submitted photo ${index + 1}`}
                              className="aspect-square h-full w-full object-cover"
                            />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}

                {videos.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Submitted Video{videos.length === 1 ? "" : "s"}
                    </h2>

                    <div className="mt-3 space-y-4">
                      {videos.map(
                        (playbackId, index) => (
                          <div
                            key={`${playbackId}-${index}`}
                            className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-4"
                          >
                            {videos.length > 1 && (
                              <p className="mb-3 text-base font-semibold text-stone-700">
                                Video {index + 1}
                              </p>
                            )}

                            <MuxPlayer
                              playbackId={playbackId}
                              streamType="on-demand"
                              className="aspect-video w-full rounded-xl bg-black"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {submission.status === "pending" ? (
                  <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row">
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() =>
                        updateStatus("approved")
                      }
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isWorking
                        ? "Working..."
                        : "Approve"}
                    </button>

                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() =>
                        updateStatus("rejected")
                      }
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-red-300 bg-white px-6 py-3 text-base font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-stone-200 pt-6">
                    <p className="text-base font-semibold text-stone-700">
                      This memory has already been {submission.status}.
                    </p>
                  </div>
                )}

                {memorial?.slug && (
                  <div className="text-center">
                    <Link
                      href={`/memorial/${memorial.slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-base font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      View MyEMemorial
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
