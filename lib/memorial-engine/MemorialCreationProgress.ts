export type MemorialCreationStage =
  | "idle"
  | "validating"
  | "preparing"
  | "uploading-photos"
  | "uploading-videos"
  | "uploading-audio"
  | "saving-memorial"
  | "complete"
  | "failed";

export type MemorialCreationProgress = {
  stage: MemorialCreationStage;
  percentComplete: number;
  message: string;
  currentItem?: string;
  completedItems?: number;
  totalItems?: number;
};

export const initialMemorialCreationProgress: MemorialCreationProgress = {
  stage: "idle",
  percentComplete: 0,
  message: "",
};