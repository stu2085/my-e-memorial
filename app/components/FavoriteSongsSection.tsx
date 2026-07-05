import Link from "next/link";
import QuickSaveButton from "./QuickSaveButton";

type FavoriteSongsSectionProps = {
  firstName: string;
  favoriteSongUrl: string;
  favoriteSongUrls: string[];
  favoriteSongNotes: string[];
  isSaving: boolean;
  isPublished: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setFavoriteSongFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

export default function FavoriteSongsSection({
  firstName,
  favoriteSongUrl,
  favoriteSongUrls,
  favoriteSongNotes,
  isSaving,
  isPublished,
  handleChange,
  setForm,
  setFavoriteSongFiles,
}: FavoriteSongsSectionProps) {
  const songsToShow =
    favoriteSongUrls?.length > 0
      ? favoriteSongUrls
      : favoriteSongUrl
        ? [favoriteSongUrl]
        : [];

  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-stone-900">
          {firstName ? `${firstName}'s Favorite Songs` : "Favorite Songs"}
        </h2>

        <p className="mt-1 text-sm text-stone-600">
          Add up to 5 favorite songs and a short note about each one. Tip:
          Record song on phone using Quickvoice or similar app and upload that
          file.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Favorite Song URL
          </label>

          <input
            name="favoriteSongUrl"
            value={favoriteSongUrl}
            onChange={handleChange}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Upload Music File
          </label>

          <p className="mb-2 text-xs text-stone-500">
            Upload MP3, M4A, AAC, or WAV audio files. Most phone recordings are
            supported.
          </p>

          {songsToShow.length > 0 && (
            <div className="mb-4 space-y-3">
              {songsToShow.map((song, index) => (
                <div
                  key={`${song}-${index}`}
                  className="rounded-xl border border-stone-200 bg-white p-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                      Song {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev: any) => {
                          const currentSongs =
                            prev.favoriteSongUrls?.length > 0
                              ? prev.favoriteSongUrls
                              : prev.favoriteSongUrl
                                ? [prev.favoriteSongUrl]
                                : [];

                          const nextSongs = currentSongs.filter(
                            (_: string, i: number) => i !== index
                          );

                          const nextNotes = (
                            prev.favoriteSongNotes ?? []
                          ).filter((_: string, i: number) => i !== index);

                          return {
                            ...prev,
                            favoriteSongUrl: nextSongs[0] ?? "",
                            favoriteSongUrls: nextSongs,
                            favoriteSongNotes: nextNotes,
                          };
                        });
                      }}
                      className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete Song
                    </button>
                  </div>

                  <audio controls className="w-full">
                    <source src={song} />
                    Your browser does not support the audio element.
                  </audio>

                  <p className="mt-3 text-sm font-semibold text-stone-700">
                    Song Note
                  </p>

                  <textarea
                    value={favoriteSongNotes?.[index] ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      setForm((prev: any) => {
                        const nextNotes = [...(prev.favoriteSongNotes ?? [])];
                        nextNotes[index] = value;

                        return {
                          ...prev,
                          favoriteSongNotes: nextNotes,
                        };
                      });
                    }}
                    rows={2}
                    placeholder="What was special about this song?"
                    className="mt-2 block w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-stone-900"
                  />
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            accept=".mp3,.m4a,.aac,.wav,audio/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(0, 5);
              setFavoriteSongFiles(files);
            }}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
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

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </section>
  );
}