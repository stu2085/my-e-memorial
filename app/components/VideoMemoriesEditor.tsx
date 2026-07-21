import ExistingVideoList from "./ExistingVideoList";
import QuickSaveButton from "./QuickSaveButton";

type VideoMemoriesEditorProps = {
  existingVideos: any[];
  videoNotes: string[];
  previewVideoId: string | null;
  setPreviewVideoId: (value: string | null) => void;
  setVideoNotes: React.Dispatch<React.SetStateAction<string[]>>;
  handleMoveExistingVideo: (index: number, direction: "up" | "down") => void;
  handleRemoveExistingVideo: (videoId: string) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function VideoMemoriesEditor({
  existingVideos,
  videoNotes,
  previewVideoId,
  setPreviewVideoId,
  setVideoNotes,
  handleMoveExistingVideo,
  handleRemoveExistingVideo,
  isSaving,
  isPublished,
}: VideoMemoriesEditorProps) {
  return (
    <>
      <ExistingVideoList
        existingVideos={existingVideos}
        videoNotes={videoNotes}
        previewVideoId={previewVideoId}
        onPreviewVideo={setPreviewVideoId}
        onVideoNoteChange={(index, note) => {
          const updated = [...videoNotes];
          updated[index] = note;
          setVideoNotes(updated);
        }}
        onMoveVideo={handleMoveExistingVideo}
        onRemoveVideo={(videoId) => {
          handleRemoveExistingVideo(videoId);
        }}
      />

      <QuickSaveButton
  sectionId="video-memories"
  isSaving={isSaving}
  isPublished={isPublished}
/>
    </>
  );
}