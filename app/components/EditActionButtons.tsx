import Link from "next/link";

type EditActionButtonsProps = {
  isPublished: boolean;
  isSaving: boolean;
  isOwner: boolean;
  isBackupUnlocked: boolean;
  successMessage: string;
  originalSlug: string;
  handlePublishMemorial: () => Promise<void>;
};

export default function EditActionButtons({
  isPublished,
  isSaving,
  isOwner,
  isBackupUnlocked,
  successMessage,
  originalSlug,
  handlePublishMemorial,
}: EditActionButtonsProps) {
  return (
    <>
      <div
        className={`rounded-2xl border px-5 py-4 text-sm ${
          isPublished
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <p className="font-semibold">
          {isPublished ? "Published" : "Draft — Not Public"}
        </p>

        <p className="mt-1">
          {isPublished
            ? "This memorial is public. Saved changes will appear on the public memorial."
            : "This memorial is visible only to you until it is published."}
        </p>
      </div>

      <div className="border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <p className="mt-3 text-sm font-medium text-stone-600">
          {isPublished
            ? "Save your changes and continue editing. Your saved changes will appear on the public memorial."
            : "Save your changes and continue editing. Your memorial will remain private until you publish it."}
        </p>
      </div>

      {!isPublished &&
        (isOwner || isBackupUnlocked) && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handlePublishMemorial}
              className="inline-flex items-center justify-center rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Publish Memorial
            </button>

            <p className="mt-2 text-sm text-stone-600">
              Publish this memorial so it becomes available to the public.
            </p>
          </div>
        )}

      {isPublished && (
        <div className="mt-4">
          <Link
            href={`/memorial/${originalSlug}`}
            className="inline-flex items-center justify-center rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            View Public Memorial
          </Link>

          <p className="mt-2 text-sm text-stone-600">
            Leave the Edit page and view the memorial exactly as the public sees it.
          </p>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}
    </>
  );
}