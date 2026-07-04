export function reorderVideoMemoryState(
  existingVideos: string[],
  videoNotes: string[],
  index: number,
  direction: "up" | "down"
) {
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= existingVideos.length) {
    return {
      existingVideos,
      videoNotes,
      changed: false,
    };
  }

  const reorderedVideos = [...existingVideos];
  const reorderedNotes = [...videoNotes];

  [reorderedVideos[index], reorderedVideos[targetIndex]] = [
    reorderedVideos[targetIndex],
    reorderedVideos[index],
  ];

  [reorderedNotes[index], reorderedNotes[targetIndex]] = [
    reorderedNotes[targetIndex],
    reorderedNotes[index],
  ];

  return {
    existingVideos: reorderedVideos,
    videoNotes: reorderedNotes,
    changed: true,
  };
}

export function removeVideoMemoryState(
  existingVideos: string[],
  videoNotes: string[],
  videoIdToRemove: string
) {
  return {
    existingVideos: existingVideos.filter(
      (videoId) => videoId !== videoIdToRemove
    ),
    videoNotes: videoNotes.filter(
      (_, index) => existingVideos[index] !== videoIdToRemove
    ),
  };
}