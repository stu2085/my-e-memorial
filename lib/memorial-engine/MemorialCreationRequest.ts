import type { GalleryPhoto } from "../photo-engine/GalleryPhoto";

export type MemorialCreationRequest = {
  slug: string;

  form: unknown;

  featuredPhoto: File | null;

  headstonePhoto1: File | null;

  headstonePhoto2: File | null;

  galleryPhotos: GalleryPhoto[];

  favoriteSongFile: File | null;

  videoFiles: File[];

  videoNotes: string[];
};