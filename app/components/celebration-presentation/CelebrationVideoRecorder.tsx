"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type CelebrationVideoRecorderProps = {
  open: boolean;
  onClose: () => void;
  onUseVideo: (
    file: File,
    durationSeconds: number
  ) => Promise<void> | void;
};

const MAX_RECORDING_SECONDS = 300;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${remainder
    .toString()
    .padStart(2, "0")}`;
}

function getSupportedMimeType() {
  if (
    typeof MediaRecorder === "undefined"
  ) {
    return "";
  }

  const preferredTypes = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return (
    preferredTypes.find((type) =>
      MediaRecorder.isTypeSupported(type)
    ) || ""
  );
}

export default function CelebrationVideoRecorder({
  open,
  onClose,
  onUseVideo,
}: CelebrationVideoRecorderProps) {
  const liveVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const recorderRef =
    useRef<MediaRecorder | null>(null);

  const chunksRef =
    useRef<Blob[]>([]);

  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const secondsRef =
    useRef(0);

  const previewUrlRef =
    useRef("");

  const [cameraReady, setCameraReady] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [recordedFile, setRecordedFile] =
    useState<File | null>(null);

  const [recordedDuration, setRecordedDuration] =
    useState(0);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    streamRef.current = null;

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  function clearRecording() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );
    }

    previewUrlRef.current = "";
    setPreviewUrl("");
    setRecordedFile(null);
    setRecordedDuration(0);
    setRecordingSeconds(0);
    secondsRef.current = 0;
  }

  async function startCamera() {
    try {
      setErrorMessage("");
      clearTimer();
      stopStream();

      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error(
          "Video recording is not available in this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "user",
            },
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: true,
        });

      streamRef.current = stream;

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject =
          stream;

        liveVideoRef.current.muted = true;

        await liveVideoRef.current
          .play()
          .catch(() => {
            // Some browsers wait for another gesture.
          });
      }

      setCameraReady(true);
    } catch (error) {
      stopStream();

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The camera and microphone could not be opened."
      );
    }
  }

  useEffect(() => {
    if (!open) {
      clearTimer();
      stopStream();
      clearRecording();
      setRecording(false);
      setErrorMessage("");
      setSaving(false);
      return;
    }

    void startCamera();

    return () => {
      clearTimer();
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      clearRecording();
    };
  }, []);

  function startRecording() {
    const stream = streamRef.current;

    if (!stream) {
      setErrorMessage(
        "The camera is not ready."
      );
      return;
    }

    try {
      setErrorMessage("");
      chunksRef.current = [];
      secondsRef.current = 0;
      setRecordingSeconds(0);

      const mimeType =
        getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onerror = () => {
        clearTimer();
        setRecording(false);
        setErrorMessage(
          "There was a problem recording the video."
        );
      };

      recorder.onstop = () => {
        clearTimer();
        setRecording(false);

        const duration =
          Math.max(
            1,
            secondsRef.current
          );

        if (
          chunksRef.current.length === 0
        ) {
          setErrorMessage(
            "No video was recorded."
          );
          return;
        }

        const finalMimeType =
          recorder.mimeType ||
          mimeType ||
          "video/webm";

        const blob = new Blob(
          chunksRef.current,
          {
            type: finalMimeType,
          }
        );

        if (blob.size === 0) {
          setErrorMessage(
            "The recording was empty. Please try again."
          );
          return;
        }

        const extension =
          finalMimeType.includes("mp4")
            ? "mp4"
            : "webm";

        const file = new File(
          [blob],
          `celebration-video-${Date.now()}.${extension}`,
          {
            type: finalMimeType,
            lastModified: Date.now(),
          }
        );

        const url =
          URL.createObjectURL(file);

        previewUrlRef.current = url;

        setRecordedFile(file);
        setRecordedDuration(duration);
        setPreviewUrl(url);

        stopStream();
      };

      recorder.start(1000);
      setRecording(true);

      timerRef.current = setInterval(
        () => {
          secondsRef.current += 1;

          const next =
            secondsRef.current;

          setRecordingSeconds(next);

          if (
            next >=
              MAX_RECORDING_SECONDS &&
            recorderRef.current
              ?.state === "recording"
          ) {
            recorderRef.current.stop();
          }
        },
        1000
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Recording could not be started."
      );
    }
  }

  function stopRecording() {
    if (
      recorderRef.current?.state ===
      "recording"
    ) {
      recorderRef.current.stop();
    }
  }

  async function retake() {
    clearRecording();
    await startCamera();
  }

  async function useVideo() {
    if (!recordedFile) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await onUseVideo(
        recordedFile,
        recordedDuration
      );

      clearRecording();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The video could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeRecorder() {
    if (recording) {
      stopRecording();
    }

    clearTimer();
    stopStream();
    clearRecording();
    setErrorMessage("");
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black">
      <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 text-white sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">
            Record a Video
          </h2>

          <button
            type="button"
            onClick={closeRecorder}
            disabled={saving}
            className="min-h-11 rounded-full border border-white/40 px-5 py-2 text-base font-bold text-white hover:bg-white/10 disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-1 items-center justify-center">
          <div className="w-full overflow-hidden rounded-3xl border border-white/20 bg-stone-950">
            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                playsInline
                className="mx-auto max-h-[70vh] w-full"
              />
            ) : (
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            )}
          </div>
        </div>

        {recording && (
          <p className="mt-4 text-center text-lg font-bold text-red-300">
            ● REC{" "}
            {formatTime(recordingSeconds)}{" "}
            / 5:00
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-red-950/70 px-4 py-3 text-center text-base font-semibold text-red-100"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-3 pb-3">
          {!previewUrl &&
            !recording && (
              <button
                type="button"
                onClick={startRecording}
                disabled={!cameraReady}
                className="min-h-14 min-w-48 rounded-full bg-red-600 px-7 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Recording
              </button>
            )}

          {recording && (
            <button
              type="button"
              onClick={stopRecording}
              className="min-h-14 min-w-48 rounded-full bg-white px-7 py-4 text-lg font-bold text-stone-950"
            >
              Stop Recording
            </button>
          )}

          {previewUrl && (
            <>
              <button
                type="button"
                onClick={() =>
                  void retake()
                }
                disabled={saving}
                className="min-h-14 min-w-40 rounded-full border border-white/50 px-6 py-4 text-lg font-bold text-white hover:bg-white/10 disabled:opacity-50"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={() =>
                  void useVideo()
                }
                disabled={saving}
                className="min-h-14 min-w-40 rounded-full bg-white px-6 py-4 text-lg font-bold text-stone-950 disabled:opacity-50"
              >
                {saving
                  ? "Adding..."
                  : "Use Video"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
