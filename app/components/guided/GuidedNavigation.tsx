type GuidedNavigationProps = {
  currentChapterIndex: number;
  totalChapters: number;
  isFirstChapter: boolean;
  isLastChapter: boolean;
  isSaving?: boolean;
  finalButtonLabel?: string;
  onBack: () => void;
  onContinue: () => void;
  onSaveAndExit: () => void;
};

export default function GuidedNavigation({
  currentChapterIndex,
  totalChapters,
  isFirstChapter,
  isLastChapter,
  isSaving = false,
  finalButtonLabel = "Finish Review",
  onBack,
  onContinue,
  onSaveAndExit,
}: GuidedNavigationProps) {
  const chapterNumber = currentChapterIndex + 1;

  return (
  <div className="mt-8 border-t border-stone-200 pt-6">
    <div className="mb-5">
      <p className="text-sm font-medium text-stone-500">
        Chapter {chapterNumber} of {totalChapters}
      </p>
    </div>

    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstChapter || isSaving}
        className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Back
      </button>

      <button
        type="button"
        onClick={onContinue}
        disabled={isSaving}
        className="rounded-full bg-stone-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLastChapter ? finalButtonLabel : "Save & Continue"}
      </button>
    </div>

    <div className="mt-8 border-t border-stone-200 pt-5 text-center">
      <button
        type="button"
        onClick={onSaveAndExit}
        disabled={isSaving}
        className="text-sm font-semibold text-stone-500 underline-offset-4 transition hover:text-stone-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save & Exit"}
      </button>
    </div>
  </div>
);
}