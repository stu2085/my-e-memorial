"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type CameraPhotoCaptureProps = {
  open: boolean;
  onClose: () => void;
  onUsePhoto: (file: File) => Promise<void> | void;
};

export default function CameraPhotoCapture({
  open,
  onClose,
  onUsePhoto,
}: CameraPhotoCaptureProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const previewUrlRef =
    useRef<string>("");

  const [cameraReady, setCameraReady] =
    useState(false);

  const [capturedFile, setCapturedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  function stopCamera() {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    streamRef.current = null;
    setCameraReady(false);
  }

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );
    }

    previewUrlRef.current = "";
    setPreviewUrl("");
    setCapturedFile(null);
  }

  async function startCamera() {
    try {
      setErrorMessage("");
      setCameraReady(false);

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          "Camera access is not available in this browser."
        );
      }

      stopCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 3840,
            },
            height: {
              ideal: 2160,
            },
          },
        });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error(
          "The camera could not be opened."
        );
      }

      video.srcObject = stream;

      await video.play();

      setCameraReady(true);
    } catch (error) {
      stopCamera();

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The camera could not be opened."
      );
    }
  }

  useEffect(() => {
    if (!open) {
      stopCamera();
      clearPreview();
      setErrorMessage("");
      setSaving(false);
      return;
    }

    void startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      stopCamera();
      clearPreview();
    };
  }, []);

  async function capturePhoto() {
    const stream = streamRef.current;
    const video = videoRef.current;

    if (
      !stream ||
      !video ||
      !cameraReady
    ) {
      return;
    }

    try {
      setErrorMessage("");

      const [track] =
        stream.getVideoTracks();

      if (!track) {
        throw new Error(
          "The camera is not ready."
        );
      }

      let blob: Blob | null = null;

      const ImageCaptureConstructor =
        (window as unknown as {
          ImageCapture?: new (
            track: MediaStreamTrack
          ) => {
            takePhoto: () => Promise<Blob>;
          };
        }).ImageCapture;

      if (ImageCaptureConstructor) {
        try {
          const imageCapture =
            new ImageCaptureConstructor(
              track
            );

          blob =
            await imageCapture.takePhoto();
        } catch {
          blob = null;
        }
      }

      if (!blob) {
        const width =
          video.videoWidth || 1920;

        const height =
          video.videoHeight || 1080;

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "The photo could not be captured."
          );
        }

        context.drawImage(
          video,
          0,
          0,
          width,
          height
        );

        blob =
          await new Promise<Blob | null>(
            (resolve) => {
              canvas.toBlob(
                resolve,
                "image/jpeg",
                0.95
              );
            }
          );
      }

      if (!blob) {
        throw new Error(
          "The photo could not be captured."
        );
      }

      clearPreview();

      const extension =
        blob.type === "image/png"
          ? "png"
          : "jpg";

      const file = new File(
        [blob],
        `camera-photo-${Date.now()}.${extension}`,
        {
          type:
            blob.type ||
            "image/jpeg",
        }
      );

      const url =
        URL.createObjectURL(file);

      previewUrlRef.current = url;

      setCapturedFile(file);
      setPreviewUrl(url);

      stopCamera();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The photo could not be captured."
      );
    }
  }

  async function retakePhoto() {
    clearPreview();
    await startCamera();
  }

  async function usePhoto() {
    if (!capturedFile) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await onUsePhoto(
        capturedFile
      );

      stopCamera();
      clearPreview();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The photo could not be added."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeCamera() {
    stopCamera();
    clearPreview();
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
            Take a Photo
          </h2>

          <button
            type="button"
            onClick={closeCamera}
            className="min-h-11 rounded-full border border-white/40 px-5 py-2 text-base font-bold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <p className="mt-3 text-center text-base font-semibold text-stone-200">
          Place the photo inside the frame
        </p>

        <div className="mt-4 flex flex-1 items-center justify-center">
          <div className="w-full overflow-hidden rounded-3xl border border-white/20 bg-stone-950">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Captured photo preview"
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            )}
          </div>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-red-950/70 px-4 py-3 text-center text-base font-semibold text-red-100"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-3 pb-3">
          {!previewUrl ? (
            <button
              type="button"
              onClick={() =>
                void capturePhoto()
              }
              disabled={
                !cameraReady
              }
              className="min-h-14 min-w-48 rounded-full bg-white px-7 py-4 text-lg font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Take Photo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  void retakePhoto()
                }
                disabled={saving}
                className="min-h-14 min-w-40 rounded-full border border-white/50 px-6 py-4 text-lg font-bold text-white hover:bg-white/10 disabled:opacity-50"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={() =>
                  void usePhoto()
                }
                disabled={saving}
                className="min-h-14 min-w-40 rounded-full bg-white px-6 py-4 text-lg font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Adding..."
                  : "Use Photo"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
