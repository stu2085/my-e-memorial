"use client";

import MuxPlayer from "@mux/mux-player-react";
type CreateVideoMemoriesSectionProps = {
  isPaid: boolean;
  videoFiles: File[];
  videoNotes: string[];
savedVideoUrls?: string[];
setSavedVideoUrls?: React.Dispatch<React.SetStateAction<string[]>>;
savedVideoNotes?: string[];
setSavedVideoNotes?: React.Dispatch<React.SetStateAction<string[]>>;
videoError: string;
  form: {
  plan: string;
  videoLinkUrls: string[];
  videoLinkNotes: string[];
  videoLinkThumbnailUrls: string[];
};
  handleVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setVideoFiles: React.Dispatch<React.SetStateAction<File[]>>;
   setVideoNotes: React.Dispatch<React.SetStateAction<string[]>>;
  videoLinkThumbnailFiles: (File | null)[];
  setVideoLinkThumbnailFiles: React.Dispatch<
    React.SetStateAction<(File | null)[]>
  >;
  setForm: React.Dispatch<
    React.SetStateAction<any>
  >;
};

export default function CreateVideoMemoriesSection({
  isPaid,
  videoFiles,
  videoNotes,
  savedVideoUrls = [],
setSavedVideoUrls,
savedVideoNotes = [],
setSavedVideoNotes,
videoError,
  form,
  handleVideoChange,
  setVideoFiles,
setVideoNotes,
videoLinkThumbnailFiles,
setVideoLinkThumbnailFiles,
setForm,
}: CreateVideoMemoriesSectionProps) {
  const limit =
    form.plan === "premium" ? 10 : form.plan === "plus" ? 5 : 2;

  const total = savedVideoUrls.length + videoFiles.length;
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
{savedVideoUrls.length > 0 && (
  <div className="mt-4 grid gap-6 md:grid-cols-2">
    {savedVideoUrls.map((videoId, index) => (
      <div
        key={`${videoId}-${index}`}
        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
      >
        <p className="mb-3 text-sm font-semibold text-stone-800">
          Saved Video {index + 1}
        </p>

        <MuxPlayer
          playbackId={videoId}
          streamType="on-demand"
          className="aspect-video w-full rounded-xl bg-black"
        />

        <input
          type="text"
          placeholder="Video caption or memory..."
          value={savedVideoNotes[index] || ""}
          onChange={(e) => {
            const value = e.target.value;

            setSavedVideoNotes?.((currentNotes) => {
              const nextNotes = [...currentNotes];
              nextNotes[index] = value;
              return nextNotes;
            });
          }}
          className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              setSavedVideoUrls?.((currentUrls) => {
                if (index === 0) {
                  return currentUrls;
                }

                const nextUrls = [...currentUrls];

                [nextUrls[index - 1], nextUrls[index]] = [
                  nextUrls[index],
                  nextUrls[index - 1],
                ];

                return nextUrls;
              });

              setSavedVideoNotes?.((currentNotes) => {
                const nextNotes = [...currentNotes];

                [nextNotes[index - 1], nextNotes[index]] = [
                  nextNotes[index] ?? "",
                  nextNotes[index - 1] ?? "",
                ];

                return nextNotes;
              });
            }}
            className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Left
          </button>

          <button
            type="button"
            onClick={() => {
              setSavedVideoUrls?.((currentUrls) =>
                currentUrls.filter((_, i) => i !== index)
              );

              setSavedVideoNotes?.((currentNotes) =>
                currentNotes.filter((_, i) => i !== index)
              );
            }}
            className="rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>

          <button
            type="button"
            disabled={index === savedVideoUrls.length - 1}
            onClick={() => {
              setSavedVideoUrls?.((currentUrls) => {
                if (index === currentUrls.length - 1) {
                  return currentUrls;
                }

                const nextUrls = [...currentUrls];

                [nextUrls[index], nextUrls[index + 1]] = [
                  nextUrls[index + 1],
                  nextUrls[index],
                ];

                return nextUrls;
              });

              setSavedVideoNotes?.((currentNotes) => {
                const nextNotes = [...currentNotes];

                [nextNotes[index], nextNotes[index + 1]] = [
                  nextNotes[index + 1] ?? "",
                  nextNotes[index] ?? "",
                ];

                return nextNotes;
              });
            }}
            className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Right →
          </button>
        </div>
      </div>
    ))}
  </div>
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
    <div className="mt-8 border-t border-stone-200 pt-6">
  <h3 className="text-lg font-semibold text-stone-900">
    YouTube or Other Video Links
  </h3>

  <p className="mt-2 text-sm text-stone-600">
    Add links to videos hosted on YouTube or another website. You can also add
    a short caption or memory for each link.
  </p>

  <div className="mt-4 space-y-4">
    {(form.videoLinkUrls ?? []).map((url, index) => (
      <div
        key={`${url}-${index}`}
        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => {
            const value = e.target.value;

            setForm((prev: any) => {
              const nextUrls = [...(prev.videoLinkUrls ?? [])];
              nextUrls[index] = value;

              return {
                ...prev,
                videoLinkUrls: nextUrls,
              };
            });
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
        />

        <input
  type="text"
  value={form.videoLinkNotes?.[index] ?? ""}
  onChange={(e) => {
    const value = e.target.value;

    setForm((prev: any) => {
      const nextNotes = [...(prev.videoLinkNotes ?? [])];
      nextNotes[index] = value;

      return {
        ...prev,
        videoLinkNotes: nextNotes,
      };
    });
  }}
  placeholder="Video caption or memory..."
  className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
/>

<div className="mt-3">
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Video Preview Image (optional)
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;

      setVideoLinkThumbnailFiles((currentFiles) => {
        const nextFiles = [...currentFiles];
        nextFiles[index] = file;
        return nextFiles;
      });
    }}
    className="block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
  />

  {videoLinkThumbnailFiles[index] && (
    <p className="mt-2 text-xs text-stone-600">
      Selected: {videoLinkThumbnailFiles[index]?.name}
    </p>
  )}

  {form.videoLinkThumbnailUrls?.[index] && (
    <img
      src={form.videoLinkThumbnailUrls[index]}
      alt={`Video link ${index + 1} preview`}
      className="mt-3 aspect-video w-full rounded-xl object-cover"
    />
  )}
</div>

        <button
  type="button"
  onClick={() => {
    setForm((prev: any) => ({
      ...prev,
      videoLinkUrls: (prev.videoLinkUrls ?? []).filter(
        (_: string, i: number) => i !== index
      ),
      videoLinkNotes: (prev.videoLinkNotes ?? []).filter(
        (_: string, i: number) => i !== index
      ),
      videoLinkThumbnailUrls: (
        prev.videoLinkThumbnailUrls ?? []
      ).filter(
        (_: string, i: number) => i !== index
      ),
    }));

    setVideoLinkThumbnailFiles((currentFiles) =>
      currentFiles.filter((_, i) => i !== index)
    );
  }}
  className="mt-3 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
>
  Remove Link
</button>
      </div>
    ))}

    <button
  type="button"
  onClick={() => {
    setForm((prev: any) => ({
      ...prev,
      videoLinkUrls: [...(prev.videoLinkUrls ?? []), ""],
      videoLinkNotes: [...(prev.videoLinkNotes ?? []), ""],
      videoLinkThumbnailUrls: [
        ...(prev.videoLinkThumbnailUrls ?? []),
        "",
      ],
    }));

    setVideoLinkThumbnailFiles((currentFiles) => [
      ...currentFiles,
      null,
    ]);
  }}
  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
>
  + Add Video Link
</button>
  </div>
</div>  
    </section>
  );
}