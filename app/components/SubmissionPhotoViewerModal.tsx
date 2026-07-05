import React from "react";

type SubmissionPhotoViewer = {
  photos: string[];
  index: number;
};

type SubmissionPhotoViewerModalProps = {
  submissionPhotoViewer: SubmissionPhotoViewer | null;
  setSubmissionPhotoViewer: React.Dispatch<
    React.SetStateAction<SubmissionPhotoViewer | null>
  >;
};

export default function SubmissionPhotoViewerModal({
  submissionPhotoViewer,
  setSubmissionPhotoViewer,
}: SubmissionPhotoViewerModalProps) {
  if (!submissionPhotoViewer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <button
        type="button"
        onClick={() => setSubmissionPhotoViewer(null)}
        className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900"
      >
        Close
      </button>

      <button
        type="button"
        onClick={() =>
          setSubmissionPhotoViewer((prev) =>
            prev
              ? {
                  ...prev,
                  index:
                    prev.index === 0
                      ? prev.photos.length - 1
                      : prev.index - 1,
                }
              : prev
          )
        }
        className="absolute left-4 rounded-full bg-white px-4 py-3 text-xl font-bold text-stone-900"
      >
        ‹
      </button>

      <img
        src={submissionPhotoViewer.photos[submissionPhotoViewer.index]}
        alt="Submitted photo preview"
        className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
      />

      <button
        type="button"
        onClick={() =>
          setSubmissionPhotoViewer((prev) =>
            prev
              ? {
                  ...prev,
                  index:
                    prev.index === prev.photos.length - 1
                      ? 0
                      : prev.index + 1,
                }
              : prev
          )
        }
        className="absolute right-4 rounded-full bg-white px-4 py-3 text-xl font-bold text-stone-900"
      >
        ›
      </button>
    </div>
  );
}