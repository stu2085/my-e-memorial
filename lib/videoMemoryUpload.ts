import { getVideoDuration } from "./videoMemoryUtils";

export type UploadedVideoMemory = {
  playbackId: string;
  durationSeconds: number;
  note: string;
  originalFilename: string;
  fileSize: number;
};

type UploadVideosArgs = {
  videoFiles: File[];
  videoNotes: string[];
  maxVideoSizeBytes: number;
  onError: (message: string) => void;
};

export async function uploadVideoMemories({
  videoFiles,
  videoNotes,
  maxVideoSizeBytes,
  onError,
}: UploadVideosArgs): Promise<UploadedVideoMemory[]> {
  if (videoFiles.length === 0) return [];

  const uploadedVideos: UploadedVideoMemory[] = [];

  for (const file of videoFiles) {
    try {
      if (file.size > maxVideoSizeBytes) {
        throw new Error(
          `"${file.name}" is too large. Maximum video size is 1 GB.`
        );
      }

      const uploadRes = await fetch("/api/mux-upload", {
        method: "POST",
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("MUX UPLOAD API ERROR:", errorText);
        throw new Error("Could not create Mux upload URL.");
      }

      const uploadText = await uploadRes.text();

      if (!uploadText) {
        throw new Error("Mux upload API returned empty response.");
      }

      const { uploadUrl, uploadId } = JSON.parse(uploadText);

      const muxRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!muxRes.ok) {
        throw new Error(`Mux upload failed for ${file.name}`);
      }

      let playbackId = "";

      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const playbackRes = await fetch("/api/mux-playback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploadId }),
        });

        const playbackData = await playbackRes.json();

        if (playbackData.playbackId) {
          playbackId = playbackData.playbackId;
          break;
        }
      }

      if (!playbackId) {
        throw new Error(
          `"${file.name}" uploaded to Mux, but Mux did not return a playback ID yet. Please wait a minute and try again.`
        );
      }

      const duration = await getVideoDuration(file);
      const videoIndex = videoFiles.indexOf(file);

      uploadedVideos.push({
        playbackId,
        durationSeconds: Math.round(duration),
        note: videoNotes[videoIndex] || "",
        originalFilename: file.name,
        fileSize: file.size,
      });
    } catch (err) {
      console.error("VIDEO UPLOAD ERROR:", err);
      onError("One or more videos failed to upload.");
    }
  }

  return uploadedVideos;
}