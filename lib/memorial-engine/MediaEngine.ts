
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../app/lib/supabase";

import type { GalleryPhoto } from "../photo-engine/GalleryPhoto";
import { uploadPhoto } from "../photo-engine/uploadPhoto";
import { uploadToSupabase } from "../photo-engine/uploadToSupabase";
import {
  uploadPhotoQueue,
  type PhotoQueueItem,
} from "../photo-engine/uploadPhotoQueue";
import type { UploadProgress } from "../photo-engine/uploadProgress";

type UploadGalleryPhotosOptions = {
  photos: GalleryPhoto[];
  slug: string;
  setGalleryPhotos: Dispatch<SetStateAction<GalleryPhoto[]>>;
  setGalleryUploadProgress: Dispatch<
    SetStateAction<UploadProgress | null>
  >;
  setIsGalleryUploading: Dispatch<SetStateAction<boolean>>;
};
export type UploadedVideo = {
  playbackId: string;
  durationSeconds: number;
  note: string;
  originalFilename: string;
  fileSize: number;
};

type UploadVideosOptions = {
  videoFiles: File[];
  videoNotes: string[];
  maxVideoSizeBytes?: number;
  maxVideoDurationSeconds?: number;
  memorialId?: number | null;
};
export const MediaEngine = {
  async uploadSelectedGalleryPhotos({
    photos,
    slug,
    setGalleryPhotos,
    setGalleryUploadProgress,
    setIsGalleryUploading,
  }: UploadGalleryPhotosOptions): Promise<string[]> {
    if (photos.length === 0) {
      return [];
    }

    setIsGalleryUploading(true);
    setGalleryUploadProgress(null);

    const photoIds = photos.map((photo) => photo.id);
    const folder = `${slug}/gallery`;

    try {
      const uploadResults = await uploadPhotoQueue({
        files: photos.map((photo) => photo.file),
        concurrency: 3,
        maxRetries: 2,
        retryDelayMs: 1000,

        uploadPhoto: async (file, _index, updateStatus) => {
          return uploadPhoto({
            file,
            folder,
            bucket: "memorial-photos",
            optimize: true,
            onStatusChange: updateStatus,
          });
        },

        onProgress: (
          items: PhotoQueueItem[],
          progress: UploadProgress
        ) => {
          setGalleryUploadProgress(progress);

          setGalleryPhotos((currentPhotos) =>
            currentPhotos.map((photo) => {
              const batchIndex = photoIds.indexOf(photo.id);

              if (batchIndex === -1) {
                return photo;
              }

              const queueItem = items[batchIndex];

              if (!queueItem) {
                return photo;
              }

              return {
                ...photo,
                status: queueItem.status,
                uploadedUrl: queueItem.url,
                error: queueItem.error,
                errorReason: queueItem.errorReason,
                retryable: queueItem.retryable,
                retryCount: queueItem.retryCount,
                maxRetries: queueItem.maxRetries,
              };
            })
          );
        },
      });

      const failedUploads = uploadResults.filter(
        (item) => item.status === "failed"
      );

      if (failedUploads.length > 0) {
        throw new Error(
          `${failedUploads.length} gallery photo${
            failedUploads.length === 1 ? "" : "s"
          } could not be uploaded. Please try again.`
        );
      }

      const uploadedUrls = uploadResults.map((item) => item.url);

      if (uploadedUrls.some((url) => !url)) {
        throw new Error(
          "One or more gallery photos did not return an uploaded URL."
        );
      }

      return uploadedUrls as string[];
    } catch (error) {
      console.error("GALLERY UPLOAD FAILED", error);

      throw error instanceof Error
        ? error
        : new Error("Gallery photos could not be uploaded.");
    } finally {
      setIsGalleryUploading(false);
    }
   },

  async uploadFile(
  file: File,
  folder: string,
  bucket: string,
  shouldOptimize = true
): Promise<string> {
  if (file.type.startsWith("image/")) {
    return uploadPhoto({
      file,
      folder,
      bucket,
      optimize: bucket === "memorial-photos" && shouldOptimize,
    });
  }

  return uploadToSupabase({
    file,
    folder,
    bucket,
  });
},

  getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);

        if (!Number.isFinite(video.duration) || video.duration <= 0) {
          reject(
            new Error(`Could not read video duration for ${file.name}`)
          );
          return;
        }

        resolve(video.duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(`Could not read video duration for ${file.name}`)
        );
      };

      video.src = url;
      video.load();
    });
  },
    async uploadVideos({
    videoFiles,
    videoNotes,
    maxVideoSizeBytes = 1000 * 1000 * 1000,
    maxVideoDurationSeconds = 300,
    memorialId = null,
  }: UploadVideosOptions): Promise<UploadedVideo[]> {
    if (videoFiles.length === 0) {
      return [];
    }

    /*
     * #14 Step 6:
     * Logged-in owners authenticate Mux API requests with
     * their Supabase access token. Backup Person requests
     * use the hardened httpOnly backup cookie plus the
     * memorial ID.
     *
     * Existing callers do not all pass memorialId yet, so
     * Backup Person edit/draft routes may resolve it from
     * the current URL without requiring changes to the
     * large create page.
     */
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let resolvedMemorialId =
      Number(memorialId) > 0 ? Number(memorialId) : null;

    if (
      !resolvedMemorialId &&
      typeof window !== "undefined"
    ) {
      const params = new URLSearchParams(
        window.location.search
      );

      const urlMemorialId = Number(
        params.get("edit") ||
          params.get("draft") ||
          params.get("memorialId") ||
          0
      );

      if (
        Number.isFinite(urlMemorialId) &&
        urlMemorialId > 0
      ) {
        resolvedMemorialId = urlMemorialId;
      }
    }

    const muxHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      muxHeaders.Authorization =
        `Bearer ${session.access_token}`;
    }

    const oversizedFile = videoFiles.find(
      (file) => file.size > maxVideoSizeBytes
    );

    if (oversizedFile) {
      throw new Error(
        `"${oversizedFile.name}" is too large. Maximum video size is 1 GB.`
      );
    }

    const uploadedVideos: UploadedVideo[] = [];

    for (let index = 0; index < videoFiles.length; index++) {
      const file = videoFiles[index];
      const duration = await MediaEngine.getVideoDuration(file);

      if (duration > maxVideoDurationSeconds) {
        throw new Error(
          `"${file.name}" is longer than 5 minutes. Please remove it before saving.`
        );
      }

      const uploadRes = await fetch("/api/mux-upload", {
        method: "POST",
        headers: muxHeaders,
        credentials: "include",
        body: JSON.stringify({
          memorialId: resolvedMemorialId,
        }),
      });

      const uploadData = await uploadRes.json();

      if (
        !uploadRes.ok ||
        !uploadData.uploadUrl ||
        !uploadData.uploadId
      ) {
        throw new Error(
          uploadData.error || "Could not create Mux upload."
        );
      }

      const putRes = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!putRes.ok) {
        throw new Error(`Mux upload failed for ${file.name}.`);
      }

      const playbackRes = await fetch("/api/mux-playback", {
        method: "POST",
        headers: muxHeaders,
        credentials: "include",
        body: JSON.stringify({
          uploadId: uploadData.uploadId,
          memorialId: resolvedMemorialId,
        }),
      });

      const playbackData = await playbackRes.json();

      if (!playbackRes.ok) {
        throw new Error(
          playbackData.error ||
            `Could not obtain video playback information for ${file.name}.`
        );
      }

      if (!playbackData.playbackId) {
        throw new Error(
          `Mux did not return a playback ID for ${file.name}.`
        );
      }

      uploadedVideos.push({
        playbackId: playbackData.playbackId,
        durationSeconds: Math.round(duration),
        note: videoNotes[index] || "",
        originalFilename: file.name,
        fileSize: file.size,
      });
    }

    return uploadedVideos;
  },
    async uploadOptionalFile(
    file: File | null,
    folder: string,
    bucket: string
  ): Promise<string> {
    if (!file) {
      return "";
    }

    return MediaEngine.uploadFile(file, folder, bucket);
  },
};
