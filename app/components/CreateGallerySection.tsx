"use client";

import {
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { createPhotoFingerprint } from "../../lib/photo-engine/createPhotoFingerprint";
import {
  createGalleryPhoto,
  releaseGalleryPhotoPreview,
  type GalleryPhoto,
} from "../../lib/photo-engine/GalleryPhoto";
import type { UploadProgress } from "../../lib/photo-engine/uploadProgress";

type PlanKey = "basic" | "plus" | "premium";

type CreateGallerySectionProps = {
  form: {
    plan: string;
  };
  galleryPhotos: GalleryPhoto[];
  setGalleryPhotos: Dispatch<SetStateAction<GalleryPhoto[]>>;
  galleryUploadProgress: UploadProgress | null;
   isPaid: boolean;
  PLAN_LIMITS: Record<
    PlanKey,
    {
      label: string;
      galleryPhotos: number;
    }
  >;
};

export default function CreateGallerySection({
  form,
  galleryPhotos,
  setGalleryPhotos,
  galleryUploadProgress,
  isPaid,
  PLAN_LIMITS,
}: CreateGallerySectionProps) {
  const [selectionMessage, setSelectionMessage] = useState("");
  const [isCheckingPhotos, setIsCheckingPhotos] = useState(false);

  const selectedPlan = form.plan as PlanKey;
  const planDetails =
    PLAN_LIMITS[selectedPlan] ?? PLAN_LIMITS.basic;

  const limit = planDetails.galleryPhotos;
  const hasFiniteLimit = Number.isFinite(limit);

  const remainingPhotos = hasFiniteLimit
    ? Math.max(limit - galleryPhotos.length, 0)
    : null;

  const capacityPercentage =
    hasFiniteLimit && limit > 0
      ? Math.min((galleryPhotos.length / limit) * 100, 100)
      : 0;

  async function handlePhotoSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const incomingFiles = Array.from(input.files ?? []);

    input.value = "";

    if (incomingFiles.length === 0) {
      return;
    }

    setIsCheckingPhotos(true);
    setSelectionMessage("");

    try {
      const availableSlots = hasFiniteLimit
        ? Math.max(limit - galleryPhotos.length, 0)
        : Number.POSITIVE_INFINITY;

      if (availableSlots === 0) {
        setSelectionMessage(
          `${planDetails.label} allows up to ${limit} gallery photos.`
        );
        return;
      }

      const existingFingerprints = new Set(
        galleryPhotos.map((photo) => photo.fingerprint)
      );

      const acceptedPhotos: GalleryPhoto[] = [];
      const fingerprintsFromThisSelection = new Set<string>();

      let duplicateCount = 0;
      let invalidFileCount = 0;
      let overLimitCount = 0;

      for (const file of incomingFiles) {
        if (!file.type.startsWith("image/")) {
          invalidFileCount += 1;
          continue;
        }

        const fingerprint =
  await createPhotoFingerprint(file);

        const isDuplicate =
          existingFingerprints.has(fingerprint) ||
          fingerprintsFromThisSelection.has(fingerprint);

        if (isDuplicate) {
          duplicateCount += 1;
          continue;
        }

        if (acceptedPhotos.length >= availableSlots) {
          overLimitCount += 1;
          continue;
        }

        fingerprintsFromThisSelection.add(fingerprint);

        acceptedPhotos.push(
          createGalleryPhoto(file, fingerprint)
        );
      }

      if (acceptedPhotos.length > 0) {
  setGalleryPhotos((currentPhotos) => [
    ...currentPhotos,
    ...acceptedPhotos,
  ]);
}

      const messages: string[] = [];

      if (acceptedPhotos.length > 0) {
        messages.push(
          `${acceptedPhotos.length} photo${
            acceptedPhotos.length === 1 ? "" : "s"
          } added.`
        );
      }

      if (duplicateCount > 0) {
        messages.push(
          `${duplicateCount} duplicate photo${
            duplicateCount === 1 ? "" : "s"
          } skipped.`
        );
      }

      if (invalidFileCount > 0) {
        messages.push(
          `${invalidFileCount} non-image file${
            invalidFileCount === 1 ? "" : "s"
          } skipped.`
        );
      }

      if (overLimitCount > 0) {
        messages.push(
          `${overLimitCount} photo${
            overLimitCount === 1 ? "" : "s"
          } not added because the ${planDetails.label} limit is ${limit}.`
        );
      }

      setSelectionMessage(messages.join(" "));
    } catch (error) {
      console.error("PHOTO SELECTION FAILED", error);

      setSelectionMessage(
        "One or more photos could not be checked. Please try selecting them again."
      );
    } finally {
      setIsCheckingPhotos(false);
    }
  }

  function removePhoto(photoId: string) {
    setGalleryPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos.find(
        (photo) => photo.id === photoId
      );

      if (photoToRemove) {
        releaseGalleryPhotoPreview(photoToRemove);
      }

      return currentPhotos.filter(
        (photo) => photo.id !== photoId
      );
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-stone-900">
  Gallery Photos
</h2>

<p className="mt-2 text-sm text-stone-600">
  Upload and organize the photos that will appear in the memorial gallery.
</p>
{!isPaid && (
  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    Choose a memorial plan and complete payment before uploading gallery photos.
  </p>
)}
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={
  !isPaid ||
  isCheckingPhotos ||
  (hasFiniteLimit && galleryPhotos.length >= limit)
}
        onChange={handlePhotoSelection}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
      />

      
{isCheckingPhotos && (
  <p className="text-sm font-medium text-stone-700">
    Checking selected photos...
  </p>
)}


      {selectionMessage && (
        <p
          role="status"
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
        >
          {selectionMessage}
        </p>
      )}

      <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-stone-800">
            Gallery Capacity
          </p>

          <p className="text-sm text-stone-600">
            {hasFiniteLimit
              ? `${galleryPhotos.length} of ${limit}`
              : `${galleryPhotos.length} selected`}
          </p>
        </div>

        {hasFiniteLimit ? (
          <>
            <div
              role="progressbar"
              aria-label="Gallery capacity"
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={galleryPhotos.length}
              className="h-3 overflow-hidden rounded-full bg-stone-200"
            >
              <div
                className="h-full rounded-full bg-stone-800 transition-[width] duration-300"
                style={{
                  width: `${capacityPercentage}%`,
                }}
              />
            </div>

            <p className="text-sm text-stone-600">
              {remainingPhotos} photo
              {remainingPhotos === 1 ? "" : "s"} remaining
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-600">
            Premium allows unlimited gallery photos.
          </p>
        )}
      </div>

      {galleryPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
            >
              <img
                src={photo.previewUrl}
                alt={photo.file.name}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Remove ${photo.file.name}`}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {galleryUploadProgress &&
        galleryUploadProgress.total > 0 && (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-stone-800">
                Uploading Photos
              </p>

              <p className="text-sm text-stone-600">
                {galleryUploadProgress.processed} of{" "}
                {galleryUploadProgress.total} completed
              </p>
            </div>

            <div
              role="progressbar"
              aria-label="Photo upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                galleryUploadProgress.percentComplete
              }
              className="h-3 overflow-hidden rounded-full bg-stone-200"
            >
              <div
                className="h-full rounded-full bg-stone-800 transition-[width] duration-300"
                style={{
                  width: `${galleryUploadProgress.percentComplete}%`,
                }}
              />
            </div>

            <p className="text-sm text-stone-600">
              {galleryUploadProgress.percentComplete}% complete
            </p>

            {galleryUploadProgress.currentFileName && (
              <div className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <p className="break-all font-medium">
                  {galleryUploadProgress.currentFileName}
                </p>

                <p className="mt-1">
                  {galleryUploadProgress.currentStatus ===
                    "optimizing" && "Optimizing..."}

                  {galleryUploadProgress.currentStatus ===
                    "uploading" && "Uploading..."}

                  {galleryUploadProgress.currentStatus ===
                    "retrying" &&
                    `Retrying upload ${galleryUploadProgress.currentRetryCount} of ${galleryUploadProgress.currentMaxRetries}...`}
                </p>
              </div>
            )}

            {galleryUploadProgress.failed > 0 && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {galleryUploadProgress.failed} photo
                {galleryUploadProgress.failed === 1
                  ? ""
                  : "s"}{" "}
                could not be uploaded.
              </p>
            )}
          </div>
        )}
    </div>
  );
}