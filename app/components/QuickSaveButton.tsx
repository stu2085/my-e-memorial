"use client";

import { useSaveFeedback } from "./SaveFeedbackContext";

type QuickSaveButtonProps = {
  isSaving: boolean;
  isPublished: boolean;
  sectionId?: string;
  successMessage?: string;
};

export default function QuickSaveButton({
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
      {displayedSuccessMessage && (
        <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {displayedSuccessMessage}
        </p>
      )}

      <p className="mt-4 text-right text-xs text-stone-500">
        {isPublished
          ? "Saved changes become public."
          : "Your memorial remains private until you publish it."}
      </p>
    </>
  );
}