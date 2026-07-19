import type {
  PhotoQueueStatus,
} from "./uploadPhotoQueue";
import type {
  PhotoUploadErrorReason,
} from "./PhotoUploadError";

export type GalleryPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  fingerprint: string;
  status: PhotoQueueStatus;
  caption: string;
  uploadedUrl?: string;
  error?: string;
  errorReason?: PhotoUploadErrorReason;
  retryable?: boolean;
  retryCount: number;
  maxRetries: number;
};

export function createGalleryPhoto(
  file: File,
  fingerprint: string
): GalleryPhoto {
  return {
    id:
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    fingerprint,
    status: "waiting",
    caption: "",
    retryCount: 0,
    maxRetries: 2,
  };
}

export function releaseGalleryPhotoPreview(
  photo: GalleryPhoto
): void {
  if (photo.previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(photo.previewUrl);
  }
}