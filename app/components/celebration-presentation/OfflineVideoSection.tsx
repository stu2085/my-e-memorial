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

function formatFileSize(bytes: number) {
  const gigabyte = 1_000_000_000;
  return bytes >= gigabyte
    ? `${(bytes / gigabyte).toFixed(2)} GB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;
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
  const [filename, setFilename] = useState(
    `Celebration of Life - ${cleanPersonName(personName)}.mp4`
  );
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadRequested, setDownloadRequested] = useState(false);
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

  const isPreparing = starting || offlineStatus === "preparing_media" || offlineStatus === "rendering";

  useEffect(() => {
    if (!isPreparing) return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPreparing]);

  const eligible = paymentStatus === "paid" && status === "active";

  const applyResult = useCallback((result: any) => {
    const nextStatus = String(result?.status || "");

    if (nextStatus === "ready") {
      setOfflineStatus("ready");
      const bytes = Number(result?.sizeBytes);
      setSizeBytes(Number.isSafeInteger(bytes) && bytes > 0 ? bytes : null);
      setProgress(100);
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
      setMessage("");
      setErrorMessage(
        String(
          result?.error ||
            "We couldn’t prepare your video."
        )
      );
      return;
    }

    setOfflineStatus("idle");
    setProgress(0);
    setMessage("");
    setErrorMessage("");
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

      if (!response.ok && result?.status !== "failed") {
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

  async function prepareOnlineVideoIfNeeded() {
    try {
      const response = await fetch(
        `/api/celebration-presentations/${encodeURIComponent(publicId)}/offline-video?playback=1`,
        { credentials: "include", cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Could not check online video availability.");
      }

      const result = await response.json();
      if (!aliveRef.current || result.status === "ready") return;

      if (result.status === "unavailable") {
        await startRender();
      }
    } catch {
      if (aliveRef.current) {
        setErrorMessage("Could not check the online video. Close and reopen Watch or Share Online to try again.");
      }
    }
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
        setElapsedSeconds(0);
        setDownloadRequested(false);
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
    if (offlineStatus !== "ready" || downloading) {
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
      setDownloadRequested(true);
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
    <section id="watch-save-share" className="mt-8 rounded-3xl border border-[#cdbf9f] bg-[#fffdf8]/95 p-5 shadow-sm sm:p-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="mt-2 text-center font-serif text-3xl font-bold text-[#173a31]">Watch, Save, or Share</h2>

        <div className="mt-6 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#d9d1c1] bg-white">
            <button type="button" className={choiceClass} aria-expanded={openChoice === "watch"} aria-controls="celebration-watch-panel" onClick={() => {
              toggle("watch");
              if (openChoice !== "watch") void prepareOnlineVideoIfNeeded();
            }}>
              <span><span className="block text-lg font-bold text-[#173a31]">Watch or Share Online</span><span className="block text-sm text-stone-600">For family, friends, and venues with internet</span></span>
              <span aria-hidden="true" className="text-xl text-[#244f40]">{openChoice === "watch" ? "−" : "+"}</span>
            </button>
            {openChoice === "watch" && (
              <div id="celebration-watch-panel" className={panelClass}>
                <p>Watch your presentation online or share the viewing link with family, friends, and your funeral home.</p>
                {(starting || offlineStatus === "preparing_media" || offlineStatus === "rendering") && (
                  <p role="status" className="mt-3 text-sm font-semibold">
                    We’re preparing the video for online playback. The viewing page checks automatically.
                  </p>
                )}
                {errorMessage && (
                  <p role="alert" className="mt-3 text-sm text-red-700">{errorMessage}</p>
                )}
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
            <button type="button" className={choiceClass} aria-expanded={openChoice === "offline"} aria-controls="celebration-offline-panel" onClick={() => {
              toggle("offline");
              if (openChoice !== "offline" && !isPreparing) void checkStatus();
            }}>
              <span><span className="block text-lg font-bold text-[#173a31]">Save for Offline Viewing</span><span className="block text-sm text-stone-600">Only needed if the venue has no reliable internet</span></span>
              <span aria-hidden="true" className="text-xl text-[#244f40]">{openChoice === "offline" ? "−" : "+"}</span>
            </button>
            {openChoice === "offline" && (
              <div id="celebration-offline-panel" className={panelClass}>
                <p>Start preparing your video <strong>at least three days before the event</strong> so you have time to download it and test it on the device you’ll use at the service.</p>

                {(offlineStatus === "idle" || offlineStatus === "failed") && (
                  <button type="button" onClick={() => void startRender()} disabled={starting} className="mt-5 min-h-12 rounded-full bg-[#244f40] px-6 py-3 font-bold text-white hover:bg-[#193b30] disabled:opacity-60">
                    {starting ? "Preparing…" : offlineStatus === "failed" ? "Retry Video Preparation" : "Prepare My Offline Video"}
                  </button>
                )}

                {(offlineStatus === "preparing_media" || offlineStatus === "rendering") && (
                  <div className="mt-5 rounded-xl bg-[#f8f4e9] p-4" role="status">
                    <p className="font-bold text-[#173a31]">Preparing Your Offline Video</p>
                    <p className="mt-1">{message}</p>
                    <p className="mt-1 text-sm tabular-nums" aria-hidden="true">Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</p>
                    {offlineStatus === "rendering" && progress > 0 && progress < 100 && (
                      <>
                        <div aria-hidden="true" className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="h-full rounded-full bg-[#244f40] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-sm">{Math.floor(progress)}% rendered</p>
                      </>
                    )}
                    {offlineStatus === "rendering" && progress >= 100 && (
                      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#173a31]">
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 rounded-full border-2 border-[#244f40]/25 border-t-[#244f40] motion-safe:animate-spin"
                        />
                        <span>Finishing your offline video…</span>
                      </div>
                    )}
                    {elapsedSeconds >= 300 && (
                      <p className="mt-2 text-sm text-stone-700">
                        Large presentations can take several minutes. We’re still checking for your download.
                      </p>
                    )}
                  </div>
                )}

                {offlineStatus === "ready" && (
                  <div className="mt-5 rounded-xl border border-[#b5ccba] bg-[#f4faf2] p-4">
                    <p className="font-bold text-[#173a31]">{downloadRequested ? "Check your Downloads" : "Save a copy to this device"}</p>
                    {sizeBytes !== null && <p className="mt-1 text-sm">MP4 file size {formatFileSize(sizeBytes)}</p>}
                    <button type="button" onClick={() => void downloadPresentation()} disabled={downloading} className={downloadRequested ? "mt-2 text-sm font-semibold text-[#244f40] underline underline-offset-2 disabled:opacity-50" : "mt-3 min-h-12 rounded-full bg-[#244f40] px-6 py-3 font-bold text-white hover:bg-[#193b30] disabled:opacity-60"}>
                      {downloading ? "Starting Download..." : (downloadRequested ? "Try download again" : "Download MP4")}
                    </button>
                    <p className="mt-3 text-sm">
                      <strong>Important</strong> — To keep the presentation playing on repeat, open the downloaded MP4 and turn on
                      <strong> Repeat</strong> or <strong>Loop</strong> in the player you’ll use at the service.
                    </p>
                    <div className="mt-4 rounded-xl border border-[#b5ccba] bg-white p-4 text-[#173a31]" role="status">
                      <p className="font-bold">Track progress in your browser’s Downloads</p>
                      <p className="mt-1 text-sm">
                        {device === "windows" && <>Press <kbd className="rounded border px-1.5 py-0.5 font-semibold">Ctrl+J</kbd> to open Downloads in Chrome or Edge.</>}
                        {device === "iphone" && "In Safari, tap the Downloads arrow near the address bar, then tap Downloads."}
                        {device === "android" && "In Chrome, open the three-dot menu and tap Downloads."}
                        {device === "mac" && "Open Downloads from your browser’s toolbar or menu."}
                      </p>
                      {downloadRequested && <p className="mt-2 text-sm">If the transfer failed or never started, select Try download again.</p>}
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-800">
                    <p className="font-semibold">{errorMessage}</p>
                    {offlineStatus === "failed" && <p className="mt-1 text-sm">Your saved edits are still available. Select Retry Video Preparation to try again.</p>}
                  </div>
                )}

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
                <p className="mt-2 text-sm text-stone-600">Large MP4 files can exceed email attachment limits. If someone needs an offline copy, give them the MP4 on a USB drive or ask which file-transfer service they accept.</p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9d1c1] bg-white">
            <button type="button" className={choiceClass} aria-expanded={openChoice === "funeral"} aria-controls="celebration-funeral-panel" onClick={() => toggle("funeral")}>
              <span><span className="block text-lg font-bold text-[#173a31]">Share with a Funeral Home</span><span className="block text-sm text-stone-600">Help the funeral director prepare ahead of time</span></span>
              <span aria-hidden="true" className="text-xl text-[#244f40]">{openChoice === "funeral" ? "−" : "+"}</span>
            </button>
            {openChoice === "funeral" && (
              <div id="celebration-funeral-panel" className={panelClass}>
                <p>We recommend contacting the funeral home before the service and asking whether the venue has reliable internet.</p>
                <details className="mt-3 rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">Yes, they have internet</summary><p className="mt-2 text-sm">Choose Watch or Share Online, then select Copy Viewing Link. Paste that link into an email to the funeral director and ask them to test playback and sound.</p></details>
                <details className="mt-3 rounded-xl border border-stone-200 p-3"><summary className="cursor-pointer font-semibold">No, they need an offline copy</summary><p className="mt-2 text-sm">Download the MP4 under Save for Offline Viewing. Deliver it on a USB drive or use a file-transfer service the funeral home accepts. Ask the funeral director to test the file and sound on the equipment they’ll use at the service.</p></details>
                <p className="mt-3 text-sm text-stone-600">Keep your private editing link for your own use.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
