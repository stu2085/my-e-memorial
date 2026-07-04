export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Could not read video duration"));
        return;
      }

      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration"));
    };

    video.src = url;
    video.load();
  });
}