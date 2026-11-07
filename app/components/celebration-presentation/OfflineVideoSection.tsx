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
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopyError, setLinkCopyError] = useState("");
  const [openChoice, setOpenChoice] = useState<"watch" | "offline" | "funeral" | null>(null);
  const [device, setDevice] = useState<"windows" | "iphone" | "android" | "mac">("windows");
  const aliveRef = useRef(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/i.test(ua)) setDevice("iphone");
    else if (/Android/i.test(ua)) setDevice("android");
    else if (/Macintosh|Mac OS X/i.test(ua)) setDevice("mac");
  }, []);

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

  const renderRequestInFlight = useRef(false);

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
    if (renderRequestInFlight.current) {
      return;
    }

    renderRequestInFlight.current = true;

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
      renderRequestInFlight.current = false;
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

      /*
       * Download through MyEMemorial instead of fetching Renderly/S3
       * directly in the browser. The server verifies this presentation,
       * confirms the current render is ready, and streams the MP4 back
       * with an attachment filename. This avoids cross-origin download
       * failures from the Renderly storage URL.
       */
      const anchor = document.createElement("a");
      anchor.href =
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/offline-video?download=1`;
      anchor.download = filename;
      anchor.style.display = "none";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        if (aliveRef.current) {
          setDownloading(false);
        }
      }, 2500);
    } catch (error) {
      console.error("OFFLINE COPY DOWNLOAD ERROR:", error);

      setErrorMessage(
        "Your Offline Copy could not be downloaded. Please try again."
      );
      setDownloading(false);
    }
  }
  const viewingPath = `/celebration-of-life-slideshow/${encodeURIComponent(publicId)}`;

  async function copyViewingLink() {
    const viewingLink = `${window.location.origin}${viewingPath}`;
    setLinkCopyError("");
    setLinkCopied(false);
    try {
      await navigator.clipboard.writeText(viewingLink);
      setLinkCopied(true);
    } catch {
      // Make the safe viewing URL selectable when clipboard permissions are unavailable.
      setLinkCopyError(viewingLink);
    }
  }

  const toggle = (choice: "watch" | "offline" | "funeral") => {
    setOpenChoice((current) => current === choice ? null : choice);
  };

  const choiceClass = "w-full flex items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left transition hover:bg-[#f6f3ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244f40]";
  const panelClass = "border-t border-[#e5ded0] px-5 pb-5 pt-4 text-left text-base leading-7 text-[#344f43]";

  return (
    <section className="mt-8 rounded-3xl border border-[#cdbf9f] bg-[#fffdf8]/95 p-5 shadow-sm sm:p-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-sm font-bold uppercase tracking-[0.15em] text-[#8d6c3f]">Your Celebration of Life Presentation</p>
        <h2 className="mt-2 text-center font-serif text-3xl font-bold text-[#173a31]">Watch, Save, or Share</h2>
        <p className="mt-3 text-center text-base text-[#344f43]">Choose what you would like to do. Instructions appear only for your choice.</p>

        <div className="mt-6 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#d9d1c1] bg-white">
            <button type="button" className={choiceClass} aria-expanded={openChoice === "watch"} aria-controls="celebration-watch-panel" onClick={() => toggle("watch")}>
              <span><span className="block text-lg font-bold text-[#173a31]">Watch or Share Online</span><span className="block text-sm text-stone-600">For family, friends, and venues with internet</span></span>
              <span aria-hidden="true" className="text-xl text-[#244f40]">{openChoice === "watch" ? "−" : "+"}</span>
            </button>
            {openChoice === "watch" && (
              <div id="celebration-watch-panel" className={panelClass}>
                <p>Watch your presentation online or share the viewing link with family, friends, and your funeral home.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={viewingPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#244f40] px-6 py-3 font-bold text-white hover:bg-[#193b30]"
                  >
                    Play Presentation
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyViewingLink()}
                    className="min-h-12 rounded-full border-2 border-[#244f40] bg-white px-6 py-3 font-bold text-[#173a31] hover:bg-[#e9f0e8]"
                  >
                    {linkCopied ? "Link Copied!" : "Copy Viewing Link"}
                  </button>
                </div>
                {linkCopied && <p role="status" className="mt-3 text-sm font-semibold text-[#244f40]">Viewing link copied. Paste it into an email or message to share it.</p>}
                {linkCopyError && (
                  <div className="mt-3">
                    <label htmlFor="celebration-view-link" className="block text-sm font-semibold text-[#244f40]">Copy this viewing link:</label>
                    <input id="celebration-view-link" readOnly onFocus={(event) => event.target.select()} value={linkCopyError} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-sm" />
                  </div>
                )}
                <p className="mt-3 text-sm text-stone-600">This link lets others watch your presentation. It does not let them edit it.</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9d1c1] bg-white">
            <button type="button" className={choiceClass} aria-expanded={openChoice === "offline"} aria-controls="celebration-offline-panel" onClick={() => toggle("offline")}>
              <span><span className="block text-lg font-bold text-[#173a31]">Save for Offline Viewing</span><span className="block text-sm text-stone-600">Only needed if the venue has no reliable internet</span></span>
              <span aria-hidden="true" className="text-xl text-[#244f40]">{openChoice === "offline" ? "−" : "+"}</span>
            </button>
            {openChoice === "offline" && (
              <div id="celebration-offline-panel" className={panelClass}>
                <p>A saved MP4 video can play without internet. Download it <strong>before</strong> the service.</p>

                {(offlineStatus === "idle" || offlineStatus === "failed") && (
                  <button type="button" onClick={() => void startRender()} disabled={starting} className="mt-5 min-h-12 rounded-full bg-[#244f40] px-6 py-3 font-bold text-white hover:bg-[#193b30] disabled:opacity-60">
                    {starting ? "Preparing..." : "Prepare My Offline Video"}
                  </button>
                )}

                {(offlineStatus === "preparing_media" || offlineStatus === "rendering") && (
                  <div className="mt-5 rounded-xl bg-[#f8f4e9] p-4" role="status">
                    <p className="font-bold text-[#173a31]">Preparing Your Offline Video</p>
                    <p className="mt-1">{message}</p>
                    {offlineStatus === "rendering" && (
                      <>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-[#244f40] transition-all" style={{width: `${Math.max(4, Math.min(progress >= 100 ? 95 : progress, 95))}%`}} /></div>
                        {progress > 0 && <p className="mt-1 text-sm">{progress >= 100 ? "Almost ready..." : `${Math.round(progress)}%`}</p>}
                      </>
                    )}
                  </div>
                )}

                {offlineStatus === "ready" && outputUrl && (
                  <div className="mt-5 rounded-xl border border-[#b5ccba] bg-[#f4faf2] p-4">
                    <p className="font-bold text-[#173a31]">Your Offline Video Is Ready</p>
                    <button type="button" onClick={() => void downloadPresentation()} disabled={downloading} className="mt-3 min-h-12 rounded-full bg-[#244f40] px-6 py-3 font-bold text-white hover:bg-[#193b30] disabled:opacity-60">
                      {downloading ? "Starting Download..." : "Download Now to This Device"}
                    </button>
                    <p className="mt-3 text-sm">Please allow the download to finish completely before using the video offline.</p>
                  </div>
                )}

                {errorMessage && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{errorMessage}</p>}

                <details className="mt-5 rounded-xl border border-stone-200 bg-[#fffdf8] p-3">
                  <summary className="cursor-pointer font-semibold text-[#173a31]">Where will I find my video?</summary>
                  <label className="mt-3 block text-sm font-semibold" htmlFor="celebration-device">My device</label>
                  <select id="celebration-device" value={device} onChange={(event) => setDevice(event.target.value as typeof device)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-base">
                    <option value="windows">Windows computer</option><option value="iphone">iPhone or iPad</option><option value="android">Android</option><option value="mac">Mac</option>
                  </select>
                  <p className="mt-3 text-sm">
                    {device === "windows" && "Open File Explorer → Downloads. Double-click the Celebration of Life MP4 file."}
                    {device === "iphone" && "Open the Files app → Browse → Downloads. If necessary, also check On My iPhone or iCloud Drive."}
                    {device === "android" && "Open Files (or My Files) → Downloads, then tap the video."}
                    {device === "mac" && "Open Finder → Downloads, then double-click the video."}
                  </p>
                </details>
                <p className="mt-4 text-sm"><strong>Before the service:</strong> play the entire downloaded video with Wi-Fi off, check the sound, and consider a backup USB drive.</p>
                <p className="mt-2 text-sm text-stone-600">Email delivery of a private download link is a planned addition. The working Download Now option remains available here.</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9d1c1] bg-white">
            <button type="button" className={choiceClass} aria-expanded={openChoice === "funeral"} aria-controls="celebration-funeral-panel" onClick={() => toggle("funeral")}>
              <span><span className="block text-lg font-bold text-[#173a31]">Send to Funeral Home</span><span className="block text-sm text-stone-600">Help the funeral director prepare ahead of time</span></span>
              <span aria-hidden="true" className="text-xl text-[#244f40]">{openChoice === "funeral" ? "−" : "+"}</span>
            </button>
            {openChoice === "funeral" && (
              <div id="celebration-funeral-panel" className={panelClass}>
                <p>We recommend contacting the funeral home before the service and asking whether the venue has reliable internet.</p>
                <details className="mt-3 rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">Yes, they have internet</summary><p className="mt-2 text-sm">Send the regular online viewing link and ask the funeral director to test playback and sound.</p></details>
                <details className="mt-3 rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">No, they need an offline copy</summary><p className="mt-2 text-sm">Use Save for Offline Viewing above to get the MP4 in advance. Arrange to deliver the saved file, such as on a USB drive, and ask them to test it.</p></details>
                <p className="mt-3 text-sm text-stone-600">Direct emailing to a funeral home will be added after secure sharing and delivery are connected. Please do not forward your private editing link.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
