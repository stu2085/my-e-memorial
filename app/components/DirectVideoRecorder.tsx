"use client";

import { useEffect, useRef, useState } from "react";

type DirectVideoRecorderProps = {
  onRecorded: (
    file: File,
    durationSeconds: number
  ) => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
};

const MAX_RECORDING_SECONDS = 300;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";

  const preferredTypes = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return (
    preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ""
  );
}

export default function DirectVideoRecorder({
  onRecorded,
  disabled = false,
}: DirectVideoRecorderProps) {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingSecondsRef = useRef(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopMediaStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }

    setCameraActive(false);
  }

  useEffect(() => {
    return () => {
      clearTimer();
      stopMediaStream();
    };
  }, []);
useEffect(() => {
  if (!cameraActive || !previewRef.current || !streamRef.current) {
    return;
  }

  previewRef.current.srcObject = streamRef.current;
  previewRef.current.muted = true;

  previewRef.current.play().catch(() => {
    // Browser may require another user interaction.
  });
}, [cameraActive]);
  async function startCamera() {
    setError("");
    setMessage("");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "Camera recording is not supported by this browser or device."
      );
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setError("Video recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = stream;

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;

        await previewRef.current.play().catch(() => {
          // Some browsers wait for another user interaction.
        });
      }

      setCameraActive(true);
      setMessage("Camera and microphone are ready.");
    } catch (err) {
      console.error("CAMERA ACCESS ERROR:", err);

      setError(
        "Could not access the camera and microphone. Please allow camera and microphone permission and try again."
      );
    }
  }

  function startRecording() {
    setError("");
    setMessage("");

    const stream = streamRef.current;

    if (!stream) {
      setError("Start the camera before recording.");
      return;
    }

    try {
      chunksRef.current = [];
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MEDIA RECORDER ERROR:", event);
        clearTimer();
        setIsRecording(false);
        setError("There was a problem recording the video.");
      };

      recorder.onstop = async () => {
        clearTimer();
        setIsRecording(false);

        const actualDuration = recordingSecondsRef.current;

        if (chunksRef.current.length === 0) {
          setError("No video was recorded.");
          return;
        }

        const finalMimeType =
          recorder.mimeType || mimeType || "video/webm";

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        if (blob.size === 0) {
          setError("The recording was empty. Please try again.");
          return;
        }

        const extension = finalMimeType.includes("mp4") ? "mp4" : "webm";

        const file = new File(
          [blob],
          `recorded-memory-${Date.now()}.${extension}`,
          {
            type: finalMimeType,
            lastModified: Date.now(),
          }
        );

        try {
          const accepted = await onRecorded(
            file,
            actualDuration
          );

          if (accepted === false) {
            setMessage("");
            return;
          }

          setMessage(
            "Recording added to Video Memories. Use Save & Continue when you are ready to upload it."
          );
        } catch (err) {
          console.error("RECORDED VIDEO ADD ERROR:", err);
          setMessage("");
          setError(
            "The recording was created, but it could not be added to Video Memories."
          );
        }
      };

      recorder.start(1000);

      setIsRecording(true);
      setMessage("Recording...");

      timerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;

        const nextSeconds = recordingSecondsRef.current;
        setRecordingSeconds(nextSeconds);

        if (nextSeconds >= MAX_RECORDING_SECONDS) {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);
    } catch (err) {
      console.error("START RECORDING ERROR:", err);
      setError("Could not start video recording.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function closeCamera() {
    if (isRecording) {
      stopRecording();
    }

    clearTimer();
    stopMediaStream();
    setMessage("");
  }

  return (
    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div>
        <p className="text-lg font-bold text-stone-900">
          Record a Video Memory
        </p>

        <p className="mt-1 text-sm leading-6 text-stone-600">
          Use your phone, tablet, or computer camera and microphone to record
          a memory directly. Each recording can be up to 5 minutes.
        </p>
      </div>

      {!cameraActive ? (
        <button
          type="button"
          onClick={startCamera}
          disabled={disabled}
          className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🎥 Open Camera & Microphone
        </button>
      ) : (
        <div className="mt-4">
          <div className="overflow-hidden rounded-2xl bg-black">
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                ● Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
              >
                ■ Stop Recording
              </button>
            )}

            <button
              type="button"
              onClick={closeCamera}
              disabled={isRecording}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close Camera
            </button>

            {isRecording && (
              <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
                ● REC {formatTime(recordingSeconds)} / 5:00
              </div>
            )}
          </div>
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm font-medium text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}