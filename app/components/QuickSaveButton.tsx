"use client";

import { useSaveFeedback } from "./SaveFeedbackContext";

type QuickSaveButtonProps = {
  isSaving: boolean;
  isPublished: boolean;
  sectionId?: string;
  successMessage?: string;
};

export default function QuickSaveButton({
  isSaving,
  isPublished,
  sectionId = "general",
  successMessage = "",
}: QuickSaveButtonProps) {
  const saveFeedback = useSaveFeedback();

  const displayedSuccessMessage =
    successMessage ||
    (saveFeedback.savedSection === sectionId
      ? saveFeedback.successMessage
      : "");

  return (
    <>
      <div className="mt-5 flex justify-end border-t border-stone-200 pt-5">
        <button
          type="submit"
          name="saveSection"
          value={sectionId}
          disabled={isSaving}
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {displayedSuccessMessage && (
        <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {displayedSuccessMessage}
        </p>
      )}

      <p className="mt-2 text-right text-xs text-stone-500">
        {isPublished
          ? "Changes become public when you save."
          : "Saving does not make your memorial public."}
      </p>
    </>
  );
}