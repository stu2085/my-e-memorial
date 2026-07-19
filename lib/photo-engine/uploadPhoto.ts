import { optimizeImage } from "../../app/lib/optimizeImage";
import { PhotoUploadError } from "./PhotoUploadError";
import { uploadToSupabase } from "./uploadToSupabase";

type UploadPhotoOptions = {
  file: File;
  folder: string;
  bucket?: string;
  optimize?: boolean;
  onStatusChange?: (
    status: "optimizing" | "uploading" | "completed"
  ) => void;
};

export async function uploadPhoto({
  file,
  folder,
  bucket = "memorial-photos",
  optimize = true,
  onStatusChange,
}: UploadPhotoOptions): Promise<string> {
  let fileToUpload = file;

  if (!file.type.startsWith("image/")) {
    throw new PhotoUploadError("This file is not an image.", {
      reason: "invalid-file",
      retryable: false,
    });
  }

  if (optimize) {
    onStatusChange?.("optimizing");

    try {
      fileToUpload = await optimizeImage(file);
    } catch (error) {
      throw new PhotoUploadError(
        error instanceof Error
          ? error.message
          : `"${file.name}" could not be processed.`,
        {
          reason: "optimization-failed",
          retryable: false,
          cause: error,
        }
      );
    }
  }

  onStatusChange?.("uploading");

  try {
    const publicUrl = await uploadToSupabase({
      file: fileToUpload,
      folder,
      bucket,
    });

    onStatusChange?.("completed");

    return publicUrl;
  } catch (error) {
    throw new PhotoUploadError(
      error instanceof Error
        ? error.message
        : `"${file.name}" could not be uploaded.`,
      {
        reason: "upload-failed",
        retryable: true,
        cause: error,
      }
    );
  }
}