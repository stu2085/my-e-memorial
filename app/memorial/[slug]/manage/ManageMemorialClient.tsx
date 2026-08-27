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
  is_published: boolean | null;
};

export default function ManageMemorialClient() {
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
const [backupRole, setBackupRole] = useState<"primary" | "secondary" | "">("");
const [backupLoginEmail, setBackupLoginEmail] = useState("");
const [backupLoginPassword, setBackupLoginPassword] = useState("");
const [backupLoginError, setBackupLoginError] = useState("");
const [isPublishing, setIsPublishing] = useState(false);
const [publishError, setPublishError] = useState("");
const [isPostDeathUnlocked, setIsPostDeathUnlocked] = useState(false);
const [isCreatingPresentationLink, setIsCreatingPresentationLink] = useState(false);
const [presentationMessage, setPresentationMessage] = useState("");
const [isActivatingSecondary, setIsActivatingSecondary] = useState(false);
const [secondaryActivationMessage, setSecondaryActivationMessage] = useState("");
const [hasSecondaryBackupPerson, setHasSecondaryBackupPerson] = useState(false);

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
      "id, slug, full_name, owner_id, plan, extra_video_minutes, is_living_preplan, is_published"
    )
    .eq("slug", slug)
    .maybeSingle();

if (!memorialError && directMemorialData) {
  memorialData = directMemorialData as ManageMemorial;
}

/*
 * A logged-out backup person cannot read a private
 * Living MyEMemorial through the normal browser
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
let backupPostDeathAccess = false;

if (!ownerAccess) {
  try {
    const backupAccessResponse = await fetch(
      `/api/backup-access?memorialId=${memorialData.id}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (backupAccessResponse.ok) {
      const backupAccessResult =
        await backupAccessResponse.json();

      backupAccessValid =
        backupAccessResult?.valid === true;

      if (backupAccessValid) {
        const validatedBackupRole =
          backupAccessResult?.backupRole === "secondary"
            ? "secondary"
            : backupAccessResult?.backupRole === "primary"
              ? "primary"
              : "";

        setBackupRole(validatedBackupRole);
      }
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

  if (memorialData.is_living_preplan) {
    backupPostDeathAccess =
      await loadBackupPostDeathStatus(memorialData.id);
  } else {
    /*
     * For a published former Living MyEMemorial, the hardened
     * /api/backup-access validator only returns valid after
     * independent death verification and explicit post-death
     * activation. Therefore a valid session here is sufficient
     * to expose the post-death management controls.
     */
    backupPostDeathAccess = true;
    setIsPostDeathUnlocked(true);
  }
}

if (!ownerAccess && !backupAccessValid) {
  setLoading(false);
  return;
}

      if (ownerAccess || backupPostDeathAccess) {
        try {
          const submissionHeaders: HeadersInit = {};

          if (session?.access_token) {
            submissionHeaders.Authorization =
              `Bearer ${session.access_token}`;
          }

          const submissionsResponse = await fetch(
            `/api/memorial-submissions/status?memorialId=${memorialData.id}`,
            {
              method: "GET",
              headers: submissionHeaders,
              credentials: "include",
              cache: "no-store",
            }
          );

          const submissionsResult =
            await submissionsResponse.json();

          if (!submissionsResponse.ok) {
            throw new Error(
              submissionsResult?.error ||
                "Visitor contributions could not be loaded."
            );
          }

          setSubmissions(
            (submissionsResult?.submissions as MemorialSubmission[]) || []
          );
        } catch (error) {
          console.error(
            "LOAD VISITOR CONTRIBUTIONS ERROR:",
            error
          );

          setSubmissions([]);
          setSubmissionsMessage(
            error instanceof Error
              ? error.message
              : "Visitor contributions could not be loaded."
          );
        }
      } else {
        setSubmissions([]);

        if (backupAccessValid && !ownerAccess) {
          setSubmissionsMessage(
            "Visitor contributions are reviewed by the memorial owner until verified post-death Backup Person access is activated."
          );
        }
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

      const submissionHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        submissionHeaders.Authorization =
          `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        "/api/memorial-submissions/status",
        {
          method: "POST",
          headers: submissionHeaders,
          credentials: "include",
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
        error instanceof Error
          ? error.message
          : "There was a problem updating the submission."
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
async function loadBackupPostDeathStatus(memorialId: number) {
  try {
    const response = await fetch(
      `/api/backup-settings/access?memorialId=${memorialId}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const result = await response.json();

    const unlocked =
      response.ok &&
      (result?.postDeathUnlocked === true ||
        result?.settings?.postDeathUnlocked === true);

    const secondaryBackupName = String(
      result?.settings?.secondaryBackupName || ""
    ).trim();
    const secondaryBackupEmail = String(
      result?.settings?.secondaryBackupEmail || ""
    ).trim();

    setHasSecondaryBackupPerson(
      response.ok &&
        Boolean(secondaryBackupName && secondaryBackupEmail)
    );
    setIsPostDeathUnlocked(unlocked);
    return unlocked;
  } catch (error) {
    console.error(
      "BACKUP POST-DEATH STATUS CHECK ERROR:",
      error
    );
    setHasSecondaryBackupPerson(false);
    setIsPostDeathUnlocked(false);
    return false;
  }
}

async function handleCopyPresentationLink() {
  if (!memorial) {
    setPresentationMessage(
      "The memorial record is not loaded."
    );
    return;
  }

  try {
    setIsCreatingPresentationLink(true);
    setPresentationMessage("");

    const response = await fetch(
      "/api/funeral-presentation",
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

    if (!response.ok || !result?.url) {
      throw new Error(
        result?.error ||
          "The Celebration of Life Presentation link could not be created."
      );
    }

    try {
      await navigator.clipboard.writeText(result.url);

      setPresentationMessage(
        "Celebration of Life Presentation link copied. The link is view-only and expires in 7 days."
      );
    } catch {
      setPresentationMessage(
        `Copy this Celebration of Life Presentation link: ${result.url}`
      );
    }
  } catch (error) {
    console.error(
      "FUNERAL PRESENTATION LINK ERROR:",
      error
    );

    setPresentationMessage(
      error instanceof Error
        ? error.message
        : "The Celebration of Life Presentation link could not be created."
    );
  } finally {
    setIsCreatingPresentationLink(false);
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

    if (memorial.is_living_preplan) {
      await loadBackupPostDeathStatus(memorial.id);
    } else {
      setIsPostDeathUnlocked(true);
    }

    /*
     * Re-run the management-page load with the newly issued
     * Backup Person cookie so pending management data is loaded
     * under the authorized session.
     */
    window.location.reload();
  } catch (error) {
    console.error(error);
    setIsBackupUnlocked(false);
    setBackupLoginError("Could not verify backup login.");
  }
}
async function handleActivateSecondaryBackupPerson() {
  if (!memorial?.id) {
    return;
  }

  const confirmed = window.confirm(
    "Transfer Backup Person access to the Secondary Backup Person now? This immediately ends Primary Backup Person authority and transfers authorized access to the Secondary Backup Person. Your current Primary Backup Person session will end."
  );

  if (!confirmed) {
    return;
  }

  setIsActivatingSecondary(true);
  setSecondaryActivationMessage("");

  try {
    const response = await fetch(
      "/api/backup-person/activate-secondary",
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
        result?.error ||
          "The Secondary Backup Person could not be activated."
      );
    }

    setSecondaryActivationMessage(
      "Backup Person access transferred to the Secondary Backup Person. Primary Backup Person authority has ended."
    );

    /*
     * Activating Secondary advances the authority generation for both
     * roles. The current Primary cookie is therefore invalid immediately.
     * Send this browser back through the normal hardened login screen.
     */
    window.location.href =
      `/memorial/${encodeURIComponent(memorial.slug)}/manage`;
  } catch (error) {
    setSecondaryActivationMessage(
      error instanceof Error
        ? error.message
        : "The Secondary Backup Person could not be activated."
    );
  } finally {
    setIsActivatingSecondary(false);
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
    setIsPostDeathUnlocked(false);
    setPresentationMessage("");

    window.location.assign(
      `/memorial/${encodeURIComponent(memorial?.slug || slug)}/manage`
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
      "This will convert the private Living MyEMemorial into the public memorial. " +
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
  !isOwner &&
  !isBackupUnlocked
) {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
        <Link
          href={`/memorial/${memorial.slug}`}
          className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-base font-semibold text-stone-700 hover:bg-stone-100"
        >
          ← Back to Memorial
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-stone-900">
          Backup Person Login
        </h1>

        <p className="mt-2 text-base leading-6 text-stone-600">
          Enter the backup email and password assigned to this Living MyEMemorial.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-base font-semibold text-stone-800">
              Backup Email
            </label>

            <input
              type="email"
              value={backupLoginEmail}
              onChange={(e) => setBackupLoginEmail(e.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-stone-800">
              Backup Password
            </label>

            <input
              type="password"
              value={backupLoginPassword}
              onChange={(e) => setBackupLoginPassword(e.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900"
            />
          </div>

          {backupLoginError && (
            <p className="rounded-2xl bg-red-50 p-3 text-base text-red-700">
              {backupLoginError}
            </p>
          )}

          <button
            type="button"
            onClick={handleBackupLogin}
            className="rounded-full bg-stone-900 px-5 py-3 text-base font-semibold text-white hover:bg-stone-700"
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
            className="mt-5 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-base font-semibold text-stone-700 hover:bg-stone-100"
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
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-base font-semibold text-stone-700 hover:bg-stone-100"
          >
            ← Back to My Memorials
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            Manage Memorial
          </h1>

          <p className="mt-2 text-lg font-semibold text-stone-800">
            {memorial.full_name || "Unnamed Memorial"}
          </p>

          <p className="mt-3 text-base leading-6 text-stone-600">
            Review visitor contributions and manage memorial settings.
          </p>
          {(isOwner || isBackupUnlocked) && (
  <>
    <div className="mt-5 flex flex-wrap gap-3">
      <Link
        href={`/create?edit=${memorial.id}`}
        className="inline-flex rounded-full bg-stone-900 px-5 py-3 text-base font-semibold text-white hover:bg-stone-700"
      >
        Edit Memorial
      </Link>

      {isBackupUnlocked && !isOwner && (
        <>
          {memorial.is_living_preplan && isPostDeathUnlocked && (
            <button
              type="button"
              onClick={handlePublishMemorial}
              disabled={isPublishing}
              className="inline-flex rounded-full bg-green-700 px-5 py-3 text-base font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex rounded-full border border-red-300 bg-white px-5 py-3 text-base font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            End Backup Access
          </button>
        </>
      )}
    </div>

    {publishError && (
      <p className="mt-4 rounded-2xl bg-red-50 p-4 text-base font-medium text-red-700">
        {publishError}
      </p>
    )}
  </>
)}
        </section>

{isBackupUnlocked &&
  !isOwner &&
  isPostDeathUnlocked &&
  backupRole === "primary" &&
  hasSecondaryBackupPerson && (
    <section className="rounded-3xl border-2 border-blue-300 bg-blue-50 p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-base font-bold uppercase tracking-[0.16em] text-blue-800">
            Backup Person Authority
          </p>

          <h2 className="mt-2 text-3xl font-bold text-stone-900">
            Secondary Backup Person
          </h2>

          <p className="mt-3 text-lg leading-8 text-stone-700">
            If you can no longer serve as the Primary Backup Person, you can
            transfer Backup Person access to the Secondary Backup Person
            previously chosen by the memorial owner.
          </p>
        </div>

        <button
          type="button"
          onClick={handleActivateSecondaryBackupPerson}
          disabled={isActivatingSecondary}
          className="inline-flex min-w-fit items-center justify-center rounded-full bg-blue-800 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isActivatingSecondary
            ? "Transferring Access..."
            : "Transfer Access to Secondary Backup Person"}
        </button>
      </div>

      {secondaryActivationMessage && (
        <p className="mt-5 rounded-2xl border border-blue-200 bg-white px-5 py-4 text-base font-semibold leading-7 text-stone-700">
          {secondaryActivationMessage}
        </p>
      )}
    </section>
  )}

{((isOwner &&
    memorial.is_published === true &&
    memorial.is_living_preplan !== true) ||
  (isBackupUnlocked &&
    !isOwner &&
    isPostDeathUnlocked)) && (
    <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-stone-900">
            Celebration of Life Presentation
          </h2>

          <p className="mt-3 text-lg leading-8 text-stone-700">
            Play this memorial&apos;s approved photos and videos on a television
            or projector. Photos advance automatically, videos play in full,
            and the presentation continuously loops.
          </p>
        </div>

        <div className="flex min-w-fit flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={`/memorial/${memorial.slug}/presentation`}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700"
          >
            ▶ Start Presentation
          </Link>

          {isBackupUnlocked && !isOwner && isPostDeathUnlocked && (
            <button
              type="button"
              onClick={handleCopyPresentationLink}
              disabled={isCreatingPresentationLink}
              className="inline-flex items-center justify-center rounded-full border border-stone-400 bg-white px-6 py-4 text-base font-bold text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingPresentationLink
                ? "Creating Link..."
                : "🔗 Copy Funeral Home Link"}
            </button>
          )}
        </div>
      </div>

      {presentationMessage && (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-white px-5 py-4 text-base font-semibold leading-7 text-stone-700">
          {presentationMessage}
        </p>
      )}
    </section>
  )}

<div className="[&_.text-base]:!text-base [&_.text-base]:!text-base">
  <PlanSection
    plan={memorial.plan || "basic"}
    handleUpgradePlan={handleUpgradePlan}
  />
</div>

<div className="[&_.text-base]:!text-base [&_.text-base]:!text-base">
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
</div>

        <SubmissionPhotoViewerModal
          submissionPhotoViewer={submissionPhotoViewer}
          setSubmissionPhotoViewer={setSubmissionPhotoViewer}
        />
      </div>
    </main>
  );
}