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
  introTitle?: string | null;
  introMessage?: string | null;
  introFont?: string | null;
  introColor?: string | null;
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
const OPENING_SCREEN_SECONDS = 5;
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

  const controlsHideTimerRef =
    useRef<number | null>(null);

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

  const [showOpeningScreen, setShowOpeningScreen] =
    useState(false);

  const [showClosingScreen, setShowClosingScreen] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [controlsVisible, setControlsVisible] =
    useState(true);

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

  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);

  const [muted, setMuted] =
    useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active =
        document.fullscreenElement ===
        playerContainerRef.current;

      setIsFullscreen(active);
      setControlsVisible(!active);

      if (controlsHideTimerRef.current !== null) {
        window.clearTimeout(controlsHideTimerRef.current);
        controlsHideTimerRef.current = null;
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      if (controlsHideTimerRef.current !== null) {
        window.clearTimeout(controlsHideTimerRef.current);
      }
    };
  }, []);

  const scheduleControlsHide =
    useCallback(() => {
      setControlsVisible(true);

      if (controlsHideTimerRef.current !== null) {
        window.clearTimeout(controlsHideTimerRef.current);
        controlsHideTimerRef.current = null;
      }

      if (isFullscreen && hasStarted) {
        controlsHideTimerRef.current =
          window.setTimeout(() => {
            setControlsVisible(false);
            controlsHideTimerRef.current = null;
          }, 2500);
      }
    }, [
      hasStarted,
      isFullscreen,
    ]);

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
    if (!hasStarted || !showOpeningScreen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowOpeningScreen(false);
    }, OPENING_SCREEN_SECONDS * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasStarted, showOpeningScreen]);

  useEffect(() => {
    if (!showClosingScreen || !loop || paused) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentIndex(0);
      setPaused(false);
      setShowClosingScreen(false);
      setShowOpeningScreen(true);
    }, CLOSING_SCREEN_SECONDS * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loop, paused, showClosingScreen]);

  useEffect(() => {
    if (
      !hasStarted ||
      showOpeningScreen ||
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
    showOpeningScreen,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const shouldPlay =
      hasStarted &&
      !paused &&
      !showOpeningScreen &&
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
    showOpeningScreen,
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

  const [isIPhone, setIsIPhone] = useState<boolean | null>(null);
  const [playbackCheck, setPlaybackCheck] = useState<{
    publicId: string;
    attempt: number;
    status: "unavailable" | "preparing" | "failed" | "error";
  } | null>(null);
  const [playbackAttempt, setPlaybackAttempt] = useState(0);
  const playbackCheckStatus =
    playbackCheck?.publicId === publicId && playbackCheck.attempt === playbackAttempt
      ? playbackCheck.status
      : "checking";

  useEffect(() => {
    setIsIPhone(/iPhone/i.test(navigator.userAgent));
  }, []);

  const continuousVideoRef = useRef<HTMLVideoElement | null>(null);
  const [continuousPlayback, setContinuousPlayback] = useState<{
    publicId: string;
    url: string;
  } | null>(null);
  const [continuousPlaybackError, setContinuousPlaybackError] = useState(false);
  const [continuousHasPlayed, setContinuousHasPlayed] = useState(false);
  const [continuousIsPlaying, setContinuousIsPlaying] = useState(false);
  const [continuousTime, setContinuousTime] = useState(0);
  const [continuousDuration, setContinuousDuration] = useState(0);
  const [continuousControlsTouchedAt, setContinuousControlsTouchedAt] = useState(0);
  const [continuousControlsVisible, setContinuousControlsVisible] = useState(true);

  useEffect(() => {
    if (!continuousIsPlaying || !continuousControlsVisible) return;

    const timer = window.setTimeout(() => setContinuousControlsVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, [continuousIsPlaying, continuousControlsVisible, continuousControlsTouchedAt]);

  useEffect(() => {
    if (!isIPhone) return;

    const controller = new AbortController();
    let retryTimer: number | undefined;

    async function checkPlayback() {
      try {
        const response = await fetch(
          `/api/celebration-presentations/${encodeURIComponent(publicId)}/offline-video?playback=1`,
          { cache: "no-store", signal: controller.signal }
        );
        const result = await response.json();
        if (controller.signal.aborted) return;

        if (response.ok && result.status === "ready" && typeof result.playbackUrl === "string") {
          setContinuousPlayback({ publicId, url: result.playbackUrl });
          return;
        }

        const status = result.status === "unavailable" ||
          (response.ok && (result.status === "preparing" || result.status === "failed"))
          ? result.status
          : "error";

        setPlaybackCheck({ publicId, attempt: playbackAttempt, status });
        if (status === "preparing") {
          retryTimer = window.setTimeout(() => void checkPlayback(), 30_000);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPlaybackCheck({ publicId, attempt: playbackAttempt, status: "error" });
        }
      }
    }

    void checkPlayback();
    return () => {
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [isIPhone, playbackAttempt, publicId]);

  function beginPresentation() {
    setCurrentIndex(0);
    setMusicIndex(0);
    setPaused(false);
    setShowClosingScreen(false);
    setShowOpeningScreen(true);
    setHasStarted(true);

    if (!document.fullscreenElement) {
      void playerContainerRef.current
        ?.requestFullscreen()
        .catch(() => undefined);
    }
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

  function seekToItem(index: number) {
    setShowClosingScreen(false);
    setPlayingVideoId(null);
    setCurrentIndex(index);
    scheduleControlsHide();
  }

  function restartPresentation() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    setCurrentIndex(0);
    setMusicIndex(0);
    setPaused(false);
    setShowOpeningScreen(false);
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

  if (continuousPlayback?.publicId === publicId && !hasStarted) {
    function formatPlaybackTime(seconds: number) {
      const totalSeconds = Math.max(0, Math.floor(seconds));
      const minutes = Math.floor(totalSeconds / 60);
      return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
    }

    function toggleContinuousPlayback() {
      const video = continuousVideoRef.current;
      if (!video) return;

      if (!video.paused && !video.ended) {
        video.pause();
        return;
      }

      if (video.ended) video.currentTime = 0;
      setContinuousPlaybackError(false);
      void video.play().catch(() => setContinuousPlaybackError(true));
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black px-4 py-8 text-white">
        <h1 className="text-center font-serif text-2xl">
          {presentation.personName}
        </h1>
        <div className="relative w-full max-w-5xl">
        <video
          ref={continuousVideoRef}
          src={continuousPlayback.url}
          loop={loop}
          onClick={() => {
            setContinuousControlsVisible(true);
            setContinuousControlsTouchedAt(Date.now());
          }}
          playsInline
          preload="metadata"
          className="max-h-[65vh] w-full max-w-5xl"
          onDurationChange={(event) => {
            const duration = event.currentTarget.duration;
            setContinuousDuration(Number.isFinite(duration) ? duration : 0);
          }}
          onTimeUpdate={(event) => setContinuousTime(event.currentTarget.currentTime)}
          onPlaying={() => {
            setContinuousHasPlayed(true);
            setContinuousIsPlaying(true);
            setContinuousPlaybackError(false);
          }}
          onPause={() => {
            setContinuousIsPlaying(false);
            setContinuousControlsVisible(true);
          }}
          onEnded={() => setContinuousIsPlaying(false)}
          onError={() => {
            setContinuousIsPlaying(false);
            setContinuousPlaybackError(true);
          }}
        />
          {continuousIsPlaying && !continuousControlsVisible && (
            <button
              type="button"
              aria-label="Show playback controls"
              className="absolute inset-0 z-10 h-full w-full touch-manipulation bg-transparent"
              onClick={() => {
                setContinuousControlsVisible(true);
                setContinuousControlsTouchedAt(Date.now());
              }}
            />
          )}
        </div>
        <div
          className={`flex w-full max-w-5xl flex-wrap items-center gap-3 ${
            continuousIsPlaying && !continuousControlsVisible ? "invisible" : ""
          }`}
          onPointerDown={() => setContinuousControlsTouchedAt(Date.now())}
          onKeyDown={() => setContinuousControlsTouchedAt(Date.now())}
        >
          <button
            type="button"
            onClick={toggleContinuousPlayback}
            className="rounded-full bg-amber-300 px-6 py-3 font-semibold text-black"
          >
            {continuousHasPlayed
              ? (continuousIsPlaying ? "Pause" : "Resume")
              : "Begin Presentation"}
          </button>
          {continuousHasPlayed && (
            <button
              type="button"
              onClick={() => {
                const video = continuousVideoRef.current as
                  | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
                  | null;
                if (!video) return;

                if (typeof video.webkitEnterFullscreen === "function") {
                  const restoreInlineControls = () => {
                    video.controls = false;
                    setContinuousControlsVisible(true);
                    setContinuousControlsTouchedAt(Date.now());
                  };

                  video.addEventListener("webkitendfullscreen", restoreInlineControls, { once: true });
                  video.controls = true;

                  try {
                    video.webkitEnterFullscreen();
                  } catch {
                    video.removeEventListener("webkitendfullscreen", restoreInlineControls);
                    restoreInlineControls();
                  }
                } else if (typeof video.requestFullscreen === "function") {
                  void video.requestFullscreen().catch(() => undefined);
                }
              }}
              className="rounded-full border border-white/40 px-4 py-2 font-semibold text-white"
            >
              Full Screen
            </button>
          )}
          {continuousHasPlayed && (
            <button
              type="button"
              aria-label="Loop presentation"
              aria-pressed={loop}
              onClick={() => setLoop((previous) => !previous)}
              className="rounded-full border border-white/40 px-4 py-2 font-semibold text-white"
            >
              Loop {loop ? "On" : "Off"}
            </button>
          )}
          {continuousHasPlayed && continuousDuration > 0 && (
            <label className="flex min-w-[12rem] flex-1 items-center gap-3">
              <span className="sr-only">Presentation playback position</span>
              <span className="shrink-0 text-sm tabular-nums" aria-hidden="true">
                {formatPlaybackTime(continuousTime)} / {formatPlaybackTime(continuousDuration)}
              </span>
              <input
                type="range"
                min={0}
                max={continuousDuration}
                step={0.1}
                value={Math.min(continuousTime, continuousDuration)}
                aria-valuetext={`${formatPlaybackTime(continuousTime)} of ${formatPlaybackTime(continuousDuration)}`}
                onChange={(event) => {
                  const video = continuousVideoRef.current;
                  if (!video) return;
                  const time = event.currentTarget.valueAsNumber;
                  video.currentTime = time;
                  setContinuousTime(time);
                }}
                className="min-w-0 flex-1 accent-amber-300"
              />
            </label>
          )}
        </div>
        {continuousPlaybackError && (
          <p role="alert">The video could not play. Reopen the viewing link and try again.</p>
        )}
      </main>
    );
  }

  const introTitle = presentation.introTitle || "Celebration of Life";
  const introMessage = presentation.introMessage || "";
  const introColor = presentation.introColor || "#FDE68A";
  const introFontStyle = presentation.introFont === "elegant"
    ? "Georgia, serif"
    : presentation.introFont === "modern"
      ? "Arial, sans-serif"
      : "inherit";

  return (
    <main
      ref={playerContainerRef}
      onMouseMove={scheduleControlsHide}
      onTouchStart={scheduleControlsHide}
      className="relative flex min-h-screen overflow-hidden bg-black text-white"
    >
      {currentMusic && (
        <audio
          ref={audioRef}
          key={currentMusic.id}
          src={currentMusic.source_url}
          preload="auto"
          muted={muted}
          onEnded={advanceMusic}
          onCanPlay={() => {
            if (
              hasStarted &&
              !paused &&
              !showOpeningScreen &&
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
          <div className="relative z-10 mx-auto max-w-4xl">
            <p className="font-serif text-xl tracking-[0.22em] uppercase sm:text-2xl" style={{ color: introColor, fontFamily: introFontStyle }}>
              {introTitle}
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

            {playableItems.length > 0 ? isIPhone !== false ? (
              <div className="mt-10">
                <p role="status" className="text-lg text-stone-200">
                  {playbackCheckStatus === "checking" && "Checking video availability…"}
                  {playbackCheckStatus === "preparing" &&
                    "Preparing your video for online playback. This page checks automatically."}
                  {playbackCheckStatus === "unavailable" && "The online video isn’t ready to play yet."}
                  {playbackCheckStatus === "failed" &&
                    "We couldn’t prepare the online video. Please contact the person who shared it."}
                  {playbackCheckStatus === "error" && "We couldn’t check whether the online video is ready."}
                </p>
                {isIPhone &&
                  (playbackCheckStatus === "unavailable" || playbackCheckStatus === "error") && (
                  <button
                    type="button"
                    onClick={() => setPlaybackAttempt((attempt) => attempt + 1)}
                    className="mt-4 rounded-full bg-amber-500 px-6 py-3 font-bold text-stone-950"
                  >
                    Check again
                  </button>
                )}
              </div>
            ) : (
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
      ) : showOpeningScreen ? (
        <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 py-8 text-center">
          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <p className="text-3xl font-bold tracking-wide uppercase sm:text-6xl" style={{ color: introColor, fontFamily: introFontStyle }}>
              {introTitle}
            </p>

            {presentation.featuredPhotoUrl && (
              <div className="mx-auto mt-7 h-72 w-56 overflow-hidden rounded-2xl border border-amber-200/60 bg-slate-900 shadow-2xl sm:h-[440px] sm:w-[335px]">
                <img
                  src={presentation.featuredPhotoUrl}
                  alt={displayPersonName}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <h1 className="mt-7 text-4xl font-semibold leading-tight text-white sm:text-7xl">
              {displayPersonName}
            </h1>

            {isSamplePresentation ? (
              <p className="mt-5 text-2xl font-semibold text-amber-100 sm:text-4xl">
                Sample Presentation
              </p>
            ) : years ? (
              <p className="mt-5 text-2xl font-medium text-amber-100 sm:text-4xl">
                {years}
              </p>
            ) : null}
            {introMessage && (
              <p className="mx-auto mt-5 max-w-4xl whitespace-pre-line text-xl leading-snug sm:text-3xl" style={{ color: introColor, fontFamily: introFontStyle }}>
                {introMessage}
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
                  autoPlay={!paused}
                  muted={muted}
                  playsInline
                  metadata={{
                    video_title:
                      currentItem.caption ||
                      `Celebration of Life for ${presentation.personName}`,
                  }}
                  className="h-full w-full [--controls:none]"
                  onPlaying={() => {
                    audioRef.current?.pause();
                    setPlayingVideoId(currentItem.id);
                  }}
                  onPause={() => setPlayingVideoId(null)}
                  onEnded={() => {
                    setPlayingVideoId(null);
                    advancePresentation();
                  }}
                />
              )}

            {currentItem?.item_type === "video" &&
              currentItem.mux_playback_id &&
              !paused &&
              playingVideoId !== currentItem.id && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      scheduleControlsHide();
                      void videoRef.current?.play().catch(() => undefined);
                    }}
                    className="pointer-events-auto rounded-full bg-black/80 px-6 py-3 font-semibold text-white ring-1 ring-white/50"
                  >
                    Play Video
                  </button>
                </div>
              )}

            {currentItem?.caption && (
              <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 bg-gradient-to-t from-black/90 to-transparent px-6 pb-8 pt-16 text-center">
                <p className="mx-auto max-w-6xl font-serif text-4xl leading-tight text-white drop-shadow-lg sm:text-6xl">
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

        </>
      )}


      {hasStarted && !showOpeningScreen && (
        <div
            className={`absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-3 bg-black/75 px-4 py-3 backdrop-blur transition-opacity duration-300 ${
              isFullscreen && !controlsVisible
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            }`}
          >
            {playableItems.length > 1 && (
              <label className="flex w-full items-center gap-3 text-sm">
                <span className="shrink-0">Jump to item</span>
                <input
                  type="range"
                  min={0}
                  max={playableItems.length - 1}
                  step={1}
                  value={currentIndex}
                  aria-valuetext={`Item ${currentIndex + 1} of ${playableItems.length}`}
                  onChange={(event) => seekToItem(event.currentTarget.valueAsNumber)}
                  className="min-w-0 flex-1 accent-amber-300"
                />
                <span className="shrink-0 tabular-nums" aria-hidden="true">
                  {currentIndex + 1} / {playableItems.length}
                </span>
              </label>
            )}

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
