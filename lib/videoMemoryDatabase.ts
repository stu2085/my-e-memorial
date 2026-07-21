import { supabase } from "../app/lib/supabase";

export async function loadMemorialVideos(memorialId: number) {
  return await supabase
    .from("memorial_videos")
    .select(
      "id, memorial_id, playback_id, duration_seconds, note, sort_order, original_filename, file_size, processing_status, created_at"
    )
    .eq("memorial_id", memorialId)
    .order("sort_order", { ascending: true });
}

export async function deleteMemorialVideo(
  memorialId: number,
  playbackId: string
) {
  return await supabase
    .from("memorial_videos")
    .delete()
    .eq("memorial_id", memorialId)
    .eq("playback_id", playbackId)
    .select();
}

export async function updateMemorialVideoOrder(
  memorialId: number,
  playbackId: string,
  sortOrder: number
) {
  return await supabase
    .from("memorial_videos")
    .update({ sort_order: sortOrder })
    .eq("memorial_id", memorialId)
    .eq("playback_id", playbackId);
}
export async function insertMemorialVideos(newVideoRows: any[]) {
  return await supabase
    .from("memorial_videos")
    .insert(newVideoRows);
}
type UploadedVideoMemory = {
  playbackId: string;
  durationSeconds: number;
  note: string;
  originalFilename?: string;
  fileSize?: number;
};

export function buildMemorialVideoRows(
  memorialId: number,
  videos: UploadedVideoMemory[],
  startingSortOrder: number
) {
  return videos.map((video, index) => ({
    memorial_id: memorialId,
    playback_id: video.playbackId,
    duration_seconds: video.durationSeconds,
    note: video.note,
    sort_order: startingSortOrder + index,
    original_filename: video.originalFilename ?? null,
    file_size: video.fileSize ?? null,
    processing_status: "ready",
  }));
}
type ExistingVideoUpdate = {
  playback_id: string;
  note: string;
};

export async function updateMemorialVideoNotes(
  memorialId: number,
  videos: ExistingVideoUpdate[]
) {
  for (const video of videos) {
    const { error } = await supabase
      .from("memorial_videos")
      .update({
        note: video.note,
      })
      .eq("memorial_id", memorialId)
      .eq("playback_id", video.playback_id);

    if (error) {
      return { error };
    }
  }

  return { error: null };
}