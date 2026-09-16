"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PresentationMusic = {
  id: number;
  source_type: "uploaded" | "youtube" | "library";
  source_url: string;
};

type OfflineVideoSectionProps = {
  publicId: string;
  personName: string;
  paymentStatus: string;
  status: string;
  music: PresentationMusic[];
};

type OfflineStatus =
  | "idle"
  | "preparing_media"
  | "rendering"
  | "ready"
  | "failed";

function cleanPersonName(value: string) {
  return value.replace(/\s+\(Sample Presentation\)$/i, "").trim();
}

function measureAudioDuration(url: string) {
  return new Promise<number>((resolve, reject) => {
    const audio = new Audio();
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      audio.removeAttribute("src");
      audio.load();
      callback();
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("Music metadata timed out.")));
    }, 15000);

    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    audio.addEventListener(
      "loadedmetadata",
      () => {
        const duration = Number(audio.duration);

        if (!Number.isFinite(duration) || duration <= 0) {
          finish(() =>
            reject(new Error("Music duration could not be read."))
          );
          return;
        }

        finish(() => resolve(duration));
      },
      { once: true }
    );

    audio.addEventListener(
      "error",
      () => {
        finish(() =>
          reject(new Error("Music metadata could not be loaded."))
        );
      },
      { once: true }
    );

    audio.src = url;
  });
}

export default function OfflineVideoSection({
  publicId,
  personName,
  paymentStatus,
  status,
  music,
}: OfflineVideoSectionProps) {
  const [offlineStatus, setOfflineStatus] =
    useState<OfflineStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [filename, setFilename] = useState(
    `Celebration of Life - ${cleanPersonName(personName)}.mp4`
  );
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const aliveRef = useRef(true);

  const eligible = paymentStatus === "paid" && status === "active";

  const applyResult = useCallback((result: any) => {
    const nextStatus = String(result?.status || "");

    if (nextStatus === "ready" && result?.outputUrl) {
      setOfflineStatus("ready");
      setProgress(100);
      setOutputUrl(String(result.outputUrl));
      setFilename(
        String(
          result?.filename ||
            `Celebration of Life - ${cleanPersonName(personName)}.mp4`
        )
      );
      setMessage("");
      setErrorMessage("");
      return;
    }

    if (nextStatus === "rendering") {
      setOfflineStatus("rendering");
      setProgress(
        Math.max(
          0,
          Math.min(100, Number(result?.progress || 0))
        )
      );
      setOutputUrl("");
      setErrorMessage("");
      setMessage(
        Number(result?.progress || 0) >= 100
          ? "Finishing your Offline Copy. Your download button will appear when it is completely ready."
          : "Preparing your Offline Copy. This may take a few minutes. You may stay on this page."
      );
      return;
    }

    if (nextStatus === "preparing_media") {
      setOfflineStatus("preparing_media");
      setProgress(0);
      setOutputUrl("");
      setErrorMessage("");
      setMessage(
        result?.preparingVideos
          ? `Preparing ${result.preparingVideos} video${
              result.preparingVideos === 1 ? "" : "s"
            } for your Offline Copy...`
          : "Preparing your presentation files..."
      );
      return;
    }

    if (nextStatus === "failed") {
      setOfflineStatus("failed");
      setOutputUrl("");
      setMessage("");
      setErrorMessage(
        String(
          result?.error ||
            "The Offline Copy could not be prepared. Please try again."
        )
      );
      return;
    }

    setOfflineStatus("idle");
    setProgress(0);
    setOutputUrl("");
    setMessage("");
  }, [personName]);

  const checkStatus = useCallback(async () => {
    if (!eligible || !publicId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/offline-video`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The Offline Copy status could not be checked."
        );
      }

      if (aliveRef.current) {
        applyResult(result);
      }
    } catch (error) {
      if (aliveRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The Offline Copy status could not be checked."
        );
      }
    }
  }, [applyResult, eligible, publicId]);

  useEffect(() => {
    aliveRef.current = true;
    void checkStatus();

    return () => {
      aliveRef.current = false;
    };
  }, [checkStatus]);

  useEffect(() => {
    if (
      offlineStatus !== "rendering" &&
      offlineStatus !== "preparing_media"
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (offlineStatus === "preparing_media") {
        void startRender(true);
      } else {
        void checkStatus();
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [checkStatus, offlineStatus]);

  if (!eligible) {
    return null;
  }

  async function getMusicDurations() {
    const tracks = music.filter(
      (track) =>
        track.source_type !== "youtube" && Boolean(track.source_url)
    );

    const durations = await Promise.all(
      tracks.map(async (track) => ({
        id: track.id,
        durationSeconds: await measureAudioDuration(track.source_url),
      }))
    );

    return durations;
  }

  async function startRender(isAutomaticRetry = false) {
    if (starting && !isAutomaticRetry) {
      return;
    }

    try {
      if (!isAutomaticRetry) {
        setStarting(true);
        setErrorMessage("");
        setMessage(
          "Preparing your presentation files..."
        );
      }

      const musicDurations = await getMusicDurations();

      const response = await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/offline-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            musicDurations,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The Offline Copy could not be prepared."
        );
      }

      applyResult(result);
    } catch (error) {
      setOfflineStatus("failed");
      setMessage("");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The Offline Copy could not be prepared."
      );
    } finally {
      if (!isAutomaticRetry) {
        setStarting(false);
      }
    }
  }

  async function downloadPresentation() {
    if (!outputUrl || downloading) {
      return;
    }

    try {
      setDownloading(true);
      setErrorMessage("");

      const response = await fetch(outputUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          "Your Offline Copy could not be downloaded. Please try again."
        );
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.style.display = "none";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error("OFFLINE COPY DOWNLOAD ERROR:", error);

      setErrorMessage(
        "Your Offline Copy could not be downloaded. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }
  return (
    <section className="mt-8 rounded-3xl border border-[#cdbf9f] bg-[#fffdf8]/95 p-6 shadow-sm sm:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-base font-bold uppercase tracking-[0.16em] text-[#8d6c3f]">
          Event Readiness
        </p>

        <h2 className="mt-2 font-serif text-3xl font-bold text-[#173a31]">
          Offline Copy
        </h2>

        <p className="mt-3 text-lg leading-8 text-[#344f43]">
          Create a video copy of this Celebration of Life Presentation
          that will play even if there is no internet at the service.
        </p>

        {offlineStatus === "idle" || offlineStatus === "failed" ? (
          <button
            type="button"
            onClick={() => void startRender()}
            disabled={starting}
            className="mt-6 min-h-14 rounded-full bg-[#244f40] px-8 py-3 text-lg font-bold text-white transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starting
              ? "Preparing..."
              : "Download Offline Copy"}
          </button>
        ) : null}

        {offlineStatus === "preparing_media" ||
        offlineStatus === "rendering" ? (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-[#f8f4e9] p-5">
            <p className="text-xl font-bold text-[#173a31]">
              Preparing Your Offline Copy...
            </p>

            <p className="mt-2 text-base leading-7 text-stone-700">
              {message}
            </p>

            {offlineStatus === "rendering" ? (
              <div className="mx-auto mt-4 h-3 max-w-xl overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-[#244f40] transition-all"
                  style={{
                    width: `${Math.max(
                      4,
                      Math.min(progress >= 100 ? 95 : progress, 95)
                    )}%`,
                  }}
                />
              </div>
            ) : null}

            {offlineStatus === "rendering" && progress > 0 ? (
              <p className="mt-2 text-sm font-semibold text-stone-600">
                {progress >= 100 ? "Almost ready..." : `${Math.round(progress)}%`}
              </p>
            ) : null}
          </div>
        ) : null}

        {offlineStatus === "ready" && outputUrl ? (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[#b5ccba] bg-[#f4faf2] p-5">
            <p className="text-xl font-bold text-[#173a31]">
              ✓ Your Offline Copy Is Ready
            </p>

            <p className="mt-2 text-base leading-7 text-[#344f43]">
              Save this video on the laptop or device that will be used
              at the service.
            </p>

            <button
              type="button"
              onClick={() => void downloadPresentation()}
              disabled={downloading}
              className="mt-5 inline-flex min-h-14 items-center justify-center rounded-full bg-[#244f40] px-8 py-3 text-lg font-bold text-white transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading
                ? "Downloading..."
                : "Download My Presentation"}
            </button>

            <p className="mt-4 text-base leading-7 text-stone-700">
              After downloading, open the file and play it from
              beginning to end with Wi-Fi turned off.
            </p>
          </div>
        ) : null}

        {errorMessage ? (
          <p
            role="alert"
            className="mx-auto mt-5 max-w-2xl rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <details className="mx-auto mt-6 max-w-2xl rounded-2xl border border-stone-200 bg-white/80 p-4 text-left">
          <summary className="cursor-pointer text-base font-bold text-[#173a31]">
            Want an extra backup?
          </summary>

          <p className="mt-3 text-base leading-7 text-stone-700">
            Copy the downloaded Offline Copy to a USB thumb drive or a
            second device. Bring both copies to the service.
          </p>
        </details>
      </div>
    </section>
  );
}
