"use client";

import MuxPlayer from "@mux/mux-player-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useSearchParams,
} from "next/navigation";

type PresentationPhoto = {
  url: string;
  caption: string;
  attribution: string;
};

type PresentationData = {
  id: number;
  slug: string;
  fullName: string;
  photos: PresentationPhoto[];
  videos: string[];
  favoriteSongs: string[];
  funeralPresentationMusicSource: "favorite_songs" | "funeral_home";
};

type PresentationItem =
  | {
      type: "photo";
      value: string;
      caption: string;
      attribution: string;
    }
  | {
      type: "video";
      value: string;
      caption: string;
      attribution: string;
    };

const PHOTO_SECONDS = 7;
const MUSIC_VOLUME = 0.7;

function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    let videoId = "";

    if (hostname === "youtu.be") {
      videoId =
        parsedUrl.pathname
          .split("/")
          .filter(Boolean)[0] ?? "";
    } else if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(
        ".youtube-nocookie.com"
      )
    ) {
      if (parsedUrl.pathname === "/watch") {
        videoId =
          parsedUrl.searchParams.get("v") ??
          "";
      } else {
        const pathParts = parsedUrl.pathname
          .split("/")
          .filter(Boolean);

        if (
          pathParts[0] === "shorts" ||
          pathParts[0] === "embed" ||
          pathParts[0] === "live"
        ) {
          videoId = pathParts[1] ?? "";
        }
      }
    }

    return videoId;
  } catch {
    return "";
  }
}

let youtubeIframeApiPromise:
  | Promise<any>
  | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "YouTube player requires a browser."
      )
    );
  }

  const existingYouTubeApi =
    (window as any).YT;

  if (existingYouTubeApi?.Player) {
    return Promise.resolve(
      existingYouTubeApi
    );
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise;
  }

  youtubeIframeApiPromise =
    new Promise((resolve, reject) => {
      const existingReadyHandler =
        (window as any)
          .onYouTubeIframeAPIReady;

      (window as any).onYouTubeIframeAPIReady =
        () => {
          if (
            typeof existingReadyHandler ===
            "function"
          ) {
            existingReadyHandler();
          }

          const youtubeApi =
            (window as any).YT;

          if (youtubeApi?.Player) {
            resolve(youtubeApi);
          } else {
            reject(
              new Error(
                "YouTube player API did not initialize."
              )
            );
          }
        };

      const existingScript =
        document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        );

      if (!existingScript) {
        const script =
          document.createElement("script");

        script.src =
          "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => {
          youtubeIframeApiPromise = null;
          reject(
            new Error(
              "Could not load the YouTube player API."
            )
          );
        };

        document.head.appendChild(script);
      }
    });

  return youtubeIframeApiPromise;
}

export default function CelebrationOfLifePresentationClient() {
  const params =
    useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const slug = params?.slug ?? "";
  const token =
    searchParams.get("token") || "";

  const [data, setData] =
    useState<PresentationData | null>(
      null
    );
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [started, setStarted] =
    useState(false);
  const [paused, setPaused] =
    useState(false);
  const [currentIndex, setCurrentIndex] =
    useState(0);
  const [currentSongIndex, setCurrentSongIndex] =
    useState(0);
  const [musicMuted, setMusicMuted] =
    useState(false);

  const imageTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const songAudioRefs =
    useRef<(HTMLAudioElement | null)[]>(
      []
    );
  const youtubePlayerRef =
    useRef<any>(null);
  const youtubePlayerHostRef =
    useRef<HTMLDivElement | null>(null);
  const favoriteSongsRef =
    useRef<string[]>([]);
  const startedRef = useRef(false);
  const pausedRef = useRef(false);
  const musicMutedRef = useRef(false);
  const currentSongIndexRef =
    useRef(0);
  const currentItemTypeRef =
    useRef<"photo" | "video" | null>(
      null
    );

  useEffect(() => {
    const siteHeader =
      document.querySelector<HTMLElement>(
        "body > header"
      );

    const siteFooter =
      document.querySelector<HTMLElement>(
        "body > footer"
      );

    const previousHeaderDisplay =
      siteHeader?.style.display ?? "";
    const previousFooterDisplay =
      siteFooter?.style.display ?? "";
    const previousBodyBackground =
      document.body.style.background;

    if (siteHeader) {
      siteHeader.style.display = "none";
    }

    if (siteFooter) {
      siteFooter.style.display = "none";
    }

    document.body.style.background =
      "#000";

    return () => {
      if (siteHeader) {
        siteHeader.style.display =
          previousHeaderDisplay;
      }

      if (siteFooter) {
        siteFooter.style.display =
          previousFooterDisplay;
      }

      document.body.style.background =
        previousBodyBackground;
    };
  }, []);

  useEffect(() => {
    async function loadPresentation() {
      if (!slug) {
        setError("Missing memorial.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const query =
          new URLSearchParams({
            slug,
          });

        if (token) {
          query.set("token", token);
        }

        const response = await fetch(
          `/api/funeral-presentation?${query.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result?.memorial
        ) {
          throw new Error(
            result?.error ||
              "The presentation could not be loaded."
          );
        }

        const loaded =
          result.memorial as PresentationData;

        loaded.funeralPresentationMusicSource =
          loaded.funeralPresentationMusicSource === "funeral_home"
            ? "funeral_home"
            : "favorite_songs";

        loaded.favoriteSongs =
          loaded.funeralPresentationMusicSource === "favorite_songs" &&
          Array.isArray(
            loaded.favoriteSongs
          )
            ? loaded.favoriteSongs
                .map((song) =>
                  String(song || "").trim()
                )
                .filter(Boolean)
                .slice(0, 5)
            : [];

        setData(loaded);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The presentation could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPresentation();
  }, [slug, token]);

  const items =
    useMemo<PresentationItem[]>(
      () => {
        if (!data) return [];

        const photoItems =
          data.photos.map((photo) => ({
            type: "photo" as const,
            value: photo.url,
            caption: photo.caption || "",
            attribution:
              photo.attribution || "",
          }));

        const videoItems =
          data.videos.map((value) => ({
            type: "video" as const,
            value,
            caption: "",
            attribution: "",
          }));

        return [
          ...photoItems,
          ...videoItems,
        ];
      },
      [data]
    );

  const favoriteSongs = useMemo(
    () => data?.favoriteSongs || [],
    [data]
  );

  const currentItem =
    items[currentIndex] || null;

  const currentSong =
    favoriteSongs[currentSongIndex] || "";

  const currentYouTubeVideoId =
    getYouTubeVideoId(currentSong);

  useEffect(() => {
    favoriteSongsRef.current =
      favoriteSongs;
  }, [favoriteSongs]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    musicMutedRef.current = musicMuted;
  }, [musicMuted]);

  useEffect(() => {
    currentSongIndexRef.current =
      currentSongIndex;
  }, [currentSongIndex]);

  useEffect(() => {
    currentItemTypeRef.current =
      currentItem?.type || null;
  }, [currentItem]);

  function getActivePlayer() {
    return document.querySelector(
      "mux-player"
    ) as
      | (HTMLElement & {
          play?: () =>
            | Promise<void>
            | void;
          pause?: () => void;
        })
      | null;
  }

  function applyYouTubeMusicSound(
    player: any,
    muted = musicMutedRef.current
  ) {
    if (!player) return;

    try {
      player.setVolume?.(
        Math.round(MUSIC_VOLUME * 100)
      );

      if (muted) {
        player.mute?.();
      } else {
        player.unMute?.();
      }
    } catch (soundError) {
      console.error(
        "Could not update funeral music sound:",
        soundError
      );
    }
  }

  function pauseUploadedFavoriteSongs(
    reset = false
  ) {
    songAudioRefs.current.forEach(
      (audio) => {
        if (!audio) return;

        audio.pause();

        if (reset) {
          audio.currentTime = 0;
        }
      }
    );
  }

  function pauseYouTubeFavoriteSong(
    reset = false
  ) {
    const player = youtubePlayerRef.current;

    if (!player) return;

    try {
      if (reset) {
        player.stopVideo?.();
      } else {
        player.pauseVideo?.();
      }
    } catch (pauseError) {
      console.error(
        "Could not pause YouTube funeral music:",
        pauseError
      );
    }
  }

  function pauseFavoriteSongPlayback(
    reset = false
  ) {
    pauseUploadedFavoriteSongs(reset);
    pauseYouTubeFavoriteSong(reset);
  }

  function playFavoriteSongAtIndex(
    index: number,
    restart = false
  ) {
    const songs = favoriteSongsRef.current;
    const song = songs[index] || "";

    if (
      !song ||
      !startedRef.current ||
      pausedRef.current ||
      currentItemTypeRef.current ===
        "video"
    ) {
      return;
    }

    const youtubeVideoId =
      getYouTubeVideoId(song);

    if (youtubeVideoId) {
      pauseUploadedFavoriteSongs(false);

      const player =
        youtubePlayerRef.current;

      if (!player) return;

      try {
        applyYouTubeMusicSound(player);

        if (restart) {
          player.seekTo?.(0, true);
        }

        player.playVideo?.();
      } catch (playError) {
        console.error(
          "Could not play YouTube funeral music:",
          playError
        );
      }

      return;
    }

    pauseYouTubeFavoriteSong(false);

    const audio =
      songAudioRefs.current[index];

    if (!audio) return;

    songAudioRefs.current.forEach(
      (candidateAudio, candidateIndex) => {
        if (
          !candidateAudio ||
          candidateIndex === index
        ) {
          return;
        }

        candidateAudio.pause();
      }
    );

    audio.volume = MUSIC_VOLUME;
    audio.muted =
      musicMutedRef.current;

    if (restart) {
      audio.currentTime = 0;
    }

    audio.play().catch((playError) => {
      console.error(
        "Could not play funeral Favorite Song:",
        playError
      );
    });
  }

  function advanceFavoriteSong() {
    const songs = favoriteSongsRef.current;

    if (songs.length === 0) {
      return;
    }

    if (songs.length === 1) {
      playFavoriteSongAtIndex(0, true);
      return;
    }

    const current =
      currentSongIndexRef.current;
    const nextIndex =
      current >= songs.length - 1
        ? 0
        : current + 1;

    pauseFavoriteSongPlayback(false);
    currentSongIndexRef.current =
      nextIndex;
    setCurrentSongIndex(nextIndex);
  }

  function advance() {
    setCurrentIndex(
      (previousIndex) =>
        items.length > 0
          ? (previousIndex + 1) %
            items.length
          : 0
    );
  }

  function startPresentation() {
    const firstItem = items[0] || null;

    pauseFavoriteSongPlayback(true);

    currentSongIndexRef.current = 0;
    setCurrentSongIndex(0);
    setCurrentIndex(0);

    pausedRef.current = false;
    setPaused(false);

    startedRef.current = true;
    setStarted(true);

    currentItemTypeRef.current =
      firstItem?.type || null;

    if (
      firstItem?.type === "photo" &&
      favoriteSongsRef.current.length > 0
    ) {
      playFavoriteSongAtIndex(
        0,
        true
      );
    }
  }

  function togglePause() {
    const nextPaused = !pausedRef.current;

    pausedRef.current = nextPaused;
    setPaused(nextPaused);

    const player = getActivePlayer();

    if (nextPaused) {
      player?.pause?.();
      pauseFavoriteSongPlayback(false);
      return;
    }

    if (
      currentItemTypeRef.current ===
      "video"
    ) {
      try {
        void player?.play?.();
      } catch {
        // Browser playback controls remain available.
      }

      return;
    }

    playFavoriteSongAtIndex(
      currentSongIndexRef.current,
      false
    );
  }

  function toggleMusicMute() {
    const nextMuted =
      !musicMutedRef.current;

    musicMutedRef.current = nextMuted;
    setMusicMuted(nextMuted);

    songAudioRefs.current.forEach(
      (audio) => {
        if (!audio) return;
        audio.muted = nextMuted;
      }
    );

    applyYouTubeMusicSound(
      youtubePlayerRef.current,
      nextMuted
    );
  }

  function restartPresentation() {
    const firstItem = items[0] || null;

    pauseFavoriteSongPlayback(true);

    currentSongIndexRef.current = 0;
    setCurrentSongIndex(0);
    setCurrentIndex(0);

    pausedRef.current = false;
    setPaused(false);

    startedRef.current = true;
    setStarted(true);

    currentItemTypeRef.current =
      firstItem?.type || null;

    if (
      firstItem?.type === "photo" &&
      favoriteSongsRef.current.length > 0
    ) {
      playFavoriteSongAtIndex(
        0,
        true
      );
    }
  }

  async function enterFullScreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement
          .requestFullscreen();
      }
    } catch {
      // Full-screen support varies by browser/device.
    }
  }

  async function exitPresentation() {
    pauseFavoriteSongPlayback(false);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Continue with navigation even if fullscreen exit fails.
    }

    window.location.assign(
      `/memorial/${encodeURIComponent(slug)}/manage`
    );
  }

  useEffect(() => {
    if (imageTimerRef.current) {
      clearTimeout(
        imageTimerRef.current
      );
      imageTimerRef.current = null;
    }

    if (
      !started ||
      paused ||
      !currentItem ||
      currentItem.type !== "photo"
    ) {
      return;
    }

    imageTimerRef.current =
      setTimeout(
        advance,
        PHOTO_SECONDS * 1000
      );

    return () => {
      if (imageTimerRef.current) {
        clearTimeout(
          imageTimerRef.current
        );
        imageTimerRef.current = null;
      }
    };
  }, [
    started,
    paused,
    currentItem,
    currentIndex,
    items.length,
  ]);

  useEffect(() => {
    if (!started || paused) {
      return;
    }

    if (currentItem?.type === "video") {
      pauseFavoriteSongPlayback(false);

      const timer = setTimeout(() => {
        try {
          void getActivePlayer()
            ?.play?.();
        } catch {
          // The visible Mux player can still be started manually.
        }
      }, 100);

      return () =>
        clearTimeout(timer);
    }

    if (currentItem?.type === "photo") {
      playFavoriteSongAtIndex(
        currentSongIndexRef.current,
        false
      );
    }
  }, [
    started,
    paused,
    currentIndex,
    currentItem,
    currentSongIndex,
  ]);

  useEffect(() => {
    songAudioRefs.current.forEach(
      (audio) => {
        if (!audio) return;

        audio.volume = MUSIC_VOLUME;
        audio.muted = musicMuted;
      }
    );

    applyYouTubeMusicSound(
      youtubePlayerRef.current,
      musicMuted
    );
  }, [musicMuted, currentSongIndex]);

  useEffect(() => {
    if (!currentYouTubeVideoId) {
      return;
    }

    const host =
      youtubePlayerHostRef.current;

    if (!host) return;

    let cancelled = false;
    let createdPlayer: any = null;

    loadYouTubeIframeApi()
      .then((youtubeApi) => {
        if (
          cancelled ||
          !youtubePlayerHostRef.current
        ) {
          return;
        }

        createdPlayer =
          new youtubeApi.Player(
            youtubePlayerHostRef.current,
            {
              width: "100%",
              height: "100%",
              videoId:
                currentYouTubeVideoId,
              playerVars: {
                autoplay: 0,
                controls: 1,
                playsinline: 1,
                rel: 0,
                origin:
                  window.location.origin,
              },
              events: {
                onReady: (event: any) => {
                  if (cancelled) return;

                  youtubePlayerRef.current =
                    event.target;

                  applyYouTubeMusicSound(
                    event.target
                  );

                  if (
                    startedRef.current &&
                    !pausedRef.current &&
                    currentItemTypeRef.current !==
                      "video"
                  ) {
                    event.target.playVideo?.();
                  }
                },
                onStateChange: (
                  event: any
                ) => {
                  if (
                    event.data ===
                      youtubeApi.PlayerState
                        ?.ENDED &&
                    startedRef.current &&
                    !pausedRef.current &&
                    currentItemTypeRef.current !==
                      "video"
                  ) {
                    advanceFavoriteSong();
                  }
                },
                onError: (event: any) => {
                  console.error(
                    "YouTube funeral music playback error:",
                    event.data
                  );

                  if (
                    startedRef.current &&
                    !pausedRef.current &&
                    currentItemTypeRef.current !==
                      "video"
                  ) {
                    advanceFavoriteSong();
                  }
                },
              },
            }
          );

        youtubePlayerRef.current =
          createdPlayer;
      })
      .catch((youtubeError) => {
        console.error(
          "Could not initialize YouTube funeral music:",
          youtubeError
        );
      });

    return () => {
      cancelled = true;

      try {
        createdPlayer?.destroy?.();
      } catch {
        // The player may already have been removed during a song change.
      }

      if (
        youtubePlayerRef.current ===
        createdPlayer
      ) {
        youtubePlayerRef.current = null;
      }
    };
  }, [currentYouTubeVideoId]);

  useEffect(() => {
    return () => {
      pauseFavoriteSongPlayback(true);

      try {
        youtubePlayerRef.current
          ?.destroy?.();
      } catch {
        // The YouTube player may already have been removed.
      }

      youtubePlayerRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <p className="text-xl font-semibold">
          Loading Celebration of Life Presentation...
        </p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold">
            Celebration of Life Presentation
          </h1>

          <p className="mt-5 text-lg leading-8 text-stone-300">
            {error ||
              "This presentation is not available."}
          </p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold">
            {data.fullName}
          </h1>

          <p className="mt-5 text-xl leading-8 text-stone-300">
            There are no photos or videos available for the Celebration of Life Presentation yet.
          </p>

          <button
            type="button"
            onClick={exitPresentation}
            className="mt-8 rounded-full border border-white/40 px-6 py-4 text-base font-bold text-white hover:bg-white/10"
          >
            Exit Presentation
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/85 to-transparent px-6 pb-12 pt-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-5">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.16em] text-stone-300">
              Celebration of Life Presentation
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              {data.fullName}
            </h1>
          </div>

          <p className="text-base font-semibold text-stone-300">
            {currentIndex + 1} of {items.length}
          </p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 pb-32 pt-28 md:px-8">
        {!started ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur md:p-12">
            <h2 className="text-4xl font-bold md:text-5xl">
              Ready to Begin
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-xl leading-9 text-stone-200">
              Photos will advance automatically. Videos will play in full, and the presentation will continuously loop.
            </p>

            {data.funeralPresentationMusicSource === "funeral_home" ? (
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-300">
                The memorial owner chose not to use Favorite Songs as background
                music for this presentation. The funeral home may provide
                background music separately.
              </p>
            ) : favoriteSongs.length > 0 ? (
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-300">
                The memorial&apos;s Favorite Songs will play as background music.
                Use Mute Music at any time without muting memorial videos.
              </p>
            ) : (
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-300">
                No Favorite Songs are saved for this presentation, so it will
                begin without MyEMemorial background music.
              </p>
            )}

            <button
              type="button"
              onClick={startPresentation}
              className="mt-8 rounded-full bg-white px-8 py-5 text-xl font-bold text-stone-950 transition hover:bg-stone-200"
            >
              ▶ Start Presentation
            </button>
          </div>
        ) : currentItem?.type === "photo" ? (
          <div className="flex w-full max-w-7xl flex-col items-center justify-center">
            <img
              key={currentItem.value}
              src={currentItem.value}
              alt={`${data.fullName} memorial presentation`}
              className="max-h-[calc(100vh-17rem)] max-w-full object-contain"
            />

            {(currentItem.caption ||
              currentItem.attribution) && (
              <div className="mt-5 max-w-4xl rounded-2xl bg-black/75 px-6 py-4 text-center">
                {currentItem.caption && (
                  <p className="text-xl font-semibold leading-8 text-white md:text-2xl">
                    {currentItem.caption}
                  </p>
                )}

                {currentItem.attribution && (
                  <p className="mt-2 text-base font-semibold text-stone-300">
                    Submitted by {currentItem.attribution}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : currentItem?.type === "video" ? (
          <div className="flex w-full max-w-7xl items-center justify-center">
            <MuxPlayer
              key={currentItem.value}
              playbackId={currentItem.value}
              streamType="on-demand"
              autoPlay={!paused}
              className="aspect-video max-h-[calc(100vh-12rem)] w-full bg-black"
              onPlay={() =>
                pauseFavoriteSongPlayback(
                  false
                )
              }
              onEnded={advance}
            />
          </div>
        ) : null}
      </div>

      {favoriteSongs.map(
        (song, index) => {
          if (getYouTubeVideoId(song)) {
            return null;
          }

          return (
            <audio
              key={`${song}-${index}`}
              ref={(element) => {
                songAudioRefs.current[index] =
                  element;
              }}
              src={song}
              preload="auto"
              className="hidden"
              onEnded={() => {
                if (
                  startedRef.current &&
                  !pausedRef.current &&
                  currentItemTypeRef.current !==
                    "video"
                ) {
                  advanceFavoriteSong();
                }
              }}
            />
          );
        }
      )}

      {currentYouTubeVideoId && (
        <div
          className={`fixed bottom-28 right-4 z-30 w-[240px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/25 bg-black/90 p-3 shadow-2xl transition-opacity md:w-[280px] ${
            started &&
            currentItem?.type !== "video"
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-base font-bold text-white">
              Favorite Song {currentSongIndex + 1}
            </p>

            <span className="rounded-full bg-red-700 px-3 py-1 text-base font-bold text-white">
              YouTube
            </span>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <div
              ref={youtubePlayerHostRef}
              className="h-full w-full"
            />
          </div>

          {musicMuted && (
            <p className="mt-2 text-base font-semibold text-stone-300">
              Memorial music is muted. Video sound remains on.
            </p>
          )}
        </div>
      )}

      {started && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/15 bg-black/90 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-white/25 px-5 py-3 text-base font-bold text-stone-200">
              {currentItem?.type === "photo"
                ? "Photo"
                : "Video"}{" "}
              {currentIndex + 1} of {items.length}
            </span>

            <button
              type="button"
              onClick={togglePause}
              className="rounded-full border border-white/30 px-5 py-3 text-base font-bold text-white hover:bg-white/10"
            >
              {paused
                ? "▶ Resume"
                : "⏸ Pause"}
            </button>

            {favoriteSongs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={toggleMusicMute}
                  aria-pressed={musicMuted}
                  className="rounded-full border border-amber-300/60 bg-amber-950/30 px-5 py-3 text-base font-bold text-amber-100 hover:bg-amber-950/60"
                >
                  {musicMuted
                    ? "🔇 Music Off — Turn On"
                    : "🔊 Mute Music"}
                </button>

                <span className="rounded-full border border-white/25 px-5 py-3 text-base font-bold text-stone-200">
                  Music {currentSongIndex + 1} of {favoriteSongs.length}
                </span>

                {favoriteSongs.length > 1 && (
                  <button
                    type="button"
                    onClick={advanceFavoriteSong}
                    className="rounded-full border border-white/30 px-5 py-3 text-base font-bold text-white hover:bg-white/10"
                  >
                    Next Song →
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={restartPresentation}
              className="rounded-full border border-white/30 px-5 py-3 text-base font-bold text-white hover:bg-white/10"
            >
              ↻ Restart
            </button>

            <button
              type="button"
              onClick={enterFullScreen}
              className="rounded-full border border-white/30 px-5 py-3 text-base font-bold text-white hover:bg-white/10"
            >
              ⛶ Full Screen
            </button>

            <button
              type="button"
              onClick={exitPresentation}
              className="rounded-full border border-red-300/50 px-5 py-3 text-base font-bold text-red-200 hover:bg-red-950/40"
            >
              Exit Presentation
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
