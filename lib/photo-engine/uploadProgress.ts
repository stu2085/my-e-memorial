import type {
  PhotoQueueItem,
  PhotoQueueStatus,
} from "./uploadPhotoQueue";

export type UploadProgress = {
  total: number;
  waiting: number;
  optimizing: number;
  uploading: number;
  retrying: number;
  completed: number;
  failed: number;
  processed: number;
  percentComplete: number;
  currentFileName?: string;
  currentStatus?: PhotoQueueStatus;
  currentRetryCount?: number;
  currentMaxRetries?: number;
};

export function calculateUploadProgress(
  items: PhotoQueueItem[]
): UploadProgress {
  const progress: UploadProgress = {
    total: items.length,
    waiting: 0,
    optimizing: 0,
    uploading: 0,
    retrying: 0,
    completed: 0,
    failed: 0,
    processed: 0,
    percentComplete: 0,
  };

  for (const item of items) {
    switch (item.status) {
      case "waiting":
        progress.waiting += 1;
        break;

      case "optimizing":
        progress.optimizing += 1;
        progress.currentFileName = item.file.name;
        progress.currentStatus = item.status;
        break;

      case "uploading":
        progress.uploading += 1;
        progress.currentFileName = item.file.name;
        progress.currentStatus = item.status;
        break;

      case "retrying":
        progress.retrying += 1;
        progress.currentFileName = item.file.name;
        progress.currentStatus = item.status;
        progress.currentRetryCount = item.retryCount;
        progress.currentMaxRetries = item.maxRetries;
        break;

      case "completed":
        progress.completed += 1;
        break;

      case "failed":
        progress.failed += 1;
        break;
    }
  }

  progress.processed = progress.completed + progress.failed;

  progress.percentComplete =
    progress.total === 0
      ? 0
      : Math.round((progress.processed / progress.total) * 100);

  return progress;
}