"use client";

import { useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import SortableGalleryPhotoCard from "./SortableGalleryPhotoCard";
import QuickSaveButton from "./QuickSaveButton";
import { createPhotoFingerprint } from "../../lib/photo-engine/createPhotoFingerprint";

type GallerySectionProps = {
  form?: any;
  setForm?: React.Dispatch<React.SetStateAction<any>>;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  splitGalleryPhotos?: (value: string) => string[];
  galleryDragSensors?: any;
  galleryInputResetKey?: number;
  galleryPhotoFiles?: File[];
  setGalleryPhotoFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  isSaving?: boolean;
  isPublished?: boolean;
};

export default function GallerySection({
  form,
  setForm,
  handleChange,
  splitGalleryPhotos,
  galleryDragSensors,
  galleryInputResetKey,
  galleryPhotoFiles,
  setGalleryPhotoFiles,
  isSaving,
  isPublished,
}: GallerySectionProps) {
  const galleryPhotos =
    splitGalleryPhotos?.(form?.galleryPhotos ?? "") ?? [];

  const selectedGalleryFiles = galleryPhotoFiles ?? [];

  const selectedGalleryPreviews = useMemo(
    () =>
      selectedGalleryFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    [selectedGalleryFiles]
  );

  useEffect(() => {
    return () => {
      selectedGalleryPreviews.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [selectedGalleryPreviews]);

  function removeSelectedGalleryPhoto(indexToRemove: number) {
    setGalleryPhotoFiles?.((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );
  }

  const galleryPhotoLimit =
    form?.plan === "premium"
      ? Infinity
      : form?.plan === "plus"
        ? 150
        : 50;

  const totalPhotoCount =
    galleryPhotos.length + selectedGalleryFiles.length;

  return (
    <>
      <h2 className="text-2xl font-bold text-stone-900">
        Gallery Photos
      </h2>

      <input
        type="hidden"
        name="galleryPhotos"
        value={form?.galleryPhotos ?? ""}
        onChange={handleChange}
      />

      {galleryPhotos.length > 0 ? (
        <div className="mt-4">
          <p className="mb-3 text-sm font-semibold text-stone-700">
            Saved Gallery Photos
          </p>

          <DndContext
            sensors={galleryDragSensors}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => {
              const { active, over } = event;

              if (!over || active.id === over.id) return;

              const oldIndex = galleryPhotos.findIndex(
                (_, index) => `gallery-${index}` === active.id
              );

              const newIndex = galleryPhotos.findIndex(
                (_, index) => `gallery-${index}` === over.id
              );

              if (oldIndex === -1 || newIndex === -1) return;

              const reorderedPhotos = arrayMove(
                galleryPhotos,
                oldIndex,
                newIndex
              );

              const currentNotes = form?.galleryPhotoNotes ?? [];

              const reorderedNotes =
                currentNotes.length === galleryPhotos.length
                  ? arrayMove(currentNotes, oldIndex, newIndex)
                  : currentNotes;

              setForm?.((prev: any) => ({
                ...prev,
                galleryPhotos: reorderedPhotos.join(","),
                galleryPhotoNotes: reorderedNotes,
              }));
            }}
          >
            <SortableContext
              items={galleryPhotos.map(
                (_, index) => `gallery-${index}`
              )}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {galleryPhotos.map((photo, index) => (
                  <SortableGalleryPhotoCard
                    key={`gallery-${index}`}
                    id={`gallery-${index}`}
                    photo={photo}
                    index={index}
                    note={form?.galleryPhotoNotes?.[index] ?? ""}
                    onNoteChange={(photoIndex, value) => {
                      setForm?.((prev: any) => {
                        const nextNotes = [
                          ...(prev.galleryPhotoNotes ?? []),
                        ];

                        nextNotes[photoIndex] = value;

                        return {
                          ...prev,
                          galleryPhotoNotes: nextNotes,
                        };
                      });
                    }}
                    onDelete={(photoIndex) => {
                      if (!confirm("Delete this gallery photo?")) {
                        return;
                      }

                      setForm?.((prev: any) => {
                        const photos =
                          splitGalleryPhotos?.(
                            prev.galleryPhotos ?? ""
                          ) ?? [];

                        const notes = [
                          ...(prev.galleryPhotoNotes ?? []),
                        ];

                        photos.splice(photoIndex, 1);
                        notes.splice(photoIndex, 1);

                        return {
                          ...prev,
                          galleryPhotos: photos.join(","),
                          galleryPhotoNotes: notes,
                        };
                      });
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-500">
          No saved gallery photos yet.
        </p>
      )}

      {selectedGalleryPreviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="mb-4">
            <p className="font-semibold text-green-900">
              Selected Photos
            </p>

            <p className="mt-1 text-sm text-green-800">
              These photos are ready to upload. Click Save Changes to
              keep them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {selectedGalleryPreviews.map(
              ({ file, previewUrl }, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm"
                >
                  <img
                    src={previewUrl}
                    alt={`Selected gallery photo ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />

                  <div className="p-2">
                    <p
                      className="truncate text-xs text-stone-600"
                      title={file.name}
                    >
                      {file.name}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        removeSelectedGalleryPhoto(index)
                      }
                      className="mt-2 w-full rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-stone-700">
          Upload Gallery Photos
        </label>

        <input
          key={`gallery-upload-${galleryInputResetKey}`}
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);

            if (files.length === 0) {
              return;
            }

            const existingSelectedFingerprints =
              new Set<string>();

            for (const file of selectedGalleryFiles) {
              existingSelectedFingerprints.add(
                await createPhotoFingerprint(file)
              );
            }

            const uniqueFiles: File[] = [];
            let duplicateCount = 0;

            for (const file of files) {
              const fingerprint =
                await createPhotoFingerprint(file);

              if (
                existingSelectedFingerprints.has(fingerprint)
              ) {
                duplicateCount += 1;
                continue;
              }

              existingSelectedFingerprints.add(fingerprint);
              uniqueFiles.push(file);
            }

            if (duplicateCount > 0) {
              alert(
                `${duplicateCount} duplicate photo${
                  duplicateCount === 1
                    ? " was"
                    : "s were"
                } not added.`
              );
            }

            const existingGalleryPhotoCount =
              galleryPhotos.length;

            const totalGalleryPhotoCount =
              existingGalleryPhotoCount +
              selectedGalleryFiles.length +
              uniqueFiles.length;

            if (
              Number.isFinite(galleryPhotoLimit) &&
              totalGalleryPhotoCount > galleryPhotoLimit
            ) {
              alert(
                `${
                  form?.plan === "plus"
                    ? "Plus"
                    : "Basic"
                } Memorial allows up to ${galleryPhotoLimit} gallery photos. This memorial already has ${
                  existingGalleryPhotoCount +
                  selectedGalleryFiles.length
                }, and you selected ${
                  uniqueFiles.length
                } additional photo${
                  uniqueFiles.length === 1 ? "" : "s"
                }.`
              );

              e.target.value = "";
              return;
            }

            setGalleryPhotoFiles?.((currentFiles) => [
              ...currentFiles,
              ...uniqueFiles,
            ]);

            e.target.value = "";
          }}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3"
        />

        <p className="mt-2 text-sm text-stone-600">
          {form?.plan === "premium"
            ? `${totalPhotoCount} gallery photo${
                totalPhotoCount === 1 ? "" : "s"
              } used. Premium allows unlimited photos.`
            : `${totalPhotoCount} of ${
                form?.plan === "plus" ? 150 : 50
              } gallery photos used.`}
        </p>
      </div>

      {typeof isSaving === "boolean" &&
        typeof isPublished === "boolean" && (
          <QuickSaveButton
  sectionId="gallery"
  isSaving={isSaving}
  isPublished={isPublished}
/>
        )}
    </>
  );
}