type VideoUploadSectionProps = {
  isPublished: boolean;
  videoFiles: File[];
  handleVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
};

export default function VideoUploadSection({
  isPublished,
  videoFiles,
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
}: VideoUploadSectionProps) {
  const videoLimit =
    (form.plan === "premium" ? 60 : form.plan === "plus" ? 30 : 15) +
    paidExtraVideos;

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

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        Option 1 — Upload Videos
      </label>

      <p className="mb-3 text-sm text-stone-600">
        Leave a message, tell a life story, or share memories for loved ones and future generations.
      </p>

      <p className="mt-2 text-xs text-stone-500">
        After selecting a video, click "Save Changes" to upload it.{" "}
        {isPublished
          ? "Changes become public when you save."
          : "Saving does not make your changes public."}
      </p>

      <input
        key={videoFiles.length}
        type="file"
        accept="video/*"
        multiple
        disabled={false}
        onChange={handleVideoChange}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      />

      {videoFiles.length > 0 && (
        <p className="mt-2 text-sm font-medium text-green-700">
          {videoFiles.length} video{videoFiles.length === 1 ? "" : "s"} selected and ready to upload.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
        <p className="text-sm font-semibold text-stone-700">
          Option 2 — Add Video Links
        </p>

        <p className="mt-1 text-sm text-stone-600">
          Paste links to videos stored on Facebook, Messenger, YouTube, Vimeo, OneDrive, Google Drive, or Dropbox.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Video URL"
            value={newVideoLinkUrl}
            onChange={(e) => setNewVideoLinkUrl(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
          />

          <input
            type="text"
            placeholder="Description or memory..."
            value={newVideoLinkNote}
            onChange={(e) => setNewVideoLinkNote(e.target.value)}
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
                videoLinkUrls: [...prev.videoLinkUrls, trimmedUrl],
                videoLinkNotes: [...prev.videoLinkNotes, trimmedNote],
              }));

              setNewVideoLinkUrl("");
              setNewVideoLinkNote("");
            }}
            className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Add Video Link
          </button>
        </div>

        {form.videoLinkUrls.length > 0 && (
          <div className="mt-6 space-y-4">
            {form.videoLinkUrls.map((url: string, index: number) => (
              <div
                key={index}
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

                    {form.videoLinkNotes[index] && (
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
                        videoLinkUrls: prev.videoLinkUrls.filter(
                          (_: string, i: number) => i !== index
                        ),
                        videoLinkNotes: prev.videoLinkNotes.filter(
                          (_: string, i: number) => i !== index
                        ),
                      }));
                    }}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {videoError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-sm text-red-700">{videoError}</p>
        </div>
      )}

      <div
        className={`mt-2 text-sm ${
          totalMinutes > videoLimit ? "text-red-600" : "text-stone-600"
        }`}
      >
        Video Memories: {currentMinutes.toFixed(1)} minutes
        {selectedMinutes > 0 && ` + ${selectedMinutes.toFixed(1)} minutes selected`}
        {" = "}
        {totalMinutes.toFixed(1)} / {videoLimit} minutes
      </div>

      {paidExtraVideos > 0 && (
        <p className="mt-1 text-sm text-green-700">
          You have purchased {paidExtraVideos} extra Video Memory minute
          {paidExtraVideos === 1 ? "" : "s"}.
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

      <p className="mt-1 text-sm text-stone-500">
        MP4 recommended. Basic includes 15 minutes of Video Memories, Plus includes 30 minutes, and Premium includes 60 minutes. Each individual video may be up to 5 minutes long.
      </p>
    </div>
  );
}