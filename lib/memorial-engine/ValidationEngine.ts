import type { GalleryPhoto } from "../photo-engine/GalleryPhoto";

type PlanLimits = {
  label: string;
  galleryPhotos: number;
  videoMinutes: number;
};

type ValidateMemorialOptions = {
  firstName: string;
  lastName: string;
  selectedPlan: string;
  planLimits?: PlanLimits;
  isPaid: boolean;
  galleryPhotos: GalleryPhoto[];
};

type ValidateVideosOptions = {
  videoFiles: File[];
  getVideoDuration: (file: File) => Promise<number>;
  maximumVideoMinutes: number;
  planLabel: string;
};

export class ValidationEngine {
  static validateBasicMemorial({
    firstName,
    lastName,
    selectedPlan,
    planLimits,
    isPaid,
    galleryPhotos,
  }: ValidateMemorialOptions): void {
    if (!firstName.trim() || !lastName.trim()) {
      throw new Error(
        "Please enter both a first and last name before continuing."
      );
    }

    if (!selectedPlan) {
      throw new Error(
        "Please choose a memorial plan before continuing."
      );
    }

    if (!planLimits) {
      throw new Error(
        "Please choose a valid memorial plan before continuing."
      );
    }

    if (!isPaid) {
      throw new Error(
        "Please choose a memorial plan and complete payment before your photos, videos, and other media can be uploaded."
      );
    }

    if (galleryPhotos.length > planLimits.galleryPhotos) {
      throw new Error(
        `${planLimits.label} allows up to ${planLimits.galleryPhotos} gallery photos.`
      );
    }
  }

   static async validateVideos({
    videoFiles,
    getVideoDuration,
    maximumVideoMinutes,
    planLabel,
  }: ValidateVideosOptions): Promise<void> {
    let totalVideoSeconds = 0;

    for (const file of videoFiles) {
      totalVideoSeconds += await getVideoDuration(file);

      if (totalVideoSeconds > maximumVideoMinutes * 60) {
        throw new Error(
          `${planLabel} allows up to ${maximumVideoMinutes} minutes of Video Memories.`
        );
      }
    }
  }
}