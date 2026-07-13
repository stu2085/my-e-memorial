"use client";

type CreateVideoMemoriesSectionProps = {
  isPaid: boolean;
  videoFiles: File[];
  videoNotes: string[];
  videoError: string;
  form: {
    plan: string;
  };
  handleVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setVideoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setVideoNotes: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function CreateVideoMemoriesSection({
  isPaid,
  videoFiles,
  videoNotes,
  videoError,
  form,
  handleVideoChange,
  setVideoFiles,
  setVideoNotes,
}: CreateVideoMemoriesSectionProps) {
  const limit =
    form.plan === "premium" ? 10 : form.plan === "plus" ? 5 : 2;

  const total = videoFiles.length;
  const remaining = Math.max(limit - total, 0);

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-stone-900">Memorial Videos</h2>

      <p className="mt-2 text-sm text-stone-600">
        Basic includes 15 minutes of Video Memories, Plus includes 30 minutes,
        and Premium includes 60 minutes. Each individual video must be 5 minutes
        or less.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold text-stone-800">
          Upload Videos
        </label>

        {isPaid ? (
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoChange}
            className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700"
          />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please choose a plan and complete payment before uploading videos.
            Videos selected before payment cannot be permanently saved and may
            need to be uploaded again after checkout.
          </div>
        )}
      </div>

      {videoError && (
        <p className="mt-3 text-sm text-red-600">{videoError}</p>
      )}

      {remaining <= 0 && (
        <>
          <p className="mt-3 text-sm text-amber-600">
            You’ve reached your video limit. You can add more videos for $9.95
            each.
          </p>

          <p className="mt-3 text-sm text-amber-600">
            Video limits depend on your selected plan. You can add more videos
            later from the Edit page.
          </p>
        </>
      )}

      {videoFiles.length > 0 && (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">
            {videoFiles.length} video
            {videoFiles.length === 1 ? "" : "s"} selected
          </p>

          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            {videoFiles.map((file, index) => (
              <li key={file.name} className="rounded-xl bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="break-all">{file.name}</span>

                  <button
                    type="button"
                    onClick={() => {
                      setVideoFiles((prev) =>
                        prev.filter((item) => item.name !== file.name)
                      );

                      setVideoNotes((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Video caption or memory..."
                  value={videoNotes[index] || ""}
                  onChange={(e) => {
                    const updated = [...videoNotes];
                    updated[index] = e.target.value;
                    setVideoNotes(updated);
                  }}
                  className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}