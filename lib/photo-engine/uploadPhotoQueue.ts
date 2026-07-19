import {
  calculateUploadProgress,
  type UploadProgress,
} from "./uploadProgress";
import {
  isPhotoUploadError,
  type PhotoUploadErrorReason,
} from "./PhotoUploadError";

export type PhotoQueueStatus =
  | "waiting"
  | "optimizing"
  | "uploading"
  | "retrying"
  | "completed"
  | "failed";

export type PhotoQueueItem = {
  file: File;
  index: number;
  status: PhotoQueueStatus;
  url?: string;
  error?: string;
  errorReason?: PhotoUploadErrorReason;
  retryable?: boolean;
  retryCount: number;
  maxRetries: number;
};

type UploadPhotoQueueOptions = {
  files: File[];
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  uploadPhoto: (
    file: File,
    index: number,
    updateStatus: (status: PhotoQueueStatus) => void
  ) => Promise<string>;
  onProgress?: (
    items: PhotoQueueItem[],
    progress: UploadProgress
  ) => void;
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export async function uploadPhotoQueue({
  files,
  concurrency = 3,
  maxRetries = 2,
  retryDelayMs = 1000,
  uploadPhoto,
  onProgress,
}: UploadPhotoQueueOptions): Promise<PhotoQueueItem[]> {
  const safeMaxRetries = Number.isFinite(maxRetries)
    ? Math.max(0, Math.floor(maxRetries))
    : 2;

  const safeRetryDelay = Number.isFinite(retryDelayMs)
    ? Math.max(0, Math.floor(retryDelayMs))
    : 1000;

  const items: PhotoQueueItem[] = files.map((file, index) => ({
    file,
    index,
    status: "waiting",
    retryCount: 0,
    maxRetries: safeMaxRetries,
  }));

  let nextIndex = 0;

  function reportProgress() {
    const itemSnapshot = items.map((item) => ({ ...item }));
    const progress = calculateUploadProgress(itemSnapshot);

    onProgress?.(itemSnapshot, progress);
  }

  async function processItem(item: PhotoQueueItem): Promise<void> {
    while (true) {
      item.error = undefined;
      item.errorReason = undefined;
      item.retryable = undefined;

      try {
        item.url = await uploadPhoto(
          item.file,
          item.index,
          (status) => {
            item.status = status;
            reportProgress();
          }
        );

        item.status = "completed";
        reportProgress();
        return;
      } catch (error) {
        const retryable =
          isPhotoUploadError(error) && error.retryable;

        item.error =
          error instanceof Error
            ? error.message
            : "Photo upload failed.";

        item.errorReason = isPhotoUploadError(error)
          ? error.reason
          : undefined;

        item.retryable = retryable;

        if (retryable && item.retryCount < item.maxRetries) {
          item.retryCount += 1;
          item.status = "retrying";
          reportProgress();

          await wait(safeRetryDelay * item.retryCount);
          continue;
        }

        item.status = "failed";
        reportProgress();
        return;
      }
    }
  }

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;

      if (currentIndex >= items.length) {
        return;
      }

      nextIndex += 1;

      const item = items[currentIndex];

      item.status = "optimizing";
      reportProgress();

      await processItem(item);
    }
  }

  if (items.length === 0) {
    reportProgress();
    return items;
  }

  const safeConcurrency = Number.isFinite(concurrency)
    ? Math.max(1, Math.floor(concurrency))
    : 3;

  const workerCount = Math.min(safeConcurrency, items.length);

  reportProgress();

  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  );

  return items;
}