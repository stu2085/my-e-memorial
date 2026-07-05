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
            ? "This memorial is public. Changes become visible when you save."
            : "This memorial is visible only to you until it is published."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        {(isOwner || isBackupUnlocked) && !isPublished && (
          <button
            type="button"
            onClick={handlePublishMemorial}
            className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            Publish Memorial
          </button>
        )}

        {!successMessage && (
          <button
            type="button"
            onClick={() => {
              window.location.href = `/memorial/${originalSlug}`;
            }}
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-50"
          >
            Preview Memorial
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-stone-500">
        {isPublished
          ? "Changes become public when you save."
          : "Saving does not make your changes public."}
      </p>

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          <p className="font-semibold">{successMessage}</p>

          <Link
            href={`/memorial/${originalSlug}`}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Publish and View Memorial
          </Link>
        </div>
      )}
    </>
  );
}