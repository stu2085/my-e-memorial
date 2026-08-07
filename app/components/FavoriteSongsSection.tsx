import Link from "next/link";
import QuickSaveButton from "./QuickSaveButton";

type FavoriteSongsSectionProps = {
  firstName: string;
  nickname?: string;
  favoriteSongUrl?: string;
  favoriteSongUrls?: string[];
  favoriteSongNotes?: string[];

  favoriteSongFiles?: File[];
  selectedFavoriteSongNotes?: string[];

  isSaving?: boolean;
  isPublished?: boolean;
  isPaid?: boolean;

  handleChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;

  setForm: React.Dispatch<React.SetStateAction<any>>;
  setFavoriteSongFiles?: React.Dispatch<React.SetStateAction<File[]>>;
setSelectedFavoriteSongNotes?: React.Dispatch<
  React.SetStateAction<string[]>
>;
setFavoriteSongUrls?: React.Dispatch<React.SetStateAction<string[]>>;
setFavoriteSongNotes?: React.Dispatch<React.SetStateAction<string[]>>;
};
function getYouTubeEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }

    if (
      parsedUrl.hostname.includes("youtube.com") ||
      parsedUrl.hostname.includes("www.youtube.com")
    ) {
      const videoId = parsedUrl.searchParams.get("v");

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}
export default function FavoriteSongsSection({
  firstName,
  nickname,
  favoriteSongUrl,
  favoriteSongUrls,
  favoriteSongNotes,
  favoriteSongFiles = [],
  selectedFavoriteSongNotes = [],
  isSaving,
  isPublished,
  isPaid = true,
  handleChange,
  setForm,
  setFavoriteSongFiles,
setSelectedFavoriteSongNotes,
setFavoriteSongUrls,
setFavoriteSongNotes,
}: FavoriteSongsSectionProps) {
  const songsToShow =
    favoriteSongUrls && favoriteSongUrls.length > 0
      ? favoriteSongUrls
      : favoriteSongUrl
        ? [favoriteSongUrl]
        : [];
        const selectedSongs = favoriteSongFiles;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-stone-900">
          {nickname?.trim()
  ? `${nickname.trim()}'s Favorite Songs`
  : firstName
    ? `${firstName}'s Favorite Songs`
    : "Favorite Songs"}
        </h2>

        <p className="mt-1 text-sm text-stone-600">
          Add up to 5 favorite songs and a short note about each one. Tip:
          Record a song on your phone using QuickVoice or a similar app and
          upload that file.
        </p>
      </div>

      <div className="space-y-4">
  <div>
    <label className="mb-2 block text-sm font-medium text-stone-700">
      Favorite Song URLs
    </label>

    <p className="mb-3 text-xs text-stone-500">
      Add up to 5 song links. YouTube links can be played directly below.
    </p>

    <div className="space-y-3">
      {Array.from({
        length: Math.min(
          5,
          Math.max(1, songsToShow.length + 1)
        ),
      }).map((_, index) => {
        const value =
          index === 0
            ? favoriteSongUrl ?? favoriteSongUrls?.[0] ?? ""
            : favoriteSongUrls?.[index] ?? "";

        return (
          <div key={index}>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Song {index + 1} URL
            </label>

            <input
              type="url"
              value={value}
              placeholder="https://..."
              onChange={(e) => {
                const nextValue = e.target.value;

                const updatedSongUrls = [
                  ...(favoriteSongUrls ?? []),
                ];

                while (updatedSongUrls.length <= index) {
                  updatedSongUrls.push("");
                }

                updatedSongUrls[index] = nextValue;

                const cleanedSongUrls =
                  updatedSongUrls
                    .slice(0, 5)
                    .filter(
                      (url, urlIndex) =>
                        url.trim() || urlIndex <= index
                    );

                setFavoriteSongUrls?.(
                  cleanedSongUrls
                );

                setForm((prev: any) => ({
                  ...prev,
                  favoriteSongUrl:
                    index === 0
                      ? nextValue
                      : prev.favoriteSongUrl,
                  favoriteSongUrls:
                    cleanedSongUrls,
                }));
              }}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            />
          </div>
        );
      })}
    </div>
  </div>

  {songsToShow.length > 0 && (
    <div className="space-y-3">
      {songsToShow.map((song, index) => {
        if (!song.trim()) {
          return null;
        }

        const youtubeEmbedUrl =
          getYouTubeEmbedUrl(song);

        return (
          <div
            key={`${song}-${index}`}
            className="rounded-xl border border-stone-200 bg-white p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                Song {index + 1}
              </p>

              <button
                type="button"
                onClick={() => {
                  const updatedSongUrls =
                    songsToShow.filter(
                      (_, i) => i !== index
                    );

                  const updatedSongNotes = [
                    ...(favoriteSongNotes ?? []),
                  ].filter((_, i) => i !== index);

                  setFavoriteSongUrls?.(
                    updatedSongUrls
                  );

                  setFavoriteSongNotes?.(
                    updatedSongNotes
                  );

                  setForm((prev: any) => ({
                    ...prev,
                    favoriteSongUrl:
                      updatedSongUrls[0] ?? "",
                    favoriteSongUrls:
                      updatedSongUrls,
                    favoriteSongNotes:
                      updatedSongNotes,
                  }));
                }}
                className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
              >
                Delete Song
              </button>
            </div>

            {youtubeEmbedUrl ? (
              <div className="overflow-hidden rounded-xl">
                <iframe
                  src={youtubeEmbedUrl}
                  title={`Song ${index + 1}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <audio
                controls
                className="w-full"
                src={song}
              />
            )}

            <p className="mt-3 text-sm font-semibold text-stone-700">
              Song Note
            </p>

            <textarea
              value={
                favoriteSongNotes?.[index] ?? ""
              }
              onChange={(e) => {
                const noteValue =
                  e.target.value;

                setFavoriteSongNotes?.(
                  (prev) => {
                    const nextNotes = [
                      ...prev,
                    ];

                    nextNotes[index] =
                      noteValue;

                    setForm(
                      (previousForm: any) => ({
                        ...previousForm,
                        favoriteSongNotes:
                          nextNotes,
                      })
                    );

                    return nextNotes;
                  }
                );
              }}
              rows={2}
              placeholder="What was special about this song?"
              className="mt-2 block w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-stone-900"
            />
          </div>
        );
      })}
    </div>
  )}

  <div>
    <label className="mb-2 block text-sm font-medium text-stone-700">
      Upload Music File
    </label>

    <p className="mb-2 text-xs text-stone-500">
      Upload MP3, M4A, AAC, or WAV audio files. Most phone recordings are supported.
    </p>

    {!isPaid && (
      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Complete payment to unlock music-file uploads.
      </div>
    )}
{selectedSongs.length > 0 && (
  <div className="mb-4 space-y-3">
    <h3 className="text-sm font-semibold text-stone-700">
      Selected Songs (not yet uploaded)
    </h3>

    {selectedSongs.map((file, index) => (
      <div
        key={`${file.name}-${index}`}
        className="rounded-xl border border-blue-200 bg-blue-50 p-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-stone-900">{file.name}</p>

            <p className="text-xs text-stone-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFavoriteSongFiles?.((prev) =>
                prev.filter((_, i) => i !== index)
              );

              setSelectedFavoriteSongNotes?.((prev) =>
                prev.filter((_, i) => i !== index)
              );
            }}
            className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>

        <audio
          controls
          className="mt-3 w-full"
          src={URL.createObjectURL(file)}
        />

        <textarea
          rows={2}
          placeholder="What made this song special?"
          value={selectedFavoriteSongNotes[index] ?? ""}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedFavoriteSongNotes?.((prev) => {
              const notes = [...prev];
              notes[index] = value;
              return notes;
            });
          }}
          className="mt-3 w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm text-stone-900"
        />
      </div>
    ))}
  </div>
)}


          <input
            type="file"
            accept=".mp3,.m4a,.aac,.wav,audio/*"
            multiple
            disabled={!isPaid}
            onChange={(e) => {
              if (!isPaid) {
                e.target.value = "";
                return;
              }

              const existingCount = songsToShow.length;
const availableSlots = Math.max(0, 5 - existingCount);

const files = Array.from(e.target.files || []).slice(0, availableSlots);

setFavoriteSongFiles?.(files);
setSelectedFavoriteSongNotes?.(
  new Array(files.length).fill("")
);
            }}
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
              isPaid
                ? "border-stone-300 bg-white text-stone-900 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-70"
            }`}
          />

          <p className="mt-2 text-xs text-stone-500">
            <Link
              href="/how-to-add-music"
              target="_blank"
              className="font-semibold text-stone-700 underline hover:text-stone-900"
            >
              Need help recording music from your phone?
            </Link>
          </p>
        </div>
      </div>

      {typeof isSaving === "boolean" &&
        typeof isPublished === "boolean" && (
          <QuickSaveButton
  sectionId="favorite-songs"
  isSaving={isSaving}
  isPublished={isPublished}
/>
        )}
    </section>
  );
}