"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";
import VisitorContributionsSection from "../../../components/VisitorContributionsSection";
import SubmissionPhotoViewerModal from "../../../components/SubmissionPhotoViewerModal";
import PlanSection from "../../../components/PlanSection";

const PLAN_PRICES = {
  basic: 4995,
  plus: 6995,
  premium: 8995,
};
type MemorialSubmission = {
  id: number;
  submitter_name: string | null;
  submitter_email: string | null;
  message: string | null;
  photo_urls?: string[] | string | null;
  video_urls?: string[] | string | null;
  status: string;
  created_at: string | null;
};

type ManageMemorial = {
  id: number;
  slug: string;
  full_name: string | null;
  owner_id: string | null;
  plan: string | null;
  extra_video_minutes: number | null;
  is_living_preplan: boolean | null;
};

export default function ManageMemorialPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [memorial, setMemorial] = useState<ManageMemorial | null>(null);
  const [submissions, setSubmissions] = useState<MemorialSubmission[]>([]);
  const [submissionsMessage, setSubmissionsMessage] = useState("");
  const [existingVideoDurations, setExistingVideoDurations] = useState<number[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);
const [isBackupUnlocked, setIsBackupUnlocked] = useState(false);
const [backupLoginEmail, setBackupLoginEmail] = useState("");
const [backupLoginPassword, setBackupLoginPassword] = useState("");
const [backupLoginError, setBackupLoginError] = useState("");
const [isPublishing, setIsPublishing] = useState(false);
const [publishError, setPublishError] = useState("");

  const [submissionPhotoViewer, setSubmissionPhotoViewer] = useState<{
    photos: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    async function loadManagePage() {
      if (!slug) {
        setErrorMessage("Missing memorial.");
        setLoading(false);
        return;
      }

      const {
  data: { session },
} = await supabase.auth.getSession();

const user = session?.user ?? null;

      let memorialData: ManageMemorial | null = null;

const { data: directMemorialData, error: memorialError } =
  await supabase
    .from("memorials")
    .select(
      "id, slug, full_name, owner_id, plan, extra_video_minutes, is_living_preplan"
    )
    .eq("slug", slug)
    .maybeSingle();

if (!memorialError && directMemorialData) {
  memorialData = directMemorialData as ManageMemorial;
}

/*
 * A logged-out backup person cannot read a private
 * Personal E-Memorial through the normal browser
 * Supabase client because of the privacy rules.
 *
 * In that case, use the limited server-side lookup
 * so the Backup Person Login screen can still appear.
 */
if (!memorialData) {
  try {
    const backupMemorialResponse = await fetch(
      `/api/backup-memorial?slug=${encodeURIComponent(slug)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const backupMemorialResult =
      await backupMemorialResponse.json();

    if (
      backupMemorialResponse.ok &&
      backupMemorialResult?.memorial
    ) {
      memorialData =
        backupMemorialResult.memorial as ManageMemorial;
    }
  } catch (error) {
    console.error(
      "BACKUP MEMORIAL LOOKUP ERROR:",
      error
    );
  }
}

if (!memorialData) {
  setErrorMessage("Could not load this memorial.");
  setLoading(false);
  return;
}

      const ownerAccess =
  !!user && memorialData.owner_id === user.id;

setIsOwner(ownerAccess);
setMemorial(memorialData as ManageMemorial);

let backupAccessValid = false;

if (!ownerAccess && memorialData.is_living_preplan) {
  try {
    const backupAccessResponse = await fetch(
      `/api/backup-access?memorialId=${memorialData.id}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (backupAccessResponse.ok) {
      const backupAccessResult =
        await backupAccessResponse.json();

      backupAccessValid =
        backupAccessResult?.valid === true;
    }
  } catch (error) {
    console.error(
      "BACKUP ACCESS CHECK ERROR:",
      error
    );
  }
}

if (backupAccessValid) {
  setIsBackupUnlocked(true);
}

if (!ownerAccess && !backupAccessValid) {
  if (!memorialData.is_living_preplan) {
    setErrorMessage(
      "You do not have permission to manage this memorial."
    );
  }

  setLoading(false);
  return;
}

if (!ownerAccess && memorialData.is_living_preplan) {
  setLoading(false);
  return;
}

      const { data: submissionsData, error: submissionsError } =
        await supabase
          .from("memorial_submissions")
          .select(
            "id, submitter_name, submitter_email, message, photo_urls, video_urls, status, created_at"
          )
          .eq("memorial_id", memorialData.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

      if (submissionsError) {
        console.error(
          "LOAD VISITOR CONTRIBUTIONS ERROR:",
          submissionsError
        );
      } else {
        setSubmissions(
          (submissionsData as MemorialSubmission[]) || []
        );
      }

      const { data: videoData, error: videoError } = await supabase
        .from("memorial_videos")
        .select("duration_seconds")
        .eq("memorial_id", memorialData.id);

      if (videoError) {
        console.error(
          "LOAD MEMORIAL VIDEO DURATIONS ERROR:",
          videoError
        );
      } else {
        setExistingVideoDurations(
          (videoData || []).map(
            (video) => Number(video.duration_seconds || 0)
          )
        );
      }

      setLoading(false);
    }

    loadManagePage();
  }, [slug]);

  async function handleSubmissionStatus(
    submissionId: number,
    nextStatus: "approved" | "rejected"
  ) {
    try {
      setSubmissionsMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setSubmissionsMessage("You must be logged in.");
        return;
      }

      const res = await fetch(
        "/api/memorial-submissions/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            submissionId,
            status: nextStatus,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || "Could not update submission."
        );
      }

      setSubmissions((previousSubmissions) =>
        previousSubmissions.filter(
          (submission) => submission.id !== submissionId
        )
      );

      setSubmissionsMessage(
        `Submission ${nextStatus}.`
      );
    } catch (error) {
      console.error(error);

      setSubmissionsMessage(
        "There was a problem updating the submission."
      );
    }
  }

  async function handleBuyExtraVideos(
    extraCount: number,
    submissionId?: number
  ) {
    if (!memorial) {
      alert("Missing memorial record. Could not start checkout.");
      return;
    }

    try {
  const amount = extraCount * 995;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    alert("Please sign in again before purchasing additional Video Memory time.");
    return;
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
        body: JSON.stringify({
          plan: "extra_videos",
          amount,
          quantity: extraCount,
          memorialId: memorial.id,
          submissionId: submissionId ?? "",
          returnUrl:
            `${window.location.origin}/memorial/${memorial.slug}/manage` +
            `?extra_videos_paid=${extraCount}` +
            `${
              submissionId
                ? `&approve_submission=${submissionId}`
                : ""
            }`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not start checkout.");
      }
    } catch (error) {
      console.error(error);
      alert("Error starting checkout.");
    }
  }
  async function handleUpgradePlan(
  toPlan: "plus" | "premium"
) {
  if (!memorial) {
    alert(
      "Missing memorial record. Could not start upgrade checkout."
    );
    return;
  }

  const currentPlan =
    memorial.plan as keyof typeof PLAN_PRICES;

  const currentPrice =
    PLAN_PRICES[currentPlan] || PLAN_PRICES.basic;

  const newPrice = PLAN_PRICES[toPlan];

  const upgradeAmount =
    newPrice - currentPrice;

  if (upgradeAmount <= 0) {
    alert(
      "This memorial is already on this plan or a higher plan."
    );
    return;
  }

  try {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    alert("Please sign in again before upgrading this memorial.");
    return;
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
      body: JSON.stringify({
        plan: toPlan,
        amount: upgradeAmount,
        memorialId: memorial.id,
        checkoutType: "upgrade",
        fromPlan: currentPlan,
        toPlan,
        returnUrl:
          `${window.location.origin}/memorial/${memorial.slug}/manage` +
          "?upgrade_success=true",
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Could not start upgrade checkout.");
    }
  } catch (error) {
    console.error(error);
    alert("Error starting upgrade checkout.");
  }
}
async function handleBackupLogin() {
  if (!memorial) {
    setBackupLoginError("Memorial record is not loaded yet.");
    return;
  }

  setBackupLoginError("");

  try {
    const res = await fetch("/api/backup-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memorialId: memorial.id,
        email: backupLoginEmail,
        password: backupLoginPassword,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setIsBackupUnlocked(false);
      setBackupLoginError(
        result.error || "Backup email or password is incorrect."
      );
      return;
    }

    setIsBackupUnlocked(true);
    setBackupLoginError("");
  } catch (error) {
    console.error(error);
    setIsBackupUnlocked(false);
    setBackupLoginError("Could not verify backup login.");
  }
}
async function handleEndBackupAccess() {
  try {
    const response = await fetch(
      "/api/backup-access/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) {
      alert("Could not end backup access.");
      return;
    }

    setIsBackupUnlocked(false);

    window.location.assign(
      `/memorial/${memorial?.slug || slug}`
    );
  } catch (error) {
    console.error(error);
    alert("Could not end backup access.");
  }
}
async function handlePublishMemorial() {
  if (!memorial) {
    setPublishError("Memorial record is not loaded.");
    return;
  }

  const confirmed = window.confirm(
    "Publish this memorial now?\n\n" +
      "This will convert the private Personal E-Memorial into the public memorial. " +
      "Once published, it may appear in public search and its memorial page will be available to visitors."
  );

  if (!confirmed) {
    return;
  }

  try {
    setIsPublishing(true);
    setPublishError("");

    const response = await fetch(
      "/api/backup-publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          memorialId: memorial.id,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The memorial could not be published."
      );
    }

    window.location.assign(
      `/memorial/${result.slug || memorial.slug}`
    );
  } catch (error) {
    console.error(
      "PUBLISH MEMORIAL ERROR:",
      error
    );

    setPublishError(
      error instanceof Error
        ? error.message
        : "The memorial could not be published."
    );

    setIsPublishing(false);
  }
}
  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-stone-600">
            Loading memorial management...
          </p>
        </div>
      </main>
    );
  }
if (
  memorial &&
  memorial.is_living_preplan &&
  !isOwner &&
  !isBackupUnlocked
) {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <Link
          href={`/memorial/${memorial.slug}`}
          className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
        >
          ← Back to Memorial
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-stone-900">
          Backup Person Login
        </h1>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter the backup email and password assigned to this Personal E-Memorial.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-800">
              Backup Email
            </label>

            <input
              type="email"
              value={backupLoginEmail}
              onChange={(e) => setBackupLoginEmail(e.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-800">
              Backup Password
            </label>

            <input
              type="password"
              value={backupLoginPassword}
              onChange={(e) => setBackupLoginPassword(e.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
            />
          </div>

          {backupLoginError && (
            <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              {backupLoginError}
            </p>
          )}

          <button
            type="button"
            onClick={handleBackupLogin}
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
          >
            Unlock Memorial Management
          </button>
        </div>
      </div>
    </main>
  );
}
  if (errorMessage || !memorial) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-red-700">
            {errorMessage || "Memorial not found."}
          </p>

          <Link
            href="/my-memorials"
            className="mt-5 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            ← Back to My Memorials
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <Link
            href="/my-memorials"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            ← Back to My Memorials
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            Manage Memorial
          </h1>

          <p className="mt-2 text-lg font-semibold text-stone-800">
            {memorial.full_name || "Unnamed Memorial"}
          </p>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            Review visitor contributions and manage memorial settings.
          </p>
          {(isOwner || isBackupUnlocked) && (
  <>
    <div className="mt-5 flex flex-wrap gap-3">
      <Link
        href={`/create?edit=${memorial.id}`}
        className="inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
      >
        Edit Memorial
      </Link>

      {isBackupUnlocked && !isOwner && (
        <>
          {memorial.is_living_preplan && (
            <button
              type="button"
              onClick={handlePublishMemorial}
              disabled={isPublishing}
              className="inline-flex rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing
                ? "Publishing..."
                : "Publish Memorial"}
            </button>
          )}

          <button
            type="button"
            onClick={handleEndBackupAccess}
            disabled={isPublishing}
            className="inline-flex rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            End Backup Access
          </button>
        </>
      )}
    </div>

    {publishError && (
      <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
        {publishError}
      </p>
    )}
  </>
)}
        </section>
<PlanSection
  plan={memorial.plan || "basic"}
  handleUpgradePlan={handleUpgradePlan}
/>
        <VisitorContributionsSection
          submissionsMessage={submissionsMessage}
          submissions={submissions}
          form={{
            plan: memorial.plan || "basic",
            extraVideoMinutes: String(
              memorial.extra_video_minutes || 0
            ),
          }}
          existingVideoDurations={existingVideoDurations}
          setSubmissionPhotoViewer={setSubmissionPhotoViewer}
          handleSubmissionStatus={handleSubmissionStatus}
          handleBuyExtraVideos={handleBuyExtraVideos}
        />

        <SubmissionPhotoViewerModal
          submissionPhotoViewer={submissionPhotoViewer}
          setSubmissionPhotoViewer={setSubmissionPhotoViewer}
        />
      </div>
    </main>
  );
}