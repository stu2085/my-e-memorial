"use client";

import MuxPlayer from "@mux/mux-player-react";

type ExistingVideoListProps = {
  existingVideos: string[];
  videoNotes: string[];
  previewVideoId: string | null;
  onPreviewVideo: (videoId: string) => void;
  onVideoNoteChange: (index: number, note: string) => void;
  onMoveVideo: (index: number, direction: "up" | "down") => void;
  onRemoveVideo: (videoId: string) => void;
};

export default function ExistingVideoList({
  existingVideos,
  videoNotes,
  previewVideoId,
  onPreviewVideo,
  onVideoNoteChange,
  onMoveVideo,
  onRemoveVideo,
}: ExistingVideoListProps) {
  if (existingVideos.length === 0) return null;

  const visibleVideos = existingVideos
    .filter(Boolean)
    .filter((videoId) => videoId.length > 15);

  if (visibleVideos.length === 0) return null;

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {visibleVideos.map((videoId, index) => (
        <div
          key={`${videoId}-${index}`}
          className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-800">
              Video {index + 1}
            </p>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onMoveVideo(index, "up")}
                disabled={index === 0}
                className="rounded-full border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↑ Up
              </button>

              <button
                type="button"
                onClick={() => onMoveVideo(index, "down")}
                disabled={index === visibleVideos.length - 1}
                className="rounded-full border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↓ Down
              </button>

              <button
  type="button"
  onClick={() => {
    
    onRemoveVideo(videoId);
  }}
  className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
>
  Delete Video
</button>
            </div>
          </div>

          {previewVideoId === videoId ? (
            <MuxPlayer
              playbackId={videoId}
              streamType="on-demand"
              className="aspect-video w-full rounded-xl bg-black"
            />
          ) : (
            <button
              type="button"
              onClick={() => onPreviewVideo(videoId)}
              className="w-full overflow-hidden rounded-xl border border-stone-300 text-left"
            >
              <img
                src={`https://image.mux.com/${videoId}/thumbnail.jpg?time=1`}
                alt={`Video ${index + 1}`}
                className="aspect-video w-full object-cover"
              />

              <div className="bg-stone-100 px-4 py-3 text-center text-sm font-semibold text-stone-700 hover:bg-stone-200">
                ▶ Click to Preview Video
              </div>
            </button>
          )}

          <input
            type="text"
            placeholder="Video caption or memory..."
            value={videoNotes[index] || ""}
            onChange={(e) => onVideoNoteChange(index, e.target.value)}
            className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />

          <p className="mt-2 text-xs text-stone-500">
            Preview only loads when clicked to keep this edit page fast.
          </p>
        </div>
      ))}
    </div>
  );
}