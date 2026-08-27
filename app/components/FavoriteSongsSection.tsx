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
  showFuneralPresentationPreference?: boolean;
  funeralPresentationMusicSource?: "favorite_songs" | "funeral_home";
  funeralPresentationPreferenceReadOnly?: boolean;

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
function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (hostname === "youtu.be") {
      videoId = parsedUrl.pathname.replace(/^\//, "").split("/")[0] ?? "";
    } else if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    ) {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v") ?? "";
      } else if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] ?? "";
      } else if (parsedUrl.pathname.startsWith("/live/")) {
        videoId = parsedUrl.pathname.split("/live/")[1]?.split("/")[0] ?? "";
      } else if (parsedUrl.pathname.startsWith("/embed/")) {
        videoId = parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] ?? "";
      }
    }

    return videoId.trim();
  } catch {
    return "";
  }
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
  showFuneralPresentationPreference = false,
  funeralPresentationMusicSource = "favorite_songs",
  funeralPresentationPreferenceReadOnly = false,
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

        <p className="mt-1 text-base leading-7 text-stone-600">
          Add up to 5 favorite songs and a short note about each one. If you
          don&apos;t have music files to upload, you can record a song on your
          phone using QuickVoice or a similar app, then upload that recording.
        </p>
      </div>

      {showFuneralPresentationPreference && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-lg font-bold text-blue-950">
            Celebration of Life Presentation Music
          </h3>

          <p className="mt-2 text-base leading-7 text-blue-900">
            Your Favorite Songs can be used as background music during your
            Celebration of Life Presentation. You may add up to 5 songs here.
            Memorial videos keep their own audio.
          </p>

          <fieldset
            className="mt-4 space-y-3"
            disabled={funeralPresentationPreferenceReadOnly}
          >
            <legend className="text-base font-bold text-stone-900">
              Use my Favorite Songs during my Celebration of Life Presentation
            </legend>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-white p-4 text-base text-stone-800">
              <input
                type="radio"
                name="funeralPresentationMusicSource"
                value="favorite_songs"
                checked={
                  funeralPresentationMusicSource === "favorite_songs"
                }
                onChange={() => {
                  setForm((prev: any) => ({
                    ...prev,
                    funeralPresentationMusicSource: "favorite_songs",
                  }));
                }}
                className="mt-1 h-5 w-5"
              />
              <span>
                <strong>Yes</strong> — play my selected Favorite Songs.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-white p-4 text-base text-stone-800">
              <input
                type="radio"
                name="funeralPresentationMusicSource"
                value="funeral_home"
                checked={
                  funeralPresentationMusicSource === "funeral_home"
                }
                onChange={() => {
                  setForm((prev: any) => ({
                    ...prev,
                    funeralPresentationMusicSource: "funeral_home",
                  }));
                }}
                className="mt-1 h-5 w-5"
              />
              <span>
                <strong>No</strong> — let the funeral home provide background
                music.
              </span>
            </label>
          </fieldset>

          {funeralPresentationPreferenceReadOnly && (
            <p className="mt-4 text-base leading-7 text-stone-700">
              This music preference was chosen by the memorial owner and cannot
              be changed by a Backup Person.
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
  <div>
    <label className="mb-2 block text-base font-medium text-stone-700">
      Favorite Song URLs
    </label>

    <p className="mb-3 text-base text-stone-500">
      Add up to 5 song links. YouTube songs will join uploaded music in the memorial slideshow playlist.
    </p>

    <div className="space-y-3">
      {Array.from({
        length: Math.min(
          5,
          Math.max(1, songsToShow.length + 1)
        ),
      }).map((_, index) => {
        // All five song positions use the same canonical URL array.
        // favoriteSongUrl remains only as a backward-compatible fallback
        // when an older memorial does not yet have favoriteSongUrls.
        const value = songsToShow[index] ?? "";

        return (
          <div key={index}>
            <label className="mb-1 block text-base font-semibold text-stone-600">
              Song {index + 1} URL
            </label>

            <input
              type="url"
              value={value}
              placeholder="https://..."
              onChange={(e) => {
                const nextValue = e.target.value;

                const applyUpdate = (currentUrls: string[]) => {
                  const updatedSongUrls = [...currentUrls];

                  while (updatedSongUrls.length <= index) {
                    updatedSongUrls.push("");
                  }

                  updatedSongUrls[index] = nextValue;

                  const limitedSongUrls = updatedSongUrls.slice(0, 5);

                  // Remove only unused trailing slots. Interior blanks are
                  // preserved while the owner is actively replacing a song.
                  while (
                    limitedSongUrls.length > 0 &&
                    !limitedSongUrls[limitedSongUrls.length - 1]?.trim()
                  ) {
                    limitedSongUrls.pop();
                  }

                  setForm((prev: any) => ({
                    ...prev,
                    // Keep the old single-song field synchronized solely for
                    // backward compatibility. It is no longer a separate Song 1 state.
                    favoriteSongUrl: limitedSongUrls[0] ?? "",
                    favoriteSongUrls: limitedSongUrls,
                  }));

                  return limitedSongUrls;
                };

                if (setFavoriteSongUrls) {
                  setFavoriteSongUrls((currentUrls) =>
                    applyUpdate(
                      currentUrls.length > 0
                        ? currentUrls
                        : songsToShow
                    )
                  );
                } else {
                  applyUpdate(songsToShow);
                }
              }}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
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

        const youtubeVideoId = getYouTubeVideoId(song);

        return (
          <div
            key={`${song}-${index}`}
            className="rounded-xl border border-stone-200 bg-white p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-base font-semibold uppercase tracking-wide text-stone-600">
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
                className="rounded-full border border-red-300 px-3 py-1 text-base font-semibold text-red-600 hover:bg-red-50"
              >
                Delete Song
              </button>
            </div>

            {youtubeVideoId ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-base font-semibold text-stone-900">
                  YouTube favorite song
                </p>

                <a
                  href={song}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative mt-3 block w-full max-w-[320px] overflow-hidden rounded-xl bg-black shadow-sm"
                  aria-label={`Open YouTube favorite song ${index + 1}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${encodeURIComponent(youtubeVideoId)}/hqdefault.jpg`}
                    alt={`YouTube favorite song ${index + 1} thumbnail`}
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg">
                      ▶
                    </span>
                  </span>
                </a>

                <p className="mt-3 max-w-[320px] text-base leading-6 text-stone-600">
                  This song will play with uploaded music during Experience Their Life.
                </p>
              </div>
            ) : (
              <audio
                controls
                className="w-full"
                src={song}
              />
            )}

            <p className="mt-3 text-base font-semibold text-stone-700">
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
              className="mt-2 block w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-base text-stone-900"
            />
          </div>
        );
      })}
    </div>
  )}

  <div>
    <label className="mb-2 block text-base font-medium text-stone-700">
      Upload Music File
    </label>

    <p className="mb-2 text-base text-stone-500">
      Upload MP3, M4A, AAC, or WAV audio files. Most phone recordings are supported.
    </p>

    {!isPaid && (
      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800">
        Complete payment to unlock music-file uploads.
      </div>
    )}
{selectedSongs.length > 0 && (
  <div className="mb-4 space-y-3">
    <h3 className="text-base font-semibold text-stone-700">
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

            <p className="text-base text-stone-500">
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
            className="rounded border border-red-300 px-3 py-1 text-base font-semibold text-red-600 hover:bg-red-50"
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
          className="mt-3 w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-base text-stone-900"
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
            className={`w-full rounded-xl border px-3 py-2 text-base outline-none transition ${
              isPaid
                ? "border-stone-300 bg-white text-stone-900 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-70"
            }`}
          />

          <p className="mt-2 text-base text-stone-500">
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