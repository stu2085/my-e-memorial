"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MuxPlayer, {
  type MuxPlayerRefAttributes,
} from "@mux/mux-player-react";

type Presentation = {
  publicId: string;
  personName: string;
  birthDate: string | null;
  deathDate: string | null;
  featuredPhotoUrl?: string | null;
  theme: string;
  status: string;
  paymentStatus: string;
};

type PresentationItem = {
  id: number;
  item_type: "photo" | "video";
  photo_url: string | null;
  mux_playback_id: string | null;
  caption: string;
  attribution: string;
  source: "creator" | "contributor";
  approval_status:
    | "pending"
    | "approved"
    | "rejected";
  sort_order: number;
  duration_seconds?: number | null;
};

type PresentationMusic = {
  id: number;
  source_type:
    | "uploaded"
    | "youtube"
    | "library";
  source_url: string;
  title?: string | null;
  artist?: string | null;
  sort_order: number;
};

type PresentationResponse = {
  success: boolean;
  presentation: Presentation;
  items: PresentationItem[];
  music: PresentationMusic[];
  error?: string;
};

type PlayerProps = {
  publicId: string;
};

const PHOTO_SECONDS = 7;
const CLOSING_SCREEN_SECONDS = 8;

function formatDate(date: string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(
    new Date(`${date}T00:00:00`)
  );
}

export default function CelebrationPresentationPlayer({
  publicId,
}: PlayerProps) {
  const playerContainerRef =
    useRef<HTMLDivElement | null>(null);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const videoRef =
    useRef<MuxPlayerRefAttributes | null>(
      null
    );

  const [presentation, setPresentation] =
    useState<Presentation | null>(null);

  const [items, setItems] = useState<
    PresentationItem[]
  >([]);

  const [music, setMusic] = useState<
    PresentationMusic[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [hasStarted, setHasStarted] =
    useState(false);

  const [showClosingScreen, setShowClosingScreen] =
    useState(false);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [musicIndex, setMusicIndex] =
    useState(0);

  const [paused, setPaused] =
    useState(false);

  const [loop, setLoop] =
    useState(true);

  const [volume, setVolume] =
    useState(0.7);

  const [muted, setMuted] =
    useState(false);
  useEffect(() => {
    let cancelled = false;

    async function loadPresentation() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/celebration-presentations/${encodeURIComponent(
            publicId
          )}?view=public`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as
            PresentationResponse;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "The presentation could not be loaded."
          );
        }

        if (cancelled) {
          return;
        }

        setPresentation(
          result.presentation
        );

        setItems(
          Array.isArray(result.items)
            ? result.items
            : []
        );

        setMusic(
          Array.isArray(result.music)
            ? result.music
            : []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The presentation could not be loaded."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (publicId) {
      void loadPresentation();
    }

    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const playableItems = useMemo(
    () =>
      [...items]
        .filter((item) => {
          const isApproved =
            item.source === "creator" ||
            item.approval_status ===
              "approved";

          const hasMedia =
            item.item_type === "photo"
              ? Boolean(item.photo_url)
              : Boolean(
                  item.mux_playback_id
                );

          return isApproved && hasMedia;
        })
        .sort(
          (a, b) =>
            a.sort_order -
              b.sort_order ||
            a.id - b.id
        ),
    [items]
  );

  const playableMusic = useMemo(
    () =>
      [...music]
        .filter(
          (track) =>
            track.source_type !==
              "youtube" &&
            Boolean(track.source_url)
        )
        .sort(
          (a, b) =>
            a.sort_order -
              b.sort_order ||
            a.id - b.id
        ),
    [music]
  );

  const currentItem =
    playableItems[currentIndex] || null;

  const currentMusic =
    playableMusic[musicIndex] || null;

  const advancePresentation =
    useCallback(() => {
      if (
        currentIndex <
        playableItems.length - 1
      ) {
        setCurrentIndex(
          (previous) => previous + 1
        );
        return;
      }

      setPaused(false);
      setShowClosingScreen(true);
    }, [
      currentIndex,
      playableItems.length,
    ]);

  useEffect(() => {
    if (!showClosingScreen || !loop || paused) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentIndex(0);
      setPaused(false);
      setShowClosingScreen(false);
    }, CLOSING_SCREEN_SECONDS * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loop, paused, showClosingScreen]);

  useEffect(() => {
    if (
      !hasStarted ||
      showClosingScreen ||
      paused ||
      currentItem?.item_type !==
        "photo"
    ) {
      return;
    }

    const timer = window.setTimeout(
      advancePresentation,
      PHOTO_SECONDS * 1000
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    advancePresentation,
    currentItem,
    hasStarted,
    paused,
    showClosingScreen,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const shouldPlay =
      hasStarted &&
      !paused &&
      ((showClosingScreen && loop) ||
        (!showClosingScreen &&
          currentItem?.item_type ===
            "photo")) &&
      Boolean(currentMusic);

    if (shouldPlay) {
      void audio.play().catch(() => {
        // The Begin Presentation button
        // normally grants audio permission.
      });
    } else {
      audio.pause();
    }
  }, [
    currentItem,
    currentMusic,
    hasStarted,
    loop,
    paused,
    showClosingScreen,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume * 0.35;
      audio.muted = muted;
    }

    const video = videoRef.current;

    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [
    currentItem,
    currentMusic,
    muted,
    volume,
  ]);

  function beginPresentation() {
    setCurrentIndex(0);
    setMusicIndex(0);
    setPaused(false);
    setShowClosingScreen(false);
    setHasStarted(true);
  }

  function togglePause() {
    const nextPaused = !paused;

    setPaused(nextPaused);

    if (
      currentItem?.item_type ===
        "video"
    ) {
      if (nextPaused) {
        videoRef.current?.pause();
      } else {
        void videoRef.current
          ?.play()
          .catch(() => undefined);
      }
    }
  }

  function restartPresentation() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    setCurrentIndex(0);
    setMusicIndex(0);
    setPaused(false);
    setShowClosingScreen(false);
    setHasStarted(false);
  }

  async function enterFullScreen() {
    try {
      await playerContainerRef.current
        ?.requestFullscreen();
    } catch {
      setErrorMessage(
        "Full screen could not be opened in this browser."
      );
    }
  }

  function advanceMusic() {
    if (playableMusic.length <= 1) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;

        if (
          hasStarted &&
          !paused &&
          currentItem?.item_type ===
            "photo"
        ) {
          void audioRef.current
            .play()
            .catch(() => undefined);
        }
      }

      return;
    }

    setMusicIndex(
      (previous) =>
        (previous + 1) %
        playableMusic.length
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-white">
        <p className="text-xl font-semibold">
          Preparing the presentation...
        </p>
      </main>
    );
  }

  if (
    errorMessage &&
    !presentation
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6">
        <div className="max-w-xl rounded-2xl border border-red-300 bg-white p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-red-800">
            Presentation unavailable
          </h1>

          <p className="mt-4 text-base text-stone-700">
            {errorMessage}
          </p>
        </div>
      </main>
    );
  }

  if (!presentation) {
    return null;
  }

  const birthDate = formatDate(
    presentation.birthDate
  );

  const deathDate = formatDate(
    presentation.deathDate
  );

  const dates = [
    birthDate,
    deathDate,
  ]
    .filter(Boolean)
    .join(" — ");

  const years = [
    presentation.birthDate
      ? String(presentation.birthDate).slice(0, 4)
      : "",
    presentation.deathDate
      ? String(presentation.deathDate).slice(0, 4)
      : "",
  ]
    .filter(Boolean)
    .join(" – ");

  const sampleNameSuffix =
    " (Sample Presentation)";

  const isSamplePresentation =
    presentation.personName.endsWith(
      sampleNameSuffix
    );

  const displayPersonName =
    isSamplePresentation
      ? presentation.personName.slice(
          0,
          -sampleNameSuffix.length
        )
      : presentation.personName;

  return (
    <main
      ref={playerContainerRef}
      className="relative flex min-h-screen overflow-hidden bg-black text-white"
    >
      {currentMusic && (
        <audio
          ref={audioRef}
          key={currentMusic.id}
          src={currentMusic.source_url}
          preload="auto"
          onEnded={advanceMusic}
          onCanPlay={() => {
            if (
              hasStarted &&
              !paused &&
              ((showClosingScreen &&
                loop) ||
                (!showClosingScreen &&
                  currentItem?.item_type ===
                    "photo"))
            ) {
              void audioRef.current
                ?.play()
                .catch(
                  () => undefined
                );
            }
          }}
        />
      )}

      {!hasStarted ? (
        <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 py-12 text-center">
          {presentation.featuredPhotoUrl && (
            <>
              <img
                src={presentation.featuredPhotoUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-[0.22]"
              />
              <div className="absolute inset-0 bg-slate-950/60" />
            </>
          )}

          <div className="relative z-10 mx-auto max-w-4xl">
            <p className="font-serif text-xl tracking-[0.22em] text-amber-200 uppercase sm:text-2xl">
              Celebration of Life
            </p>

            {presentation.featuredPhotoUrl && (
              <div className="mx-auto mt-7 h-60 w-48 overflow-hidden rounded-2xl border-2 border-amber-200/80 bg-slate-900 shadow-2xl sm:h-80 sm:w-64">
                <img
                  src={presentation.featuredPhotoUrl}
                  alt={displayPersonName}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-6xl">
              {displayPersonName}
            </h1>

            {isSamplePresentation && (
              <p className="mt-2 text-lg font-semibold tracking-wide text-amber-100 sm:text-xl">
                Sample Presentation
              </p>
            )}

            {dates && (
              <p className="mt-4 text-xl text-stone-200 sm:text-2xl">
                {dates}
              </p>
            )}

            {playableItems.length > 0 ? (
              <button
                type="button"
                onClick={beginPresentation}
                className="mt-10 rounded-full bg-amber-500 px-8 py-4 text-lg font-bold text-stone-950 shadow-xl transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200"
              >
                Begin Presentation
              </button>
            ) : (
              <p className="mt-10 rounded-xl border border-amber-200/40 bg-black/40 px-6 py-4 text-lg">
                Add at least one photo or video before starting the presentation.
              </p>
            )}
          </div>
        </section>
      ) : showClosingScreen ? (
        <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 py-12 text-center">
          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <p className="font-serif text-2xl tracking-[0.2em] text-amber-200 uppercase sm:text-4xl">
              In Loving Memory
            </p>

            <h1 className="mt-14 font-serif text-4xl font-semibold leading-tight text-white sm:text-6xl">
              {displayPersonName}
            </h1>

            {years && (
              <p className="mt-6 font-serif text-2xl text-amber-200 sm:text-4xl">
                {years}
              </p>
            )}

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={togglePause}
                className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                {paused ? "Resume" : "Pause"}
              </button>

              <button
                type="button"
                onClick={restartPresentation}
                className="rounded-full bg-amber-500 px-8 py-3 text-base font-bold text-stone-950 shadow-xl transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200"
              >
                Replay Presentation
              </button>
            </div>

            {loop && (
              <p className="mt-4 text-base text-stone-400">
                {paused
                  ? "Presentation paused."
                  : "Loop is on. The presentation will restart automatically."}
              </p>
            )}
          </div>

          <p className="absolute inset-x-0 bottom-6 px-4 text-center text-sm text-stone-400 sm:text-base">
            Celebration of Life Presentation by MyEMemorial.
          </p>
        </section>
      ) : (
        <>
          <section className="absolute inset-0 flex items-center justify-center">
            {currentItem?.item_type ===
              "photo" &&
              currentItem.photo_url && (
                <>
                  <img
                    src={
                      currentItem.photo_url
                    }
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-25 blur-2xl"
                  />

                  <div className="absolute inset-0 bg-black/55" />

                  <img
                    key={currentItem.id}
                    src={
                      currentItem.photo_url
                    }
                    alt={
                      currentItem.caption ||
                      presentation.personName
                    }
                    className="relative z-10 max-h-screen max-w-full object-contain"
                  />
                </>
              )}

            {currentItem?.item_type ===
              "video" &&
              currentItem.mux_playback_id && (
                <MuxPlayer
                  ref={videoRef}
                  key={currentItem.id}
                  playbackId={
                    currentItem.mux_playback_id
                  }
                  streamType="on-demand"
                  autoPlay
                  playsInline
                  metadata={{
                    video_title:
                      currentItem.caption ||
                      `Celebration of Life for ${presentation.personName}`,
                  }}
                  className="h-full w-full"
                  onPlay={() => {
                    audioRef.current?.pause();
                  }}
                  onEnded={
                    advancePresentation
                  }
                />
              )}

            {currentItem?.caption && (
              <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 bg-gradient-to-t from-black/90 to-transparent px-6 pb-8 pt-16 text-center">
                <p className="mx-auto max-w-5xl font-serif text-xl text-white drop-shadow-lg sm:text-3xl">
                  {currentItem.caption}
                </p>

                {currentItem.attribution && (
                  <p className="mt-2 text-base text-stone-200 sm:text-lg">
                    {
                      currentItem.attribution
                    }
                  </p>
                )}
              </div>
            )}
          </section>

          <div className="absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-3 bg-black/75 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={togglePause}
              className="rounded-full border border-white/40 px-5 py-2 text-base font-semibold hover:bg-white/15"
            >
              {paused
                ? "Resume"
                : "Pause"}
            </button>

            <button
              type="button"
              onClick={
                restartPresentation
              }
              className="rounded-full border border-white/40 px-5 py-2 text-base font-semibold hover:bg-white/15"
            >
              Restart
            </button>

            <button
              type="button"
              onClick={() => {
                setLoop(
                  (previous) =>
                    !previous
                );
              }}
              className="rounded-full border border-white/40 px-5 py-2 text-base font-semibold hover:bg-white/15"
            >
              Loop: {loop ? "On" : "Off"}
            </button>

            <div className="flex items-center gap-3 rounded-full border border-white/40 px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  setMuted(
                    (previous) =>
                      !previous
                  );
                }}
                className="min-w-14 text-base font-semibold hover:text-amber-300"
                aria-label={
                  muted
                    ? "Unmute presentation"
                    : "Mute presentation"
                }
              >
                {muted ? "Unmute" : "Mute"}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => {
                  const nextVolume =
                    Number(
                      event.target.value
                    );

                  setVolume(nextVolume);

                  if (nextVolume > 0) {
                    setMuted(false);
                  }
                }}
                aria-label="Presentation volume"
                className="w-24 accent-amber-400"
              />

              <span className="min-w-10 text-right text-sm text-stone-200">
                {muted
                  ? "0%"
                  : `${Math.round(
                      volume * 100
                    )}%`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                void enterFullScreen();
              }}
              className="rounded-full border border-white/40 px-5 py-2 text-base font-semibold hover:bg-white/15"
            >
              Full Screen
            </button>

            <p className="w-full text-center text-sm text-stone-300 sm:w-auto">
              {currentIndex + 1} of{" "}
              {playableItems.length}
            </p>
          </div>
        </>
      )}

      {errorMessage &&
        presentation && (
          <p className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-lg bg-red-700 px-4 py-2 text-center text-base text-white shadow-lg">
            {errorMessage}
          </p>
        )}
    </main>
  );
}
