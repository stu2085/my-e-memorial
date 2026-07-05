"use client";

type QuickSaveButtonProps = {
  isSaving: boolean;
  isPublished: boolean;
};

export default function QuickSaveButton({
  isSaving,
  isPublished,
}: QuickSaveButtonProps) {
  return (
    <>
      <div className="mt-5 flex justify-end border-t border-stone-200 pt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <p className="mt-2 text-right text-xs text-stone-500">
        {isPublished
          ? "Changes become public when you save."
          : "Saving does not make your memorial public."}
      </p>
    </>
  );
}