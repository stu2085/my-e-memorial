"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

type SortableGalleryPhotoCardProps = {
  id: string;
  photo: string;
  index: number;
  note: string;
  onNoteChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
};

export default function SortableGalleryPhotoCard({
  id,
  photo,
  index,
  note,
  onNoteChange,
  onDelete,
}: SortableGalleryPhotoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-stone-200 bg-white p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mb-2 w-full touch-none rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 active:scale-95"
      >
        ≡ Hold here to reorder
      </button>

      <img
        src={photo}
        alt={`Gallery photo ${index + 1}`}
        className="h-36 w-full rounded-2xl object-cover"
      />

      <textarea
        value={note}
        onChange={(e) => onNoteChange(index, e.target.value)}
        rows={3}
        placeholder="Add a description for this photo..."
        className="mt-3 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
      />

      <button
        type="button"
        onClick={() => onDelete(index)}
        className="mt-3 w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
      >
        Delete Photo
      </button>
    </div>
  );
}