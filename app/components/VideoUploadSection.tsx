"use client";

import { useEffect, useMemo } from "react";

type VideoUploadSectionProps = {
  isPublished: boolean;
  videoFiles: File[];
  setVideoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  selectedVideoNotes: string[];
  setSelectedVideoNotes: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  handleVideoChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  newVideoLinkUrl: string;
  setNewVideoLinkUrl: (value: string) => void;
  newVideoLinkNote: string;
  setNewVideoLinkNote: (value: string) => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  existingVideosLength: number;
  paidExtraVideos: number;
  handleBuyExtraVideos: (quantity: number) => void;
  videoError: string;
  existingVideoDurations: number[];
  selectedVideoDurations: number[];
  setSelectedVideoDurations: React.Dispatch<
    React.SetStateAction<number[]>
  >;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes = kilobytes / 1024;

  if (megabytes < 1024) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const gigabytes = megabytes / 1024;

  return `${gigabytes.toFixed(2)} GB`;
}

function formatDuration(seconds: number | undefined) {
  if (
    seconds === undefined ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "Duration being checked";
  }

  const wholeSeconds = Math.round(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export default function VideoUploadSection({
  isPublished,
  videoFiles,
  setVideoFiles,
  selectedVideoNotes,
  setSelectedVideoNotes,
  handleVideoChange,
  newVideoLinkUrl,
  setNewVideoLinkUrl,
  newVideoLinkNote,
  setNewVideoLinkNote,
  form,
  setForm,
  existingVideosLength,
  paidExtraVideos,
  handleBuyExtraVideos,
  videoError,
  existingVideoDurations,
  selectedVideoDurations,
  setSelectedVideoDurations,
}: VideoUploadSectionProps) {
  const selectedVideoPreviews = useMemo(
    () =>
      videoFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    [videoFiles]
  );

  useEffect(() => {
    return () => {
      selectedVideoPreviews.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [selectedVideoPreviews]);

  const videoLimit =
    (form.plan === "premium"
      ? 60
      : form.plan === "plus"
        ? 30
        : 15) + paidExtraVideos;

  const currentMinutes =
    existingVideoDurations.reduce(
      (sum, seconds) => sum + Number(seconds || 0),
      0
    ) / 60;

  const selectedMinutes =
    selectedVideoDurations.reduce(
      (sum, seconds) => sum + Number(seconds || 0),
      0
    ) / 60;

  const totalMinutes = currentMinutes + selectedMinutes;

  function handleSelectedVideoNoteChange(
    index: number,
    value: string
  ) {
    setSelectedVideoNotes((currentNotes) => {
      const updatedNotes = [...currentNotes];
      updatedNotes[index] = value;
      return updatedNotes;
    });
  }

  function removeSelectedVideo(index: number) {
    setVideoFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index)
    );

    setSelectedVideoNotes((currentNotes) =>
      currentNotes.filter(
        (_, noteIndex) => noteIndex !== index
      )
    );

    setSelectedVideoDurations((currentDurations) =>
      currentDurations.filter(
        (_, durationIndex) => durationIndex !== index
      )
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-stone-900">
        Video Section
      </h2>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-stone-700">
          Option 1 — Upload Videos
        </p>

        <p className="mb-3 text-sm text-stone-600">
          Leave a message, tell a life story, or share memories for
          loved ones and future generations.
        </p>

        <p className="mb-3 text-xs text-stone-500">
          Select your videos, preview them, and add captions before
          clicking Save Changes.{" "}
          {isPublished
            ? "Changes become public when you save."
            : "Saving does not make your changes public."}
        </p>

        <input
          key={videoFiles.length}
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideoChange}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        />

        {selectedVideoPreviews.length > 0 && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div>
              <p className="font-semibold text-green-900">
                Selected Videos
              </p>

              <p className="mt-1 text-sm text-green-800">
                Preview each video and enter its caption or memory
                before clicking Save Changes.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {selectedVideoPreviews.map(
                ({ file, previewUrl }, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm"
                  >
                    <video
                      src={previewUrl}
                      controls
                      preload="metadata"
                      playsInline
                      className="aspect-video w-full bg-black object-contain"
                    >
                      Your browser does not support video previews.
                    </video>

                    <div className="space-y-3 p-4">
                      <div>
                        <p
                          className="truncate text-sm font-semibold text-stone-800"
                          title={file.name}
                        >
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-stone-600">
                          File size: {formatFileSize(file.size)}
                        </p>

                        <p className="mt-1 text-xs text-stone-600">
                          Duration:{" "}
                          {formatDuration(
                            selectedVideoDurations[index]
                          )}
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`selected-video-note-${index}`}
                          className="block text-sm font-semibold text-stone-700"
                        >
                          Video caption or memory
                        </label>

                        <textarea
                          id={`selected-video-note-${index}`}
                          rows={3}
                          placeholder="Describe this video or share the memory behind it..."
                          value={selectedVideoNotes[index] ?? ""}
                          onChange={(e) =>
                            handleSelectedVideoNoteChange(
                              index,
                              e.target.value
                            )
                          }
                          className="mt-2 w-full resize-y rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-medium text-green-700">
                          Click Save Changes to upload this video and
                          caption.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedVideo(index)
                          }
                          className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
        <p className="text-sm font-semibold text-stone-700">
          Option 2 — Add Video Links
        </p>

        <p className="mt-1 text-sm text-stone-600">
          Paste links to videos stored on Facebook, Messenger,
          YouTube, Vimeo, OneDrive, Google Drive, or Dropbox.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Video URL"
            value={newVideoLinkUrl}
            onChange={(e) =>
              setNewVideoLinkUrl(e.target.value)
            }
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />

          <input
            type="text"
            placeholder="Description or memory..."
            value={newVideoLinkNote}
            onChange={(e) =>
              setNewVideoLinkNote(e.target.value)
            }
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />

          <button
            type="button"
            onClick={() => {
              const trimmedUrl = newVideoLinkUrl.trim();
              const trimmedNote = newVideoLinkNote.trim();

              if (!trimmedUrl) {
                alert("Please enter a video link.");
                return;
              }

              setForm((prev: any) => ({
                ...prev,
                videoLinkUrls: [
                  ...(prev.videoLinkUrls ?? []),
                  trimmedUrl,
                ],
                videoLinkNotes: [
                  ...(prev.videoLinkNotes ?? []),
                  trimmedNote,
                ],
              }));

              setNewVideoLinkUrl("");
              setNewVideoLinkNote("");
            }}
            className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Add Video Link
          </button>
        </div>

        {(form.videoLinkUrls ?? []).length > 0 && (
          <div className="mt-6 space-y-4">
            {form.videoLinkUrls.map(
              (url: string, index: number) => (
                <div
                  key={`${url}-${index}`}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-800">
                        Linked Video {index + 1}
                      </p>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block break-all text-sm text-blue-600 underline"
                      >
                        {url}
                      </a>

                      {form.videoLinkNotes?.[index] && (
                        <p className="mt-2 text-sm text-stone-600">
                          {form.videoLinkNotes[index]}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev: any) => ({
                          ...prev,
                          videoLinkUrls: (
                            prev.videoLinkUrls ?? []
                          ).filter(
                            (_: string, i: number) =>
                              i !== index
                          ),
                          videoLinkNotes: (
                            prev.videoLinkNotes ?? []
                          ).filter(
                            (_: string, i: number) =>
                              i !== index
                          ),
                        }));
                      }}
                      className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {videoError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-sm text-red-700">
            {videoError}
          </p>
        </div>
      )}

      <div
        className={`mt-4 text-sm ${
          totalMinutes > videoLimit
            ? "text-red-600"
            : "text-stone-600"
        }`}
      >
        Video Memories: {currentMinutes.toFixed(1)} minutes
        {selectedMinutes > 0 &&
          ` + ${selectedMinutes.toFixed(
            1
          )} minutes selected`}
        {" = "}
        {totalMinutes.toFixed(1)} / {videoLimit} minutes
      </div>

      {existingVideosLength > 0 && (
        <p className="mt-1 text-xs text-stone-500">
          This memorial currently has {existingVideosLength} uploaded
          video{existingVideosLength === 1 ? "" : "s"}.
        </p>
      )}

      {paidExtraVideos > 0 && (
        <p className="mt-1 text-sm text-green-700">
          You have purchased {paidExtraVideos} extra Video Memory
          minute{paidExtraVideos === 1 ? "" : "s"}.
        </p>
      )}

      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-stone-900">
          Need more Video Memory time?
        </p>

        <p className="mt-1 text-sm text-stone-700">
          Purchase an additional 10 minutes for $9.95.
        </p>

        <button
          type="button"
          onClick={() => handleBuyExtraVideos(1)}
          className="mt-3 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700"
        >
          Purchase 10 More Minutes
        </button>
      </div>

      <p className="mt-2 text-sm text-stone-500">
        MP4 recommended. Basic includes 15 minutes of Video
        Memories, Plus includes 30 minutes, and Premium includes 60
        minutes. Each individual video may be up to 5 minutes long.
      </p>
    </div>
  );
}