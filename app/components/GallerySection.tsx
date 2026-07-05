"use client";

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

type GallerySectionProps = {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  splitGalleryPhotos: (value: string) => string[];
  galleryDragSensors: any;
  galleryInputResetKey: number;
  galleryPhotoFiles: File[];
  setGalleryPhotoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isSaving: boolean;
  isPublished: boolean;
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
  return (
    <>
      <input
        type="hidden"
        name="galleryPhotos"
        value={form.galleryPhotos}
        onChange={handleChange}
      />

      {splitGalleryPhotos(form.galleryPhotos).length > 0 ? (
        <DndContext
          sensors={galleryDragSensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) return;

            const photos = splitGalleryPhotos(form.galleryPhotos);

            const oldIndex = photos.findIndex(
              (_, index) => `gallery-${index}` === active.id
            );

            const newIndex = photos.findIndex(
              (_, index) => `gallery-${index}` === over.id
            );

            if (oldIndex === -1 || newIndex === -1) return;

            const reorderedPhotos = arrayMove(photos, oldIndex, newIndex);

            const reorderedNotes = arrayMove(
              form.galleryPhotoNotes ?? [],
              oldIndex,
              newIndex
            );

            setForm((prev: any) => ({
              ...prev,
              galleryPhotos: reorderedPhotos.join(","),
              galleryPhotoNotes: reorderedNotes,
            }));
          }}
        >
          <SortableContext
            items={splitGalleryPhotos(form.galleryPhotos).map(
              (_, index) => `gallery-${index}`
            )}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {splitGalleryPhotos(form.galleryPhotos).map(
                (photo, index) => (
                  <SortableGalleryPhotoCard
                    key={`gallery-${index}`}
                    id={`gallery-${index}`}
                    photo={photo}
                    index={index}
                    note={form.galleryPhotoNotes?.[index] ?? ""}
                    onNoteChange={(photoIndex, value) => {
                      setForm((prev: any) => {
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
                      if (!confirm("Delete this gallery photo?")) return;

                      setForm((prev: any) => {
                        const photos = splitGalleryPhotos(
                          prev.galleryPhotos
                        );
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
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-sm text-stone-500">
          No gallery photos uploaded yet.
        </p>
      )}

      <div className="mt-4">
        <label className="text-sm font-medium text-stone-700">
          Upload Gallery Photos
        </label>

        <input
          key={`gallery-upload-${galleryInputResetKey}`}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);

            const galleryPhotoLimit =
              form.plan === "premium"
                ? Infinity
                : form.plan === "plus"
                ? 150
                : 50;

            const existingGalleryPhotoCount = splitGalleryPhotos(
              form.galleryPhotos
            ).length;

            const totalGalleryPhotoCount =
              existingGalleryPhotoCount + files.length;

            if (
              Number.isFinite(galleryPhotoLimit) &&
              totalGalleryPhotoCount > galleryPhotoLimit
            ) {
              alert(
                `${form.plan === "plus" ? "Plus" : "Basic"} Memorial allows up to ${galleryPhotoLimit} gallery photos. This memorial already has ${existingGalleryPhotoCount}, and you selected ${files.length}.`
              );

              e.target.value = "";
              setGalleryPhotoFiles([]);
              return;
            }

            setGalleryPhotoFiles(files);
          }}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3"
        />

        <p className="mt-2 text-sm text-stone-600">
          {form.plan === "premium"
            ? `${
                splitGalleryPhotos(form.galleryPhotos).length +
                galleryPhotoFiles.length
              } gallery photo${
                splitGalleryPhotos(form.galleryPhotos).length +
                  galleryPhotoFiles.length ===
                1
                  ? ""
                  : "s"
              } used. Premium allows unlimited photos.`
            : `${
                splitGalleryPhotos(form.galleryPhotos).length +
                galleryPhotoFiles.length
              } of ${form.plan === "plus" ? 150 : 50} gallery photos used.`}
        </p>
      </div>

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </>
  );
}