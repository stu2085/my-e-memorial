export type PhotoUploadErrorReason =
  | "invalid-file"
  | "optimization-failed"
  | "upload-failed";

type PhotoUploadErrorOptions = {
  reason: PhotoUploadErrorReason;
  retryable: boolean;
  cause?: unknown;
};

export class PhotoUploadError extends Error {
  reason: PhotoUploadErrorReason;
  retryable: boolean;
  cause?: unknown;

  constructor(
    message: string,
    {
      reason,
      retryable,
      cause,
    }: PhotoUploadErrorOptions
  ) {
    super(message);

    this.name = "PhotoUploadError";
    this.reason = reason;
    this.retryable = retryable;
    this.cause = cause;

    Object.setPrototypeOf(this, PhotoUploadError.prototype);
  }
}

export function isPhotoUploadError(
  error: unknown
): error is PhotoUploadError {
  return error instanceof PhotoUploadError;
}