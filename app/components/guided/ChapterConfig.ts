export type MemorialExperienceType =
  | "personal"
  | "memorial"
  | "after-death";

export type GuidedChapterId =
  | "basic-information"
  | "family-history"
  | "life-story"
  | "places-lived"
  | "places-worked"
  | "schools-and-awards"
  | "social-media"
  | "newspaper-articles"
  | "favorite-songs"
  | "photo-gallery"
  | "video-memories"
  | "obituary"
  | "final-resting-place"
  | "backup-person"
  | "review";

export type GuidedChapterAvailability =
  | "all"
  | "personal-only"
  | "memorial-only";

export type GuidedChapter = {
  id: GuidedChapterId;
  title: string;
  personalTitle?: string;
  memorialTitle?: string;
  afterDeathTitle?: string;
  description: string;
  personalDescription?: string;
  memorialDescription?: string;
  afterDeathDescription?: string;
  availability: GuidedChapterAvailability;
};

export const GUIDED_CHAPTERS: GuidedChapter[] = [
 {
  id: "basic-information",
  title: "Every Life Has a Beginning",
  description:
    "Every remarkable life begins somewhere. These simple details become the foundation that future generations will treasure.",

  personalDescription:
    "Every remarkable life begins somewhere. Let's begin preserving the foundation of your story for future generations.",

  memorialDescription:
    "Every remarkable life begins somewhere. Let's begin preserving the foundation of their story so future generations will always know who they were.",

  availability: "all",
},
  {
    id: "family-history",
    title: "Family Roots",
    description: "Every life begins with family.",
    personalDescription:
      "Preserve the family connections that helped shape your life.",
    memorialDescription:
      "Preserve the family connections that helped shape their life.",
    availability: "all",
  },
  {
    id: "life-story",
    title: "Life Story",
    personalTitle: "Your Life Story",
    memorialTitle: "Their Life Story",
    description:
      "Preserve the memories, experiences, and moments that made this life unique.",
    personalDescription:
      "Preserve the memories, experiences, and moments that have made your life unique.",
    memorialDescription:
      "Preserve the memories, experiences, and moments that made their life unique.",
    availability: "all",
  },
  {
    id: "places-lived",
    title: "Places That Shaped a Life",
    description:
      "Preserve the homes, communities, and places connected to this story.",
    personalDescription:
      "Preserve the homes, communities, and places connected to your story.",
    memorialDescription:
      "Preserve the homes, communities, and places connected to their story.",
    availability: "all",
  },
  {
    id: "places-worked",
    title: "Work and Service",
    description:
      "Preserve careers, businesses, military service, and other meaningful work.",
    personalDescription:
      "Preserve your career, service, and the work that has been meaningful to you.",
    memorialDescription:
      "Preserve their career, service, and the work that was meaningful to them.",
    availability: "all",
  },
  {
    id: "schools-and-awards",
    title: "Education and Achievements",
    description:
      "Preserve schools, awards, accomplishments, and important milestones.",
    availability: "all",
  },
  {
    id: "social-media",
    title: "Social Connections",
    description:
      "Add social pages or other online places connected to this life.",
    availability: "all",
  },
  {
    id: "newspaper-articles",
    title: "Newspaper Articles",
    description:
      "Preserve articles, announcements, accomplishments, and moments recorded in print.",
    availability: "all",
  },
  {
    id: "favorite-songs",
    title: "Favorite Music",
    description:
      "Add songs that hold special meaning and bring memories back to life.",
    personalDescription:
      "Add songs that hold special meaning throughout your life.",
    memorialDescription:
      "Add songs that held special meaning throughout their life.",
    availability: "all",
  },
  {
    id: "photo-gallery",
    title: "Photo Memories",
    description:
      "Choose photographs that help tell this story and preserve meaningful moments.",
    personalDescription:
      "Choose photographs that help tell your story and preserve meaningful moments.",
    memorialDescription:
      "Choose photographs that help tell their story and preserve meaningful moments.",
    availability: "all",
  },
  {
    id: "video-memories",
    title: "Video Memories",
    description:
      "Preserve voices, expressions, celebrations, and moments photographs cannot fully capture.",
    availability: "all",
  },
  {
    id: "obituary",
    title: "Obituary",
    description:
      "Preserve the obituary or other written announcement of this life.",
    availability: "memorial-only",
  },
  {
    id: "final-resting-place",
    title: "Final Resting Place",
    description:
      "Preserve cemetery, burial, cremation, headstone, and location information.",
    availability: "memorial-only",
  },
  {
    id: "backup-person",
    title: "Future Memorial Contact",
    afterDeathTitle: "After-Death Information",
    description:
      "Choose someone who can help protect and manage your memorial in the future.",
    afterDeathDescription:
      "Complete the verified date of death and review the private instructions and funeral-home information the memorial owner left for you.",
    availability: "personal-only",
  },
  {
    id: "review",
    title: "Review",
    personalTitle: "Review Your Living MyEMemorial",
    memorialTitle: "Review the Memorial",
    description:
      "Review what has been preserved and make any additions before continuing.",
    availability: "all",
  },
];

export function getGuidedChapters(
  experienceType: MemorialExperienceType
): GuidedChapter[] {
  return GUIDED_CHAPTERS.filter((chapter) => {
    if (chapter.availability === "all") {
      return true;
    }

    if (
      chapter.availability === "personal-only" &&
      (
        experienceType === "personal" ||
        (
          experienceType === "after-death" &&
          chapter.id === "backup-person"
        )
      )
    ) {
      return true;
    }

        if (
      chapter.availability === "memorial-only" &&
      (experienceType === "memorial" ||
        experienceType === "after-death")
    ) {
      return true;
    }

    return false;
  });
}

export function getGuidedChapterTitle(
  chapter: GuidedChapter,
  experienceType: MemorialExperienceType
): string {
  if (experienceType === "personal" && chapter.personalTitle) {
    return chapter.personalTitle;
  }

  if (experienceType === "memorial" && chapter.memorialTitle) {
    return chapter.memorialTitle;
  }

  if (
    experienceType === "after-death" &&
    chapter.afterDeathTitle
  ) {
    return chapter.afterDeathTitle;
  }

  return chapter.title;
}

export function getGuidedChapterDescription(
  chapter: GuidedChapter,
  experienceType: MemorialExperienceType
): string {
  if (
    experienceType === "personal" &&
    chapter.personalDescription
  ) {
    return chapter.personalDescription;
  }

  if (
    experienceType === "memorial" &&
    chapter.memorialDescription
  ) {
    return chapter.memorialDescription;
  }

  if (
    experienceType === "after-death" &&
    chapter.afterDeathDescription
  ) {
    return chapter.afterDeathDescription;
  }

  return chapter.description;
}