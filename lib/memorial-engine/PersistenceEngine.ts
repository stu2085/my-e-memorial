import { supabase } from "../../app/lib/supabase";
import type { MemorialCreationResult } from "./MemorialCreationResult";

type MemorialInsertData = Record<string, unknown>;

type CreateMemorialOptions = {
  slug: string;
  memorialData: MemorialInsertData;
};
type MemorialVideoInsert = {
  playbackId: string;
  durationSeconds: number;
  note: string;
  originalFilename: string;
  fileSize: number;
};
type MemorialFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  maidenName: string;
  nickname: string;
  gender: string;
  birthDate: string;
  deathDate: string;
  obituary: string;
  obituaryUrl: string;
  lifeStory: string;
  greatGrandparentsNames: string;
  grandparentsFatherSide: string;
  grandparentsMotherSide: string;
  parentsNames: string;
  siblingsNames: string;
  cemeteryName: string;
  graveSection: string;
  graveRow: string;
  gravePlot: string;
  graveLat: string;
  graveLng: string;
  graveDirections: string;
  mapStreet: string;
  mapCity: string;
  mapState: string;
  mapZip: string;
  mapCountry: string;
  placesLived: string;
  placesWorked: string;
  schoolsAttended: string;
  awardsWon: string;
  socialLink1: string;
  socialLink2: string;
  socialLink3: string;
  socialLink4: string;
  socialLink5: string;
  finalRestingType: string;
  ashesLocationDescription: string;
  backupPersonName: string;
  backupEmail: string;
  backupPassword: string;
  backupStreet: string;
  backupCity: string;
  backupState: string;
  backupZip: string;
  creatorStreet: string;
  creatorCity: string;
  creatorState: string;
  creatorZip: string;
  betaCode: string;
  promotionCategory: string;
  isLivingPreplan: boolean;
};

type BuildMemorialDataOptions = {
  slug: string;
  form: MemorialFormData;
  fullName: string;
  ownerId: string | null;
  selectedPlan: string;
  requiresReview: boolean;
  usingBetaCode: boolean;
  featuredPhotoUrl: string;
  headstonePhoto1Url: string;
  headstonePhoto2Url: string;
  galleryPhotoUrls: string[];
  favoriteSongUrl: string;
  uploadedVideos: Array<{
    playbackId: string;
    note: string;
  }>;
};
export class PersistenceEngine {
  static buildMemorialData({
  slug,
  form,
  fullName,
  ownerId,
  selectedPlan,
  requiresReview,
  usingBetaCode,
  featuredPhotoUrl,
  headstonePhoto1Url,
  headstonePhoto2Url,
  galleryPhotoUrls,
  favoriteSongUrl,
  uploadedVideos,
}: BuildMemorialDataOptions): MemorialInsertData {
  return {
    slug,
    full_name: fullName,
    first_name: form.firstName,
    middle_name: form.middleName,
    last_name: form.lastName,
    owner_id: ownerId,
    backup_email: form.backupEmail,
    backup_password: form.backupPassword,
    backup_street: form.backupStreet,
    backup_city: form.backupCity,
    backup_state: form.backupState,
    backup_zip: form.backupZip,
    creator_street: form.creatorStreet,
    creator_city: form.creatorCity,
    creator_state: form.creatorState,
    creator_zip: form.creatorZip,
    maiden_name: form.maidenName,
    nickname: form.nickname,
    gender: form.gender,
    plan: selectedPlan,
    is_living_preplan: form.isLivingPreplan,
    is_published:
      form.isLivingPreplan || requiresReview ? false : true,
    needs_review: requiresReview,
    birth_date: form.birthDate || null,
    death_date: form.deathDate || null,
    obituary: form.obituary,
    obituary_url: form.obituaryUrl,
    life_story: form.lifeStory,
    great_grandparents_names: form.greatGrandparentsNames,
    grandparents_father_side: form.grandparentsFatherSide,
    grandparents_mother_side: form.grandparentsMotherSide,
    parents_names: form.parentsNames,
    siblings_names: form.siblingsNames,
    cemetery_name: form.cemeteryName,
    grave_section: form.graveSection,
    grave_row: form.graveRow,
    grave_plot: form.gravePlot,
    grave_lat: form.graveLat ? Number(form.graveLat) : null,
    grave_lng: form.graveLng ? Number(form.graveLng) : null,
    grave_directions: form.graveDirections,
    map_street: form.mapStreet,
    map_city: form.mapCity,
    map_state: form.mapState,
    map_zip: form.mapZip,
    map_country: form.mapCountry,
    places_lived: form.placesLived,
    places_worked: form.placesWorked,
    schools_attended: form.schoolsAttended,
    awards_won: form.awardsWon,
    social_link_1: form.socialLink1,
    social_link_2: form.socialLink2,
    social_link_3: form.socialLink3,
    social_link_4: form.socialLink4,
    social_link_5: form.socialLink5,
    featured_photo_url: featuredPhotoUrl,
    headstone_photo_1: headstonePhoto1Url,
    headstone_photo_2: headstonePhoto2Url,
    gallery_photos: galleryPhotoUrls.join(","),
    favorite_song_url: favoriteSongUrl,
    video_urls: uploadedVideos.map((video) => video.playbackId),
    video_notes: uploadedVideos.map((video) => video.note),
    final_resting_type: form.finalRestingType,
    ashes_location_description: form.ashesLocationDescription,
    backup_person_name: form.backupPersonName,
    payment_status: usingBetaCode ? "free_beta" : "paid",
    payment_source: usingBetaCode ? "beta_code" : "stripe",
    beta_code_used: usingBetaCode
      ? form.betaCode.trim().toUpperCase()
      : null,
    promotion_category: usingBetaCode
      ? form.promotionCategory
      : null,
  };
}
  static async createMemorial({
    slug,
    memorialData,
  }: CreateMemorialOptions): Promise<MemorialCreationResult> {
    const { data: createdMemorial, error } = await supabase
      .from("memorials")
      .insert(memorialData)
      .select("id")
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);

      return {
        success: false,
        slug,
        error: error.message,
      };
    }

    if (!createdMemorial) {
      return {
        success: false,
        slug,
        error: "The memorial was not created.",
      };
    }

    return {
      success: true,
      slug,
      memorialId: createdMemorial.id,
    };
  }
  static async createMemorialVideos({
  memorialId,
  videos,
}: {
  memorialId: number;
  videos: MemorialVideoInsert[];
}): Promise<void> {
  if (videos.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("memorial_videos")
    .insert(
      videos.map((video, index) => ({
        memorial_id: memorialId,
        playback_id: video.playbackId,
        duration_seconds: video.durationSeconds,
        note: video.note,
        sort_order: index,
        original_filename: video.originalFilename,
        file_size: video.fileSize,
        processing_status: "ready",
      }))
    );

  if (error) {
    console.error("VIDEO INSERT ERROR:", error);
    throw new Error(error.message);
  }
}static async incrementPromoCodeUsage(code: string): Promise<void> {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return;
  }

  const { data: promoCode, error: promoLookupError } = await supabase
    .from("promo_codes")
    .select("id, uses_count")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (promoLookupError) {
    console.error("PROMO CODE LOOKUP ERROR:", promoLookupError);
    throw new Error(promoLookupError.message);
  }

  if (!promoCode) {
    return;
  }

  const { error: promoUpdateError } = await supabase
    .from("promo_codes")
    .update({
      uses_count: Number(promoCode.uses_count || 0) + 1,
    })
    .eq("id", promoCode.id);

  if (promoUpdateError) {
    console.error("PROMO CODE UPDATE ERROR:", promoUpdateError);
    throw new Error(promoUpdateError.message);
  }
}
}