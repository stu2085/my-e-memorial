"use client";


import { SlugEngine } from "../../lib/memorial-engine/SlugEngine";
import { ValidationEngine } from "../../lib/memorial-engine/ValidationEngine";
import { PersistenceEngine } from "../../lib/memorial-engine/PersistenceEngine";
import { MediaEngine } from "../../lib/memorial-engine/MediaEngine";
import PlacesLivedSection from "../components/PlacesLivedSection";

import type { UploadProgress } from "../../lib/photo-engine/uploadProgress";
import type { GalleryPhoto } from "../../lib/photo-engine/GalleryPhoto";

import CreateVideoMemoriesSection from "../components/CreateVideoMemoriesSection";
import CreateGallerySection from "../components/CreateGallerySection";
import NewspaperArticlesSection from "../components/NewspaperArticlesSection";
import FavoriteSongsSection from "../components/FavoriteSongsSection";
import FinalRestingPlaceSection from "../components/FinalRestingPlaceSection";
import HeadstonePhotosSection from "../components/HeadstonePhotosSection";
import BackupPersonSection from "../components/BackupPersonSection";
import BasicInformationSection from "../components/BasicInformationSection";
import GuidedMemoryBuilder from "../components/guided/GuidedMemoryBuilder";
import MemorialBuilderHero from "../components/memorial-builder/MemorialBuilderHero";
import MemorialBannerPhotoSection from "../components/memorial-builder/MemorialBannerPhotoSection";
import MemorialBuilderPageFrame from "../components/memorial-builder/MemorialBuilderPageFrame";
import {
  getGuidedChapters,
  type GuidedChapter,
} from "../components/guided/ChapterConfig";
import LifeStorySection from "../components/LifeStorySection";
import ObituarySection from "../components/ObituarySection";
import FamilyHistorySection from "../components/FamilyHistorySection";
import SocialMediaSection from "../components/SocialMediaSection";
import PlanLockedSection from "../components/PlanLockedSection";
import PlacesWorkedSection from "../components/PlacesWorkedSection";
import SchoolsAndAwardsSection from "../components/SchoolsAndAwardsSection";


import { ChangeEvent, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SideAd from "../components/SideAd";
import { supabase } from "../lib/supabase";

import { famousNames } from "../lib/famousNames";


const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const BACKUP_ACCESS_WORKFLOW_FIELDS = new Set([
  "backupEmail",
  "backupPassword",
  "secondaryBackupEmail",
  "secondaryBackupPassword",
]);

// Every editable field shown in the Backup Person chapter.  This is broader
// than the credential/access fields above because ordinary changes (for
// example a Secondary Backup Person phone number) also need a visible
// "Changes saved" acknowledgement before the owner leaves the chapter.
const BACKUP_PERSON_CHAPTER_FIELDS = new Set([
  "backupPersonName",
  "backupEmail",
  "backupPhone",
  "backupPassword",
  "secondaryBackupName",
  "secondaryBackupEmail",
  "secondaryBackupPhone",
  "secondaryBackupPassword",
  "hasWill",
  "willLocation",
  "willAttorneyOffice",
  "hasExecutor",
  "primaryBackupIsExecutor",
  "hasFuneralDecisionDesignee",
  "funeralDecisionPersonName",
  "funeralDecisionPersonRelationship",
  "primaryBackupIsFuneralDesignee",
  "funeralAuthorityDocumentLocation",
  "hasLifeInsurance",
  "lifeInsuranceLocation",
  "primaryFuneralHomeName",
  "primaryFuneralHomeCity",
  "primaryFuneralHomeState",
  "primaryFuneralHomeEmail",
  "primaryFuneralHomeWebsite",
  "primaryFuneralHomeNotifyAuthorized",
  "alternateFuneralHomeName",
  "alternateFuneralHomeCity",
  "alternateFuneralHomeState",
  "alternateFuneralHomeEmail",
  "alternateFuneralHomeWebsite",
  "alternateFuneralHomeNotifyAuthorized",
  "legacyInstructions",
  "privateOwnerMessage",
  "creatorStreet",
  "creatorCity",
  "creatorState",
  "creatorZip",
]);

type FormState = {
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
obituaryImageUrl: string;
newspaperArticles: string;
  lifeStory: string;
  greatGrandparentsNames: string;
grandparentsFatherSide: string;
grandparentsMotherSide: string;
parentsNames: string;
siblingsNames: string;
spouseNames: string;
childrenNames: string;
grandchildrenNames: string;
greatGrandchildrenNames: string;
  cemeteryName: string;
  graveSection: string;
  graveRow: string;
  gravePlot: string;
  graveLat: string;
  graveLng: string;
  mapStreet: string;
  mapCity: string;
  mapState: string;
  mapZip: string;
  mapCountry: string;
  graveDirections: string;
    placesLived: string;
    placesWorked: string;
  schoolsAttended: string;
  awardsWon: string;
  socialLink1: string;
socialLink2: string;
socialLink3: string;
socialLink4: string;
socialLink5: string;
  videoUrls: string[];
videoLinkUrls: string[];
videoLinkNotes: string[];
videoLinkThumbnailUrls: string[];
featuredPhotoUrl: string;
bannerPhotoUrl: string;
bannerSourcePhotoUrl: string;
bannerNeedsExtension: boolean;
bannerPositionX: number;
bannerPositionY: number;
  finalRestingType: string;
  ashesLocationDescription: string;
  plan: "free" | "basic" | "plus" | "premium";
  isLivingPreplan: boolean;
  funeralPresentationMusicSource: "favorite_songs" | "funeral_home";
backupPersonName: string;
backupPersonEmail: string;
backupPersonUsername: string;
backupEmail: string;
backupPhone: string;
backupPassword: string;
backupStreet: string;
backupCity: string;
backupState: string;
backupZip: string;
secondaryBackupName: string;
secondaryBackupEmail: string;
secondaryBackupPhone: string;
secondaryBackupPassword: string;
secondaryBackupActivatedAt: string;
secondaryBackupActivatedBy: string;
primaryBackupRevokedAt: string;
secondaryBackupRevokedAt: string;

hasWill: string;
willLocation: string;
willAttorneyOffice: string;
hasLifeInsurance: string;
lifeInsuranceLocation: string;
hasExecutor: string;
primaryBackupIsExecutor: string;

hasFuneralDecisionDesignee: string;
primaryBackupIsFuneralDesignee: string;
funeralDecisionPersonName: string;
funeralDecisionPersonRelationship: string;
funeralAuthorityDocumentLocation: string;

primaryFuneralHomeName: string;
primaryFuneralHomeCity: string;
primaryFuneralHomeState: string;
primaryFuneralHomeWebsite: string;
primaryFuneralHomeEmail: string;
primaryFuneralHomeEmailVerified: string;
primaryFuneralHomeNotifyAuthorized: string;
primaryFuneralHomeNotifiedAt: string;
primaryFuneralHomeAcknowledgedAt: string;
primaryFuneralHomeUnavailableAt: string;
primaryFuneralHomeUnavailableReason: string;
alternateFuneralHomeActivatedAt: string;
alternateFuneralHomeName: string;
alternateFuneralHomeCity: string;
alternateFuneralHomeState: string;
alternateFuneralHomeWebsite: string;
alternateFuneralHomeEmail: string;
alternateFuneralHomeEmailVerified: string;
alternateFuneralHomeNotifyAuthorized: string;
alternateFuneralHomeNotifiedAt: string;
alternateFuneralHomeAcknowledgedAt: string;
legacyInstructions: string;
privateOwnerMessage: string;
creatorStreet: string;
creatorCity: string;
creatorState: string;
creatorZip: string;
betaCode: string;
promotionCategory: string;
};

const initialForm: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  maidenName: "",
  nickname: "",
  gender: "",
  birthDate: "",
  deathDate: "",
 obituary: "",
obituaryUrl: "",
obituaryImageUrl: "",
newspaperArticles: "",
  lifeStory: "",
  greatGrandparentsNames: "",
grandparentsFatherSide: "",
grandparentsMotherSide: "",
parentsNames: "",
siblingsNames: "",
spouseNames: "",
childrenNames: "",
grandchildrenNames: "",
greatGrandchildrenNames: "",
  cemeteryName: "",
  graveDirections: "",
  graveSection: "",
  graveRow: "",
  gravePlot: "",
  graveLat: "",
  graveLng: "",
  mapStreet: "",
  mapCity: "",
  mapState: "",
  mapZip: "",
  mapCountry: "USA",
  placesLived: "",
  placesWorked: "",
  schoolsAttended: "",
  awardsWon: "",
  socialLink1: "",
socialLink2: "",
socialLink3: "",
socialLink4: "",
socialLink5: "",
  videoUrls: [],
videoLinkUrls: [],
videoLinkNotes: [],
videoLinkThumbnailUrls: [],
featuredPhotoUrl: "",
bannerPhotoUrl: "",
bannerSourcePhotoUrl: "",
bannerNeedsExtension: false,
bannerPositionX: 50,
bannerPositionY: 50,
  finalRestingType: "",
  ashesLocationDescription: "",
  plan: "basic",
  isLivingPreplan: false,
  funeralPresentationMusicSource: "favorite_songs",
backupPersonName: "",
backupPersonEmail: "",
backupPersonUsername: "",
backupEmail: "",
backupPhone: "",
backupPassword: "",
backupStreet: "",
backupCity: "",
backupState: "",
backupZip: "",
secondaryBackupName: "",
secondaryBackupEmail: "",
secondaryBackupPhone: "",
secondaryBackupPassword: "",
secondaryBackupActivatedAt: "",
secondaryBackupActivatedBy: "",
primaryBackupRevokedAt: "",
secondaryBackupRevokedAt: "",

hasWill: "",
willLocation: "",
willAttorneyOffice: "",
hasLifeInsurance: "",
lifeInsuranceLocation: "",
hasExecutor: "",
primaryBackupIsExecutor: "",

hasFuneralDecisionDesignee: "",
primaryBackupIsFuneralDesignee: "",
funeralDecisionPersonName: "",
funeralDecisionPersonRelationship: "",
funeralAuthorityDocumentLocation: "",

primaryFuneralHomeName: "",
primaryFuneralHomeCity: "",
primaryFuneralHomeState: "",
primaryFuneralHomeWebsite: "",
primaryFuneralHomeEmail: "",
primaryFuneralHomeEmailVerified: "",
primaryFuneralHomeNotifyAuthorized: "",
primaryFuneralHomeNotifiedAt: "",
primaryFuneralHomeAcknowledgedAt: "",
primaryFuneralHomeUnavailableAt: "",
primaryFuneralHomeUnavailableReason: "",
alternateFuneralHomeActivatedAt: "",
alternateFuneralHomeName: "",
alternateFuneralHomeCity: "",
alternateFuneralHomeState: "",
alternateFuneralHomeWebsite: "",
alternateFuneralHomeEmail: "",
alternateFuneralHomeEmailVerified: "",
alternateFuneralHomeNotifyAuthorized: "",
alternateFuneralHomeNotifiedAt: "",
alternateFuneralHomeAcknowledgedAt: "",
legacyInstructions: "",
privateOwnerMessage: "",
creatorStreet: "",
creatorCity: "",
creatorState: "",
creatorZip: "",
betaCode: "",
promotionCategory: "personal",
};

const PLAN_LIMITS = {
  free: {
    label: "Free Memorial",
    galleryPhotos: 5,
    videoMinutes: 0,
  },
  basic: {
    label: "Basic Memorial",
    galleryPhotos: 50,
    videoMinutes: 15,
  },
  plus: {
    label: "Plus Memorial",
    galleryPhotos: 150,
    videoMinutes: 30,
  },
  premium: {
    label: "Premium Memorial",
    galleryPhotos: Infinity,
    videoMinutes: 60,
  },
};



type PlanKey = keyof typeof PLAN_LIMITS;

const POST_DEATH_BACKUP_OWNER_LOCKED_CHAPTERS =
  new Set<GuidedChapter["id"]>([
    "basic-information",
    "family-history",
    "life-story",
    "places-lived",
    "places-worked",
    "schools-and-awards",
    "social-media",
    "newspaper-articles",
    "favorite-songs",
  ]);



function getApiWarningMessage(result: unknown) {
  if (!result || typeof result !== "object") {
    return "";
  }

  const responseResult =
    result as Record<string, unknown>;

  const warnings: string[] = [];

  if (
    typeof responseResult.warning === "string" &&
    responseResult.warning.trim()
  ) {
    warnings.push(responseResult.warning.trim());
  }

  if (Array.isArray(responseResult.warnings)) {
    for (const warning of responseResult.warnings) {
      if (
        typeof warning === "string" &&
        warning.trim()
      ) {
        warnings.push(warning.trim());
      }
    }
  }

  return Array.from(new Set(warnings)).join("\n");
}


function CreatePageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

const isPersonalMode =
  mode === "personal" || mode === "preplan";
  const isGiftFlow = Boolean(searchParams.get("gift"));
  const isExistingMemorialEdit =
  Number(searchParams.get("edit") || 0) > 0;
  const [isPaid, setIsPaid] = useState(false);
  const [isStartingPlanCheckout, setIsStartingPlanCheckout] = useState(false);

  useEffect(() => {
    const handlePageShow = () => {
      setIsStartingPlanCheckout(false);
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const MAX_VIDEO_SIZE_BYTES = 1000 * 1000 * 1000; // 1 GB
  const [mapSearchStatus, setMapSearchStatus] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    plan: isPersonalMode ? "free" : initialForm.plan,
    isLivingPreplan: isPersonalMode,
    promotionCategory: isPersonalMode
      ? "personal"
      : initialForm.promotionCategory,
  }));
const [paidExtraVideos, setPaidExtraVideos] = useState(0);
const [featuredPhoto, setFeaturedPhoto] = useState<File | null>(null);
const [bannerPhoto, setBannerPhoto] = useState<File | null>(null);
const [bannerSourcePhotoFile, setBannerSourcePhotoFile] =
  useState<File | null>(null);
const [isExtendingBanner, setIsExtendingBanner] = useState(false);
const [bannerPhotoPreviewUrl, setBannerPhotoPreviewUrl] =
  useState<string | null>(null);
const [bannerPhotoFitStatus, setBannerPhotoFitStatus] =
  useState<"wide" | "needs-extension" | null>(null);
  const [headstonePhoto1, setHeadstonePhoto1] = useState<File | null>(null);
  const [headstonePhoto2, setHeadstonePhoto2] = useState<File | null>(null);
  const [obituaryImageFile, setObituaryImageFile] =
  useState<File | null>(null);
  const [showAfterDeathSaveModal, setShowAfterDeathSaveModal] =
  useState(false);
  function handleBannerPhotoSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose a JPEG, PNG, or WebP image for the memorial banner.");
      return;
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowedTypes.has(file.type)) {
      alert("Please choose a JPEG, PNG, or WebP image for the memorial banner.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("Please choose a banner photo smaller than 20 MB.");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setBannerPhoto(file);
    setBannerSourcePhotoFile(file);
    setBannerPhotoPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
      }
      return nextPreviewUrl;
    });

    setForm((previousForm) => ({
      ...previousForm,
      bannerPositionX: 50,
      bannerPositionY: 50,
    }));

    const image = new window.Image();

    image.onload = () => {
      const aspectRatio =
        image.naturalHeight > 0
          ? image.naturalWidth / image.naturalHeight
          : 0;

      const needsExtension = aspectRatio < 2.4;

      setBannerPhotoFitStatus(
        needsExtension ? "needs-extension" : "wide"
      );

      setForm((previousForm) => ({
        ...previousForm,
        bannerNeedsExtension: needsExtension,
      }));
    };

    image.onerror = () => {
      setBannerPhotoFitStatus(null);
    };

    image.src = nextPreviewUrl;
  }

  function selectStockBanner(imageUrl: string) {
    setBannerPhoto(null);
    setBannerSourcePhotoFile(null);
    setBannerPhotoFitStatus("wide");

    setBannerPhotoPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
      }
      return null;
    });

    setForm((previousForm) => ({
      ...previousForm,
      bannerPhotoUrl: imageUrl,
      bannerSourcePhotoUrl: imageUrl,
      bannerNeedsExtension: false,
      bannerPositionX: 50,
      bannerPositionY: 50,
    }));
  }

  function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number
  ) {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("The banner image could not be prepared."));
            return;
          }

          resolve(blob);
        },
        type,
        quality
      );
    });
  }

  async function loadImageFromBlob(blob: Blob) {
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = new window.Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("The banner photo could not be read."));
        image.src = objectUrl;
      });

      return image;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function loadImageFromDataUrl(dataUrl: string) {
    const image = new window.Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("The extended banner could not be read."));
      image.src = dataUrl;
    });

    return image;
  }

  async function getBannerSourceBlob() {
    if (bannerSourcePhotoFile) {
      return bannerSourcePhotoFile;
    }

    const sourceUrl =
      form.bannerSourcePhotoUrl || form.bannerPhotoUrl;

    if (!sourceUrl) {
      throw new Error("Please choose a banner photo first.");
    }

    const response = await fetch(sourceUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        "The original banner photo could not be loaded. Please choose the photo again."
      );
    }

    return await response.blob();
  }

  async function createFullWidthBanner() {
    if (isExtendingBanner) return;

    setIsExtendingBanner(true);

    try {
      const sourceBlob = await getBannerSourceBlob();
      const sourceImage = await loadImageFromBlob(sourceBlob);

      /*
       * GPT Image currently allows a maximum 3:1 aspect ratio.
       * 1536 x 512 gives us a clean 3:1 master that the website
       * can crop very slightly to the approved 16:5 banner frame.
       */
      const targetWidth = 1536;
      const targetHeight = 512;

      const scale = Math.min(
        targetHeight / sourceImage.naturalHeight,
        targetWidth / sourceImage.naturalWidth
      );

      const sourceWidth = Math.max(
        1,
        Math.round(sourceImage.naturalWidth * scale)
      );
      const sourceHeight = Math.max(
        1,
        Math.round(sourceImage.naturalHeight * scale)
      );

      const sourceX = Math.round(
        (targetWidth - sourceWidth) / 2
      );
      const sourceY = Math.round(
        (targetHeight - sourceHeight) / 2
      );

      const inputCanvas = document.createElement("canvas");
      inputCanvas.width = targetWidth;
      inputCanvas.height = targetHeight;

      const inputContext = inputCanvas.getContext("2d");

      if (!inputContext) {
        throw new Error("The banner photo could not be prepared.");
      }

      inputContext.clearRect(
        0,
        0,
        targetWidth,
        targetHeight
      );
      inputContext.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight
      );

      /*
       * Transparent mask areas are the portions the image model
       * may extend. The opaque rectangle protects the source-photo
       * footprint. After generation we also place the original pixels
       * back over that footprint as a second safeguard.
       */
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = targetWidth;
      maskCanvas.height = targetHeight;

      const maskContext = maskCanvas.getContext("2d");

      if (!maskContext) {
        throw new Error("The banner mask could not be prepared.");
      }

      maskContext.clearRect(
        0,
        0,
        targetWidth,
        targetHeight
      );
      maskContext.fillStyle = "rgba(255,255,255,1)";
      maskContext.fillRect(
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight
      );

      const inputBlob = await canvasToBlob(
        inputCanvas,
        "image/png"
      );
      const maskBlob = await canvasToBlob(
        maskCanvas,
        "image/png"
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Please sign in again before creating a full-width banner."
        );
      }

      const requestBody = new FormData();
      requestBody.append(
        "image",
        new File(
          [inputBlob],
          "memorial-banner-source.png",
          { type: "image/png" }
        )
      );
      requestBody.append(
        "mask",
        new File(
          [maskBlob],
          "memorial-banner-mask.png",
          { type: "image/png" }
        )
      );

      const response = await fetch(
        "/api/memorial-banner/extend",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: requestBody,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.imageBase64) {
        throw new Error(
          result.error ||
            "The full-width banner could not be created."
        );
      }

      const generatedImage = await loadImageFromDataUrl(
        `data:image/png;base64,${result.imageBase64}`
      );

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;

      const finalContext = finalCanvas.getContext("2d");

      if (!finalContext) {
        throw new Error(
          "The finished banner could not be prepared."
        );
      }

      /*
       * First draw the generated wide scene, then restore the exact
       * original-photo pixels over their original footprint.
       */
      finalContext.drawImage(
        generatedImage,
        0,
        0,
        targetWidth,
        targetHeight
      );

      finalContext.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight
      );

      const finalBlob = await canvasToBlob(
        finalCanvas,
        "image/webp",
        0.92
      );

      const extendedFile = new File(
        [finalBlob],
        `memorial-banner-extended-${Date.now()}.webp`,
        { type: "image/webp" }
      );

      const nextPreviewUrl =
        URL.createObjectURL(extendedFile);

      setBannerPhoto(extendedFile);
      setBannerPhotoPreviewUrl(
        (previousPreviewUrl) => {
          if (previousPreviewUrl) {
            URL.revokeObjectURL(previousPreviewUrl);
          }

          return nextPreviewUrl;
        }
      );

      setBannerPhotoFitStatus("wide");

      setForm((previousForm) => ({
        ...previousForm,
        bannerNeedsExtension: false,
        bannerPositionX: 50,
        bannerPositionY: 50,
      }));
    } catch (error) {
      console.error(
        "MEMORIAL BANNER EXTENSION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "The full-width banner could not be created."
      );
    } finally {
      setIsExtendingBanner(false);
    }
  }

  function removeBannerPhoto() {
    setBannerPhoto(null);
    setBannerSourcePhotoFile(null);
    setBannerPhotoFitStatus(null);

    setBannerPhotoPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
      }
      return null;
    });

    setForm((previousForm) => ({
      ...previousForm,
      bannerPhotoUrl: "",
      bannerSourcePhotoUrl: "",
      bannerNeedsExtension: false,
      bannerPositionX: 50,
      bannerPositionY: 50,
    }));
  }

  const galleryPhotosRef = useRef<GalleryPhoto[]>([]);
  const [galleryPhotos, setGalleryPhotosState] = useState<GalleryPhoto[]>([]);

  function setGalleryPhotos(
    action:
      | GalleryPhoto[]
      | ((previous: GalleryPhoto[]) => GalleryPhoto[])
  ) {
    const next =
      typeof action === "function"
        ? action(galleryPhotosRef.current)
        : action;

    galleryPhotosRef.current = next;
    setGalleryPhotosState(next);
  }
  const [newspaperArticleFiles, setNewspaperArticleFiles] =
  useState<File[]>([]);
  const [galleryUploadProgress, setGalleryUploadProgress] =
  useState<UploadProgress | null>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);



const [favoriteSongFiles, setFavoriteSongFiles] = useState<File[]>([]);
const [selectedFavoriteSongNotes, setSelectedFavoriteSongNotes] =
  useState<string[]>([]);

const savedFavoriteSongUrlsRef = useRef<string[]>([]);
const [savedFavoriteSongUrls, setSavedFavoriteSongUrlsState] =
  useState<string[]>([]);

function setSavedFavoriteSongUrls(
  action: string[] | ((previous: string[]) => string[])
) {
  const next =
    typeof action === "function"
      ? action(savedFavoriteSongUrlsRef.current)
      : action;

  savedFavoriteSongUrlsRef.current = next;
  setSavedFavoriteSongUrlsState(next);
}

const savedFavoriteSongNotesRef = useRef<string[]>([]);
const [savedFavoriteSongNotes, setSavedFavoriteSongNotesState] =
  useState<string[]>([]);

function setSavedFavoriteSongNotes(
  action: string[] | ((previous: string[]) => string[])
) {
  const next =
    typeof action === "function"
      ? action(savedFavoriteSongNotesRef.current)
      : action;

  savedFavoriteSongNotesRef.current = next;
  setSavedFavoriteSongNotesState(next);
}
const [savedHeadstonePhoto1Url, setSavedHeadstonePhoto1Url] = useState("");
const [savedHeadstonePhoto2Url, setSavedHeadstonePhoto2Url] = useState("");
const [savedObituaryImageUrl, setSavedObituaryImageUrl] = useState("");
const savedGalleryPhotoUrlsRef = useRef<string[]>([]);
const [
  savedGalleryPhotoUrls,
  setSavedGalleryPhotoUrlsState,
] = useState<string[]>([]);

function setSavedGalleryPhotoUrls(
  action:
    | string[]
    | ((previous: string[]) => string[])
) {
  const next =
    typeof action === "function"
      ? action(savedGalleryPhotoUrlsRef.current)
      : action;

  savedGalleryPhotoUrlsRef.current = next;
  setSavedGalleryPhotoUrlsState(next);
}

const savedGalleryPhotoCaptionsRef = useRef<string[]>([]);
const [
  savedGalleryPhotoCaptions,
  setSavedGalleryPhotoCaptionsState,
] = useState<string[]>([]);

function setSavedGalleryPhotoCaptions(
  action:
    | string[]
    | ((previous: string[]) => string[])
) {
  const next =
    typeof action === "function"
      ? action(savedGalleryPhotoCaptionsRef.current)
      : action;

  savedGalleryPhotoCaptionsRef.current = next;
  setSavedGalleryPhotoCaptionsState(next);
}
const [savedNewspaperArticleUrls, setSavedNewspaperArticleUrls] = useState<string[]>([]);
const [draftReady, setDraftReady] = useState(false);
const [draftMemorialId, setDraftMemorialId] = useState<number | null>(null);
const [draftMemorialSlug, setDraftMemorialSlug] = useState("");

const [isBackupAccess, setIsBackupAccess] = useState(false);

/*
 * When Stripe returns a brand-new paid memorial with a session_id, keep the
 * Guided Memory Builder hidden until payment verification decides whether the
 * purchaser can continue here or must first choose/sign in to an account.
 * This prevents Chapter 1 from flashing briefly before the account-choice page.
 */
const [isResolvingPaymentReturn, setIsResolvingPaymentReturn] = useState(
  () => Boolean(searchParams.get("session_id"))
);

const [isPostDeathUnlocked, setIsPostDeathUnlocked] =
  useState(false);
const [existingMemorialOwnerId, setExistingMemorialOwnerId] =
  useState<string | null>(null);

const [existingMemorialIsPublished, setExistingMemorialIsPublished] =
  useState<boolean | null>(null);
  const [existingMemorialIsDraft, setExistingMemorialIsDraft] =
  useState<boolean | null>(null);
const [guidedInitialChapterId, setGuidedInitialChapterId] =
  useState<string | null>(null);
const [backupAccessWorkflowDirty, setBackupAccessWorkflowDirty] =
  useState(false);
const [backupPersonChapterDirty, setBackupPersonChapterDirty] =
  useState(false);
const [showBackupSetupCompleteMessage, setShowBackupSetupCompleteMessage] =
  useState(false);
const [showBackupSaveConfirmationMessage, setShowBackupSaveConfirmationMessage] =
  useState(false);
const [secondaryFreshPasswordRequired, setSecondaryFreshPasswordRequired] =
  useState(false);
const [videoFiles, setVideoFiles] = useState<File[]>([]);

const videoNotesRef = useRef<string[]>([]);
const [videoNotes, setVideoNotesState] = useState<string[]>([]);

function setVideoNotes(
  action:
    | string[]
    | ((previous: string[]) => string[])
) {
  const next =
    typeof action === "function"
      ? action(videoNotesRef.current)
      : action;

  videoNotesRef.current = next;
  setVideoNotesState(next);
}

const [savedVideoUrls, setSavedVideoUrls] = useState<string[]>([]);

const savedVideoNotesRef = useRef<string[]>([]);
const [savedVideoNotes, setSavedVideoNotesState] =
  useState<string[]>([]);

function setSavedVideoNotes(
  action:
    | string[]
    | ((previous: string[]) => string[])
) {
  const next =
    typeof action === "function"
      ? action(savedVideoNotesRef.current)
      : action;

  savedVideoNotesRef.current = next;
  setSavedVideoNotesState(next);
}

const [videoLinkThumbnailFiles, setVideoLinkThumbnailFiles] =
  useState<(File | null)[]>([]);

const [videoError, setVideoError] = useState("");
const paymentSuccessBoxRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

 const [adCategoryPair, setAdCategoryPair] = useState<[string, string]>([
  "attorney",
  "estate_planner",
]);

useEffect(() => {
  const pairs: [string, string][] = [
    ["attorney", "estate_planner"],
    ["attorney", "funeral_home"],
    ["attorney", "monument_company"],
    ["estate_planner", "funeral_home"],
    ["estate_planner", "monument_company"],
    ["funeral_home", "monument_company"],
  ];

  const randomPair = pairs[Math.floor(Math.random() * pairs.length)];

  setAdCategoryPair(randomPair);
}, [searchParams]);

const leftAdCategory = adCategoryPair[0];
const rightAdCategory = adCategoryPair[1];

useEffect(() => {
  async function verifyPayment() {
    const params = searchParams;
const mode = params.get("mode");
const draftId = Number(params.get("draft") || 0);
const editId = Number(params.get("edit") || 0);
const memorialId = draftId || editId;
const isEditingExistingMemorial = editId > 0;

const isPersonalModeFromUrl =
  mode === "personal" || mode === "preplan";
const isMemorialModeFromUrl =
  mode === "memorial" || mode === "deceased";
const builderModeQuery = isPersonalModeFromUrl
  ? "mode=personal&"
  : isMemorialModeFromUrl
    ? "mode=memorial&"
    : "";
const paymentSessionId = params.get("session_id");
const isUpgradePaymentReturn =
  isEditingExistingMemorial &&
  params.get("upgrade_success") === "true" &&
  params.get("success") === "true" &&
  Boolean(paymentSessionId);
let verifiedExistingUpgrade = false;

      if (memorialId > 0) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  let hasBackupAccess = false;

  if (isEditingExistingMemorial && !user) {
    try {
      const backupAccessResponse = await fetch(
        `/api/backup-access?memorialId=${memorialId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (backupAccessResponse.ok) {
        const backupAccessResult =
          await backupAccessResponse.json();

        hasBackupAccess =
          backupAccessResult?.valid === true;
      }
    } catch (error) {
      console.error(
        "BACKUP ACCESS CHECK ERROR:",
        error
      );
    }
  }

  if (!user && !hasBackupAccess) {
    setErrorMessage(
      "Please sign in or use authorized backup-person access to continue."
    );
    setDraftReady(true);
    setIsResolvingPaymentReturn(false);
    return;
  }

  /*
   * Existing-memorial upgrades return with edit=<id>, upgrade_success=true,
   * success=true, and a Stripe session_id. Verify and apply that upgrade on
   * the server BEFORE loading the memorial so the builder receives the new
   * plan/payment state on its first database read.
   */
  if (isUpgradePaymentReturn && !hasBackupAccess && user && paymentSessionId) {
    try {
      const verifyResponse = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          sessionId: paymentSessionId,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (
        !verifyResponse.ok ||
        verifyResult?.paid !== true ||
        verifyResult?.checkoutType !== "upgrade" ||
        Number(verifyResult?.memorialId || 0) !== memorialId
      ) {
        throw new Error(
          verifyResult?.error ||
            "The plan upgrade payment could not be applied to this MyEMemorial."
        );
      }

      verifiedExistingUpgrade = true;
      setIsPaid(true);
      setSuccessMessage("Payment Successful");
    } catch (error) {
      console.error(
        "EXISTING MEMORIAL UPGRADE VERIFICATION ERROR:",
        error
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The plan upgrade payment could not be confirmed."
      );
      setDraftReady(true);
      setIsResolvingPaymentReturn(false);
      return;
    }
  }

  let draftData: any = null;
let draftError: any = null;

if (hasBackupAccess) {
  try {
    const backupEditResponse = await fetch(
      `/api/backup-memorial/edit?memorialId=${memorialId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const backupEditResult =
  await backupEditResponse.json();



if (!backupEditResponse.ok) {
      draftError = new Error(
        backupEditResult.error ||
          "Could not load this Living MyEMemorial."
      );
    } else {
      draftData = backupEditResult.memorial;
    }
  } catch (error) {
    draftError = error;
  }
} else {
  let memorialQuery = supabase
    .from("memorials")
    .select("*")
    .eq("id", memorialId);

  if (user) {
    memorialQuery = memorialQuery.eq(
      "owner_id",
      user.id
    );
  }

  if (!isEditingExistingMemorial) {
    memorialQuery = memorialQuery.eq(
      "is_draft",
      true
    );
  }

  const directResult =
    await memorialQuery.maybeSingle();

  draftData = directResult.data;
  draftError = directResult.error;
}

  /*
   * A published former Living MyEMemorial has
   * is_living_preplan=false by design. Do not reject it here.
   * The central /api/backup-access validator already requires
   * independently verified + unlocked post-death authority
   * before it will validate Backup Person access to that state.
   */

  if (hasBackupAccess) {
    setIsBackupAccess(true);
  }

  if (draftError) {
    console.error("LOAD GUIDED DRAFT ERROR:", draftError);
    setErrorMessage("Could not load this draft memorial.");
    setDraftReady(true);
    setIsResolvingPaymentReturn(false);
    return;
  }

  if (!draftData) {
    setErrorMessage("This draft memorial could not be found.");
    setDraftReady(true);
    setIsResolvingPaymentReturn(false);
    return;
  }

  setDraftMemorialId(draftData.id);
setDraftMemorialSlug(draftData.slug || "");
setExistingMemorialOwnerId(draftData.owner_id ?? null);

setExistingMemorialIsPublished(
  typeof draftData.is_published === "boolean"
    ? draftData.is_published
    : false
);
setExistingMemorialIsDraft(
  typeof draftData.is_draft === "boolean"
    ? draftData.is_draft
    : true
);
setSavedVideoUrls(
  Array.isArray(draftData.video_urls)
    ? draftData.video_urls
    : []
);

setSavedVideoNotes(
  Array.isArray(draftData.video_notes)
    ? draftData.video_notes
    : []
);
const loadedFavoriteSongUrls =
  Array.isArray(draftData.favorite_song_urls) &&
  draftData.favorite_song_urls.length > 0
    ? draftData.favorite_song_urls
    : draftData.favorite_song_url
      ? [draftData.favorite_song_url]
      : [];

const loadedFavoriteSongNotes =
  Array.isArray(draftData.favorite_song_notes)
    ? draftData.favorite_song_notes
    : [];

setSavedFavoriteSongUrls(loadedFavoriteSongUrls);
setSavedFavoriteSongNotes(loadedFavoriteSongNotes);
setSavedHeadstonePhoto1Url(
  draftData.headstone_photo_1 ?? ""
);

setSavedHeadstonePhoto2Url(
  draftData.headstone_photo_2 ?? ""
);

setSavedObituaryImageUrl(
  draftData.obituary_image_url ?? ""
);

setSavedGalleryPhotoUrls(
  typeof draftData.gallery_photos === "string" &&
  draftData.gallery_photos.trim()
    ? draftData.gallery_photos
        .split(",")
        .map((url: string) => url.trim())
        .filter(Boolean)
    : []
);
setSavedGalleryPhotoCaptions(
  Array.isArray(draftData.gallery_photo_captions)
    ? draftData.gallery_photo_captions
    : []
);
setSavedNewspaperArticleUrls(
  typeof draftData.newspaper_articles === "string" &&
  draftData.newspaper_articles.trim()
    ? draftData.newspaper_articles
        .split(",")
        .map((url: string) => url.trim())
        .filter(Boolean)
    : []
);
setForm({
    ...initialForm,
    firstName: draftData.first_name ?? "",
    middleName: draftData.middle_name ?? "",
    lastName: draftData.last_name ?? "",
    maidenName: draftData.maiden_name ?? "",
    nickname: draftData.nickname ?? "",
    gender: draftData.gender ?? "",
    birthDate: draftData.birth_date ?? "",
    deathDate: draftData.death_date ?? "",
    obituary: draftData.obituary ?? "",
obituaryUrl: draftData.obituary_url ?? "",
obituaryImageUrl: draftData.obituary_image_url ?? "",
newspaperArticles: draftData.newspaper_articles ?? "",
    lifeStory: draftData.life_story ?? "",
    greatGrandparentsNames:
      draftData.great_grandparents_names ?? "",
    grandparentsFatherSide:
      draftData.grandparents_father_side ?? "",
    grandparentsMotherSide:
      draftData.grandparents_mother_side ?? "",
    parentsNames: draftData.parents_names ?? "",
siblingsNames: draftData.siblings_names ?? "",
spouseNames: draftData.spouse_names ?? "",
childrenNames: draftData.children_names ?? "",
    grandchildrenNames:
      draftData.grandchildren_names ?? "",
    greatGrandchildrenNames:
      draftData.great_grandchildren_names ?? "",
    cemeteryName: draftData.cemetery_name ?? "",
    graveSection: draftData.grave_section ?? "",
    graveRow: draftData.grave_row ?? "",
    gravePlot: draftData.grave_plot ?? "",
    graveLat:
      draftData.grave_lat != null
        ? String(draftData.grave_lat)
        : "",
    graveLng:
      draftData.grave_lng != null
        ? String(draftData.grave_lng)
        : "",
    mapStreet: draftData.map_street ?? "",
    mapCity: draftData.map_city ?? "",
    mapState: draftData.map_state ?? "",
    mapZip: draftData.map_zip ?? "",
    mapCountry: draftData.map_country ?? "USA",
    graveDirections: draftData.grave_directions ?? "",
    placesLived: draftData.places_lived ?? "",
    placesWorked: draftData.places_worked ?? "",
    schoolsAttended: draftData.schools_attended ?? "",
    awardsWon: draftData.awards_won ?? "",
    socialLink1: draftData.social_link_1 ?? "",
    socialLink2: draftData.social_link_2 ?? "",
    socialLink3: draftData.social_link_3 ?? "",
    socialLink4: draftData.social_link_4 ?? "",
    socialLink5: draftData.social_link_5 ?? "",
    videoUrls: Array.isArray(draftData.video_urls)
  ? draftData.video_urls
  : [],
videoLinkUrls: Array.isArray(draftData.video_link_urls)
  ? draftData.video_link_urls
  : [],
videoLinkNotes: Array.isArray(draftData.video_link_notes)
  ? draftData.video_link_notes
  : [],
videoLinkThumbnailUrls: Array.isArray(
  draftData.video_link_thumbnail_urls
)
  ? draftData.video_link_thumbnail_urls
  : [],
featuredPhotoUrl:
  draftData.featured_photo_url ?? "",
bannerPhotoUrl:
  draftData.banner_photo_url ?? "",
bannerSourcePhotoUrl:
  draftData.banner_source_photo_url ?? draftData.banner_photo_url ?? "",
bannerNeedsExtension:
  Boolean(draftData.banner_needs_extension),
bannerPositionX:
  Number.isFinite(Number(draftData.banner_position_x))
    ? Number(draftData.banner_position_x)
    : 50,
bannerPositionY:
  Number.isFinite(Number(draftData.banner_position_y))
    ? Number(draftData.banner_position_y)
    : 50,
    finalRestingType:
      draftData.final_resting_type ?? "",
    ashesLocationDescription:
      draftData.ashes_location_description ?? "",
    plan: draftData.plan ?? "basic",
    /*
     * Keep the Guided Memory Builder in Personal/after-death mode
     * for an authorized Backup Person even after publication changes
     * the stored memorial to is_living_preplan=false.
     *
     * The server update route protects is_living_preplan, so this is
     * a UI/workflow classification only and cannot change the DB flag.
     */
    isLivingPreplan:
      hasBackupAccess
        ? true
        : Boolean(draftData.is_living_preplan),
    funeralPresentationMusicSource:
      draftData.funeral_presentation_music_source === "funeral_home"
        ? "funeral_home"
        : "favorite_songs",
    backupPersonName:
      draftData.backup_person_name ?? "",
    backupPersonEmail: "",
    backupPersonUsername: "",
    backupEmail: draftData.backup_email ?? "",
    backupPassword: "",
    backupStreet: draftData.backup_street ?? "",
    backupCity: draftData.backup_city ?? "",
    backupState: draftData.backup_state ?? "",
    backupZip: draftData.backup_zip ?? "",
    creatorStreet: draftData.creator_street ?? "",
    creatorCity: draftData.creator_city ?? "",
    creatorState: draftData.creator_state ?? "",
    creatorZip: draftData.creator_zip ?? "",
    betaCode: "",
    promotionCategory:
      draftData.promotion_category ?? "personal",
  });
  if (
  draftData.is_living_preplan === true &&
  !hasBackupAccess &&
  user?.id === draftData.owner_id
) {
  try {
    const backupSettingsResponse = await fetch(
      `/api/backup-settings?memorialId=${draftData.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      }
    );

    const backupSettingsResult =
      await backupSettingsResponse.json();



    if (
      backupSettingsResponse.ok &&
      backupSettingsResult?.settings
    ) {
      const savedBackupSettings =
        backupSettingsResult.settings;

      setForm((previousForm) => ({
        ...previousForm,
        ...savedBackupSettings,
      }));
    }
  } catch (error) {
    console.error(
      "BACKUP SETTINGS LOAD ERROR:",
      error
    );
  }
}
if (hasBackupAccess) {
  /*
   * For a published former Living MyEMemorial, the hardened
   * /api/backup-access validator only returns valid after independent
   * death verification and post-death activation. That means the
   * post-death editing mode can be restored safely even though
   * is_living_preplan is now false in the memorial row.
   */
  if (draftData.is_living_preplan !== true) {
    setIsPostDeathUnlocked(true);
  } else {
    try {
      const backupSettingsResponse = await fetch(
        `/api/backup-settings/access?memorialId=${draftData.id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const backupSettingsResult =
        await backupSettingsResponse.json();

      setIsPostDeathUnlocked(
        backupSettingsResult?.postDeathUnlocked === true ||
          backupSettingsResult?.settings?.postDeathUnlocked === true
      );

      if (
        backupSettingsResponse.ok &&
        backupSettingsResult?.settings
      ) {
        const savedBackupSettings =
          backupSettingsResult.settings;

        setForm((previousForm) => ({
          ...previousForm,
          ...savedBackupSettings,

          // Never populate or expose the stored backup password.
          backupPassword: "",
        }));
      }
    } catch (error) {
      console.error(
        "BACKUP PERSON SETTINGS LOAD ERROR:",
        error
      );
    }
  }
}
/*
 * Restore any unsaved owner edits that survived an unexpected
 * browser reload. Supabase values are loaded first; the browser
 * recovery copy is then applied on top.
 */
if (

  memorialId > 0 &&
  !hasBackupAccess &&
  typeof window !== "undefined"
) {
  const recoveryKey =
    `memorialUnsavedEdit:${draftData.id}`;

  const recoveryJson =
    localStorage.getItem(recoveryKey);

  if (recoveryJson) {
    try {
      const recoveredForm =
        JSON.parse(recoveryJson) as Partial<FormState>;

      /*
       * Never restore security-sensitive or server-controlled
       * funeral-home status fields from browser storage.
       */
      delete recoveredForm.backupPassword;

      // The paid plan is server-controlled. Never let an older browser
      // recovery copy overwrite a Stripe/Supabase plan change.
      delete recoveredForm.plan;

      delete recoveredForm.primaryFuneralHomeEmailVerified;
      delete recoveredForm.primaryFuneralHomeNotifiedAt;
      delete recoveredForm.primaryFuneralHomeAcknowledgedAt;
      delete recoveredForm.primaryFuneralHomeUnavailableAt;
      delete recoveredForm.primaryFuneralHomeUnavailableReason;

      delete recoveredForm.alternateFuneralHomeActivatedAt;
      delete recoveredForm.alternateFuneralHomeEmailVerified;
      delete recoveredForm.alternateFuneralHomeNotifiedAt;
      delete recoveredForm.alternateFuneralHomeAcknowledgedAt;

      setForm((previousForm) => ({
        ...previousForm,
        ...recoveredForm,

        // Never restore Backup Person passwords.
        backupPassword: "",
        secondaryBackupPassword: "",
      }));
    } catch (error) {
      console.error(
        "UNSAVED MEMORIAL RECOVERY ERROR:",
        error
      );

      localStorage.removeItem(recoveryKey);
    }
  }
}
  setIsPaid(
    draftData.payment_status === "paid" ||
      draftData.payment_status === "free_beta"
  );

  const savedChapterId =
  draftData.guided_current_chapter || "basic-information";

localStorage.setItem(
  "guidedDraftCurrentChapter",
  savedChapterId
);

setGuidedInitialChapterId(savedChapterId);
setDraftReady(true);

if (verifiedExistingUpgrade && typeof window !== "undefined") {
  const cleanedUrl = new URL(window.location.href);
  cleanedUrl.searchParams.delete("upgrade_success");
  cleanedUrl.searchParams.delete("success");
  cleanedUrl.searchParams.delete("session_id");

  const cleanedSearch = cleanedUrl.searchParams.toString();
  window.history.replaceState(
    {},
    "",
    `${cleanedUrl.pathname}${cleanedSearch ? `?${cleanedSearch}` : ""}`
  );
}

setIsResolvingPaymentReturn(false);
return;
}

    const rawSavedDraft = localStorage.getItem("memorialDraft");
    const extraVideosPaid = Number(params.get("extra_videos_paid") || 0);
    const promoFromUrl = params.get("promo");
const planFromUrl = params.get("plan");
const sessionId = params.get("session_id");
    const autoCheckout = params.get("autocheckout");
    const giftToken = params.get("gift");

    const rawParsedDraft = rawSavedDraft ? JSON.parse(rawSavedDraft) : null;
    const savedDraftIsPersonal = rawParsedDraft?.isLivingPreplan === true;
    const hasExplicitExperienceMode =
      isPersonalModeFromUrl || isMemorialModeFromUrl;
    const savedDraftMatchesExperienceMode =
      !hasExplicitExperienceMode ||
      (isPersonalModeFromUrl && savedDraftIsPersonal) ||
      (isMemorialModeFromUrl && !savedDraftIsPersonal);
    const savedDraft =
      savedDraftMatchesExperienceMode ? rawSavedDraft : null;
    const parsedDraft =
      savedDraftMatchesExperienceMode ? rawParsedDraft : null;

    if (rawSavedDraft && !savedDraftMatchesExperienceMode) {
      localStorage.removeItem("memorialDraft");
      localStorage.removeItem("guidedDraftMemorialId");
      localStorage.removeItem("guidedDraftMemorialSlug");
      localStorage.removeItem("guidedDraftCurrentChapter");
      localStorage.removeItem("guidedDraftGalleryPhotoUrls");
      localStorage.removeItem("guidedDraftGalleryPhotoCaptions");
      localStorage.removeItem("paidExtraVideos");
    }

    const resumeMemorialId = Number(params.get("resume") || 0);
    const storedGuidedDraftId =
      resumeMemorialId > 0
        ? resumeMemorialId
        : Number(
            localStorage.getItem("guidedDraftMemorialId") || 0
          );

const storedGuidedDraftSlug =
  localStorage.getItem("guidedDraftMemorialSlug") || "";

if (
  memorialId <= 0 &&
  storedGuidedDraftId > 0
) {
  setDraftMemorialId(storedGuidedDraftId);
  setDraftMemorialSlug(storedGuidedDraftSlug);

  /*
   * Gallery photos are stored outside the main `form` object, so a Stripe
   * round trip cannot restore them from `memorialDraft` alone. Rehydrate
   * the saved gallery directly from the existing draft before the builder
   * becomes interactive. A browser copy made immediately before checkout
   * is retained as a fallback if the database read is temporarily unavailable.
   */
  let restoredGalleryFromDatabase = false;

  try {
    const { data: storedDraftMedia, error: storedDraftMediaError } =
      await supabase
        .from("memorials")
        .select("gallery_photos, gallery_photo_captions")
        .eq("id", storedGuidedDraftId)
        .maybeSingle();

    if (!storedDraftMediaError && storedDraftMedia) {
      const restoredGalleryPhotoUrls =
        typeof storedDraftMedia.gallery_photos === "string" &&
        storedDraftMedia.gallery_photos.trim()
          ? storedDraftMedia.gallery_photos
              .split(",")
              .map((url: string) => url.trim())
              .filter(Boolean)
          : [];

      const restoredGalleryPhotoCaptions =
        Array.isArray(storedDraftMedia.gallery_photo_captions)
          ? storedDraftMedia.gallery_photo_captions
          : [];

      setSavedGalleryPhotoUrls(restoredGalleryPhotoUrls);
      setSavedGalleryPhotoCaptions(restoredGalleryPhotoCaptions);
      restoredGalleryFromDatabase = true;
    }
  } catch (error) {
    console.error(
      "STRIPE RETURN GALLERY RESTORE ERROR:",
      error
    );
  }

  if (!restoredGalleryFromDatabase) {
    try {
      const savedGalleryUrlsJson =
        localStorage.getItem("guidedDraftGalleryPhotoUrls");
      const savedGalleryCaptionsJson =
        localStorage.getItem("guidedDraftGalleryPhotoCaptions");

      const fallbackGalleryUrls = savedGalleryUrlsJson
        ? JSON.parse(savedGalleryUrlsJson)
        : [];
      const fallbackGalleryCaptions = savedGalleryCaptionsJson
        ? JSON.parse(savedGalleryCaptionsJson)
        : [];

      if (Array.isArray(fallbackGalleryUrls)) {
        setSavedGalleryPhotoUrls(
          fallbackGalleryUrls.filter(
            (value): value is string =>
              typeof value === "string" && Boolean(value.trim())
          )
        );
      }

      if (Array.isArray(fallbackGalleryCaptions)) {
        setSavedGalleryPhotoCaptions(
          fallbackGalleryCaptions.map((value) =>
            typeof value === "string" ? value : ""
          )
        );
      }
    } catch (error) {
      console.error(
        "STRIPE RETURN GALLERY FALLBACK RESTORE ERROR:",
        error
      );
    }
  }
}
    const selectedPlan =
  planFromUrl === "free" ||
  planFromUrl === "basic" ||
  planFromUrl === "plus" ||
  planFromUrl === "premium"
    ? planFromUrl
    : parsedDraft?.plan ||
      (isPersonalModeFromUrl ? "free" : form.plan || "basic");
setForm((prev) => ({
  ...prev,
  plan: selectedPlan,
}));
    const planPrices = {
      basic: 4995,
      plus: 6995,
      premium: 8995,
    };

    if (savedDraft) {
  setForm({
    ...initialForm,
    ...parsedDraft,
    plan: selectedPlan,
    betaCode:
      planFromUrl === "free" && !promoFromUrl
        ? ""
        : parsedDraft?.betaCode || "",
    isLivingPreplan: isPersonalModeFromUrl
      ? true
      : isMemorialModeFromUrl
        ? false
        : parsedDraft?.isLivingPreplan === true,

promotionCategory:
  isPersonalModeFromUrl ||
  parsedDraft?.isLivingPreplan === true
    ? "personal"
    : parsedDraft?.promotionCategory || initialForm.promotionCategory,
  });

      if (localStorage.getItem("agreedToTerms") === "true") {
        setAgreedToTerms(true);
      }
    } else {
      setForm((prev) => ({
        ...prev,
        isLivingPreplan: isPersonalModeFromUrl,
        promotionCategory: isPersonalModeFromUrl
          ? "personal"
          : prev.promotionCategory || "personal",
      }));
    }

    setDraftReady(true);

    if (promoFromUrl) {
      setForm((prev) => ({
        ...prev,
        betaCode: promoFromUrl.toUpperCase(),
        isLivingPreplan: isPersonalModeFromUrl || prev.isLivingPreplan,
      }));

      setSuccessMessage(
        "Your free memorial access is ready. Review the Terms of Service and click Activate Free Premium Access below."
      );

      setTimeout(() => {
        document
          .getElementById("promo-access")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 750);
    }

    if (extraVideosPaid > 0) {
      const savedExtraVideos = Number(
        localStorage.getItem("paidExtraVideos") || 0
      );
      const newTotal = savedExtraVideos + extraVideosPaid;

      localStorage.setItem("paidExtraVideos", String(newTotal));
      setPaidExtraVideos(newTotal);

      window.history.replaceState(
        {},
        "",
        isPersonalModeFromUrl
          ? "/create?mode=personal"
          : isMemorialModeFromUrl
            ? "/create?mode=memorial"
            : "/create"
      );
    } else {
      setPaidExtraVideos(Number(localStorage.getItem("paidExtraVideos") || 0));
    }

   if (!sessionId && autoCheckout !== "1" && !giftToken) {
  setIsPaid(false);
  return;
}
if (giftToken) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    setIsPaid(false);
    setSuccessMessage(
      "Please sign in with the email address that received this Gift."
    );
    return;
  }

  try {
    const giftResponse = await fetch(
      `/api/gift-claim/${encodeURIComponent(giftToken)}/access`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const giftResult = await giftResponse.json();

    if (!giftResponse.ok || giftResult.valid !== true) {
      setIsPaid(false);
      setSuccessMessage(
        giftResult.error || "This Gift could not be verified."
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      plan: giftResult.plan,
    }));

    setIsPaid(true);
    setSuccessMessage(
      `Your gifted ${
        giftResult.plan === "premium"
          ? "Premium"
          : giftResult.plan === "plus"
            ? "Plus"
            : "Basic"
      } Memorial is ready to create.`
    );

    return;
  } catch (error) {
    console.error("Gift access error:", error);

    setIsPaid(false);
    setSuccessMessage("This Gift could not be verified.");
    return;
  }
}
    if (
      autoCheckout === "1" &&
      selectedPlan !== "free"
    ) {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: planPrices[selectedPlan as keyof typeof planPrices],
          returnUrl:
            `${window.location.origin}/create?` +
            `${builderModeQuery}` +
            `plan=${encodeURIComponent(selectedPlan)}`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        if (
          typeof window !== "undefined" &&
          typeof (window as any).fbq === "function"
        ) {
          (window as any).fbq("track", "InitiateCheckout", {
            value: planPrices[selectedPlan as keyof typeof planPrices] / 100,
            currency: "USD",
            content_name: selectedPlan,
          });
        }

        setTimeout(() => {
          window.location.href = data.url;
        }, 2000);

        return;
      }

      setSuccessMessage(
        data?.error ||
          "Checkout could not be started. Please try again."
      );
      setIsPaid(false);
      return;
    }

    if (!sessionId) {
      return;
    }

    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (data.paid === true) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const paidBuilderPath =
            `/create?${builderModeQuery}` +
            `plan=${encodeURIComponent(selectedPlan)}` +
            `&success=true&session_id=${encodeURIComponent(sessionId)}`;

          window.location.replace(
            `/login?mode=choice&redirect=${encodeURIComponent(paidBuilderPath)}`
          );
          return;
        }

        setIsPaid(true);
        setSuccessMessage("Payment Successful");
        setIsResolvingPaymentReturn(false);

        setTimeout(() => {
          paymentSuccessBoxRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);

        if (
          typeof window !== "undefined" &&
          typeof (window as any).fbq === "function"
        ) {
          (window as any).fbq("track", "Purchase", {
            value: planPrices[selectedPlan as keyof typeof planPrices] / 100,
            currency: "USD",
            content_name: selectedPlan,
          });
        }
      } else {
        setIsPaid(false);
        setIsResolvingPaymentReturn(false);
      }
    } catch (error) {
      console.error("PAYMENT VERIFICATION ERROR:", error);
      setIsPaid(false);
      setIsResolvingPaymentReturn(false);
      setErrorMessage(
        "We could not confirm this payment yet. Please refresh the page or return to MyEMemorials and try again."
      );
    }
  }

  verifyPayment();
}, [searchParams]);
useEffect(() => {
  if (!draftReady) return;

  const isPersonalModeFromUrl =
  searchParams.get("mode") === "personal" ||
  searchParams.get("mode") === "preplan";

const shouldBePersonal =
  form.isLivingPreplan || isPersonalModeFromUrl;

const {
  backupPassword: _backupPassword,
  secondaryBackupPassword: _secondaryBackupPassword,
  ...browserSafeForm
} = form;

localStorage.setItem(
  "memorialDraft",
  JSON.stringify({
    ...browserSafeForm,
    isLivingPreplan: shouldBePersonal,
    promotionCategory: shouldBePersonal
      ? "personal"
      : form.promotionCategory,
  })
);
}, [draftReady, form, searchParams]);
  function saveExistingEditRecovery(nextForm: FormState) {
  if (
    isBackupAccess ||
    !draftMemorialId ||
    typeof window === "undefined"
  ) {
    return;
  }

  /*
   * Keep a browser-side safety copy of unsaved edits.
   * Do NOT store the Backup Person password or server-controlled
   * funeral-home status fields in the recovery copy.
   */
  const recoveryForm: Partial<FormState> = {
    ...nextForm,
  };

  delete recoveryForm.backupPassword;
  delete recoveryForm.secondaryBackupPassword;

  // Plan changes come only from the server/Stripe flow. Do not persist
  // plan in the emergency browser recovery copy.
  delete recoveryForm.plan;
  delete recoveryForm.secondaryBackupActivatedAt;
  delete recoveryForm.secondaryBackupActivatedBy;

  delete recoveryForm.primaryFuneralHomeEmailVerified;
  delete recoveryForm.primaryFuneralHomeNotifiedAt;
  delete recoveryForm.primaryFuneralHomeAcknowledgedAt;
  delete recoveryForm.primaryFuneralHomeUnavailableAt;
  delete recoveryForm.primaryFuneralHomeUnavailableReason;

  delete recoveryForm.alternateFuneralHomeActivatedAt;
  delete recoveryForm.alternateFuneralHomeEmailVerified;
  delete recoveryForm.alternateFuneralHomeNotifiedAt;
  delete recoveryForm.alternateFuneralHomeAcknowledgedAt;

  localStorage.setItem(
    `memorialUnsavedEdit:${draftMemorialId}`,
    JSON.stringify(recoveryForm)
  );
}

function handleChange(
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  const { name, value } = e.target;

  if (BACKUP_PERSON_CHAPTER_FIELDS.has(name)) {
    setBackupPersonChapterDirty(true);
    setShowBackupSetupCompleteMessage(false);
    setShowBackupSaveConfirmationMessage(false);
  }

  if (BACKUP_ACCESS_WORKFLOW_FIELDS.has(name)) {
    setBackupAccessWorkflowDirty(true);
  }

  setForm((previousForm) => {
    const nextForm = {
      ...previousForm,
      [name]: value,
    };

    saveExistingEditRecovery(nextForm);

    return nextForm;
  });
}

  async function handleCenterMap() {
  try {
    const street = String(form.mapStreet ?? "").trim();
    const city = String(form.mapCity ?? "").trim();
    const state = String(form.mapState ?? "").trim();
    const zip = String(form.mapZip ?? "").trim();
    const country = String(form.mapCountry ?? "").trim() || "USA";

    if (!street && !city && !state && !zip) {
      setMapSearchStatus(
        "Enter at least a city and state, or a full address."
      );
      return;
    }

    setMapSearchStatus("Searching for location...");

    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        street,
        city,
        state,
        zip,
        country,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMapSearchStatus(
        data.error || "No matching location found."
      );
      return;
    }

    const nextLat = Number(data.lat);
    const nextLng = Number(data.lng);

    if (
      !Number.isFinite(nextLat) ||
      !Number.isFinite(nextLng)
    ) {
      setMapSearchStatus(
        "The location service returned invalid coordinates."
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      graveLat: nextLat.toFixed(6),
      graveLng: nextLng.toFixed(6),
    }));

    setMapSearchStatus(
      "Map centered on the address. You can now zoom in and place the pin."
    );
  } catch (error) {
    console.error("Geocoding failed:", error);

    setMapSearchStatus(
      error instanceof Error
        ? `Could not search that location: ${error.message}`
        : "Could not search that location."
    );
  }
}
function handleUseCurrentLocation() {
  if (!navigator.geolocation) {
    setLocationStatus(
      "Current location is not supported by this browser."
    );
    return;
  }

  setLocationStatus("Finding your current location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setForm((prev) => ({
        ...prev,
        graveLat: latitude.toFixed(6),
        graveLng: longitude.toFixed(6),
      }));

      setLocationStatus(
        "Current location found. The map pin has been updated."
      );
    },
    (error) => {
      console.error("CURRENT LOCATION ERROR:", error);

      if (error.code === error.PERMISSION_DENIED) {
        setLocationStatus(
          "Location permission was denied. Please allow location access in your browser and try again."
        );
        return;
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        setLocationStatus(
          "Your current location could not be determined."
        );
        return;
      }

      if (error.code === error.TIMEOUT) {
        setLocationStatus(
          "Finding your location took too long. Please try again."
        );
        return;
      }

      setLocationStatus(
        "Your current location could not be determined."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}






async function getVideoDurationWithRetry(
  file: File,
  maxAttempts = 2
): Promise<number> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await MediaEngine.getVideoDuration(file);
    } catch (error) {
      lastError = error;

      console.warn(
        `VIDEO METADATA READ ATTEMPT ${attempt} FAILED FOR "${file.name}":`,
        error
      );

      if (attempt < maxAttempts) {
        /*
         * Some browsers can briefly fail to expose metadata immediately
         * after the file picker closes. Give the browser a short moment,
         * then retry once before reporting a visible error.
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 300)
        );
      }
    }
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          `Could not read video duration for ${file.name}`
        )
  );
}

async function addVideoFiles(
  files: File[]
): Promise<boolean> {
  const selectedPlan = form.plan as PlanKey;

  if (files.length === 0) {
    return false;
  }

  setVideoError("");

  const limits = PLAN_LIMITS[selectedPlan];

  if (!limits) {
    setVideoError(
      "Please choose a memorial plan before adding videos."
    );
    return false;
  }

  const oversizedFile = files.find(
    (file) => file.size > MAX_VIDEO_SIZE_BYTES
  );

  if (oversizedFile) {
    setVideoError(
      `"${oversizedFile.name}" is too large. Maximum video size is 1 GB.`
    );
    return false;
  }

  const existingNames = new Set(
    videoFiles.map((file) => file.name)
  );

  const newUniqueFiles = files.filter(
    (file) => !existingNames.has(file.name)
  );

  if (newUniqueFiles.length === 0) {
    setVideoError(
      "That video has already been added."
    );
    return false;
  }

  const totalAllowedVideoMinutes =
    limits.videoMinutes + paidExtraVideos * 10;

  const maxTotalVideoSeconds =
    totalAllowedVideoMinutes * 60;

  try {
    let existingVideoSeconds = 0;

    for (const file of videoFiles) {
      existingVideoSeconds +=
        await getVideoDurationWithRetry(file);
    }

    let newVideoSeconds = 0;

    for (const file of newUniqueFiles) {
      const duration =
        await getVideoDurationWithRetry(file);

      if (duration > 300) {
        setVideoError(
          `"${file.name}" is longer than 5 minutes. Maximum video length is 5 minutes.`
        );
        return false;
      }

      newVideoSeconds += duration;
    }

    if (
      existingVideoSeconds + newVideoSeconds >
      maxTotalVideoSeconds
    ) {
      setVideoError(
        `${limits.label} currently allows up to ${totalAllowedVideoMinutes} minutes of Video Memories, including purchased extra video time.`
      );
      return false;
    }
  } catch (error) {
    console.error(
      "VIDEO FILE VALIDATION ERROR:",
      error
    );

    setVideoError(
      error instanceof Error
        ? `Could not read the selected video. ${error.message}. Please try selecting the file again or use a different video file.`
        : "Could not read the selected video. Please try selecting the file again or use a different video file."
    );

    return false;
  }

  setVideoFiles((previousFiles) => [
    ...previousFiles,
    ...newUniqueFiles,
  ]);

  setVideoNotes((previousNotes) => [
    ...previousNotes,
    ...newUniqueFiles.map(() => ""),
  ]);

  setVideoError("");
  return true;
}

async function handleVideoChange(
  e: ChangeEvent<HTMLInputElement>
) {
  const files = Array.from(
    e.target.files || []
  );

  try {
    await addVideoFiles(files);
  } catch (error) {
    /*
     * Final UI safety net. addVideoFiles handles expected validation
     * failures itself, but no unexpected browser/file error should ever
     * leave the user with a silent first-attempt failure.
     */
    console.error(
      "VIDEO FILE SELECTION ERROR:",
      error
    );

    setVideoError(
      error instanceof Error
        ? `Could not add the selected video. ${error.message}`
        : "Could not add the selected video. Please try again."
    );
  } finally {
    e.target.value = "";
  }
}


  async function postMemorialUpdate(
    body: Record<string, unknown>
  ) {
    const sendRequest = (
      accessToken?: string
    ) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization =
          `Bearer ${accessToken}`;
      }

      return fetch(
        "/api/memorials/update",
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
    };

    /*
     * Backup Person authority is verified exclusively by the
     * protected Backup Person cookie.
     */
    if (isBackupAccess) {
      return sendRequest();
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "Please sign in again before saving this memorial."
      );
    }

    let response =
      await sendRequest(
        session.access_token
      );

    /*
     * If the server says the owner token has just expired,
     * refresh the Supabase session once and retry the same save.
     */
    if (response.status === 401) {
      const {
        data: refreshedData,
        error: refreshError,
      } = await supabase.auth.refreshSession();

      const refreshedToken =
        refreshedData.session?.access_token;

      if (
        !refreshError &&
        refreshedToken
      ) {
        response =
          await sendRequest(
            refreshedToken
          );
      }
    }

    return response;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const galleryPhotosForSave = galleryPhotosRef.current;
      const savedGalleryPhotoCaptionsForSave =
        savedGalleryPhotoCaptionsRef.current;
      const videoNotesForSave = videoNotesRef.current;
      const savedVideoNotesForSave =
        savedVideoNotesRef.current;

      const baseSlug = SlugEngine.createBaseSlug({
  firstName: form.firstName,
  middleName: form.middleName,
  lastName: form.lastName,
});

      let selectedPlan = form.plan as PlanKey;
const limits = PLAN_LIMITS[selectedPlan];

ValidationEngine.validateBasicMemorial({
  firstName: form.firstName,
  lastName: form.lastName,
  selectedPlan: form.plan,
  planLimits: limits,
  isPaid: isPaid || selectedPlan === "free",
  galleryPhotos: galleryPhotosForSave,
});

      const totalAllowedVideoMinutes =
  limits.videoMinutes + paidExtraVideos * 10;

await ValidationEngine.validateVideos({
  videoFiles,
  getVideoDuration: MediaEngine.getVideoDuration,
  maximumVideoMinutes: totalAllowedVideoMinutes,
  planLabel: limits.label,
});



    const slug =
  draftMemorialId && draftMemorialSlug
    ? draftMemorialSlug
    : await SlugEngine.createUniqueSlug(baseSlug);

const folder = slug;

/*
 * Start with anything that was already saved in the Guided draft.
 * If this is a brand-new memorial, these values will simply be empty.
 */
let featuredPhotoUrl = form.featuredPhotoUrl || "";
let bannerPhotoUrl = form.bannerPhotoUrl || "";
let bannerSourcePhotoUrl = form.bannerSourcePhotoUrl || bannerPhotoUrl;
let headstonePhoto1Url = savedHeadstonePhoto1Url;
let headstonePhoto2Url = savedHeadstonePhoto2Url;
let obituaryImageUrl =
  form.obituaryImageUrl || savedObituaryImageUrl;

let galleryPhotoUrls = [...savedGalleryPhotoUrls];

let newspaperArticleUrls =
  savedNewspaperArticleUrls.length > 0
    ? [...savedNewspaperArticleUrls]
    : splitGalleryPhotos(form.newspaperArticles);

let videoLinkThumbnailUrls = [
  ...(form.videoLinkThumbnailUrls ?? []),
];

let combinedUploadedVideos = savedVideoUrls.map(
  (playbackId, index) => ({
    playbackId,
    durationSeconds: 0,
    note: savedVideoNotesForSave[index] || "",
    originalFilename: "",
    fileSize: 0,
  })
);

/*
 * Upload any new media selected since the last draft save.
 */

if (featuredPhoto) {
  const uploadedFeaturedPhotoUrl =
    await MediaEngine.uploadOptionalFile(
      featuredPhoto,
      folder,
      "memorial-photos"
    );

  if (uploadedFeaturedPhotoUrl) {
    featuredPhotoUrl = uploadedFeaturedPhotoUrl;
  }
}

if (bannerPhoto) {
  /*
   * Preserve the owner's original narrow source separately when
   * an AI-extended banner was created from it.
   */
  if (
    bannerSourcePhotoFile &&
    bannerSourcePhotoFile !== bannerPhoto
  ) {
    const uploadedSourcePhotoUrl =
      await MediaEngine.uploadOptionalFile(
        bannerSourcePhotoFile,
        folder,
        "memorial-photos"
      );

    if (uploadedSourcePhotoUrl) {
      bannerSourcePhotoUrl =
        uploadedSourcePhotoUrl;
    }
  }

  const uploadedBannerPhotoUrl =
    await MediaEngine.uploadOptionalFile(
      bannerPhoto,
      folder,
      "memorial-photos"
    );

  if (uploadedBannerPhotoUrl) {
    bannerPhotoUrl = uploadedBannerPhotoUrl;

    if (
      !bannerSourcePhotoFile ||
      bannerSourcePhotoFile === bannerPhoto
    ) {
      bannerSourcePhotoUrl =
        uploadedBannerPhotoUrl;
    }
  }
}

if (headstonePhoto1) {
  const uploadedHeadstonePhoto1Url =
    await MediaEngine.uploadOptionalFile(
      headstonePhoto1,
      folder,
      "memorial-photos"
    );

  if (uploadedHeadstonePhoto1Url) {
    headstonePhoto1Url = uploadedHeadstonePhoto1Url;
  }
}

if (headstonePhoto2) {
  const uploadedHeadstonePhoto2Url =
    await MediaEngine.uploadOptionalFile(
      headstonePhoto2,
      folder,
      "memorial-photos"
    );

  if (uploadedHeadstonePhoto2Url) {
    headstonePhoto2Url = uploadedHeadstonePhoto2Url;
  }
}

if (obituaryImageFile) {
  const uploadedObituaryImageUrl =
    await MediaEngine.uploadOptionalFile(
      obituaryImageFile,
      folder,
      "memorial-photos"
    );

  if (uploadedObituaryImageUrl) {
    obituaryImageUrl = uploadedObituaryImageUrl;
  }
}

if (videoLinkThumbnailFiles.length > 0) {
  for (
    let index = 0;
    index < videoLinkThumbnailFiles.length;
    index++
  ) {
    const file = videoLinkThumbnailFiles[index];

    if (!file) {
      continue;
    }

    const uploadedThumbnailUrl =
      await MediaEngine.uploadOptionalFile(
        file,
        folder,
        "memorial-photos"
      );

    if (uploadedThumbnailUrl) {
      videoLinkThumbnailUrls[index] =
        uploadedThumbnailUrl;
    }
  }

  setForm((previousForm) => ({
    ...previousForm,
    videoLinkThumbnailUrls,
  }));
}
if (galleryPhotosForSave.length > 0) {
  const newlyUploadedGalleryPhotoUrls =
    await MediaEngine.uploadSelectedGalleryPhotos({
      photos: galleryPhotosForSave,
      slug,
      setGalleryPhotos,
      setGalleryUploadProgress,
      setIsGalleryUploading,
    });

  galleryPhotoUrls = [
    ...galleryPhotoUrls,
    ...newlyUploadedGalleryPhotoUrls,
  ];
}
const galleryPhotoCaptions = [
  ...savedGalleryPhotoCaptionsForSave,
  ...galleryPhotosForSave.map((photo) => photo.caption || ""),
].slice(0, galleryPhotoUrls.length);

setSavedGalleryPhotoCaptions(galleryPhotoCaptions);

if (newspaperArticleFiles.length > 0) {
  const newlyUploadedNewspaperArticleUrls =
    await Promise.all(
      newspaperArticleFiles.map((file) =>
        MediaEngine.uploadOptionalFile(
          file,
          folder,
          "memorial-articles"
        )
      )
    );

  newspaperArticleUrls = [
    ...newspaperArticleUrls,
    ...newlyUploadedNewspaperArticleUrls.filter(
      (url): url is string => Boolean(url)
    ),
  ];
}

const normalizedExistingFavoriteSongs = normalizeFavoriteSongEntries(
  savedFavoriteSongUrlsRef.current,
  savedFavoriteSongNotesRef.current
);

let favoriteSongUrls = normalizedExistingFavoriteSongs.urls;
let favoriteSongNotes = normalizedExistingFavoriteSongs.notes;

setSavedFavoriteSongUrls(favoriteSongUrls);
setSavedFavoriteSongNotes(favoriteSongNotes);

if (favoriteSongFiles.length > 0) {
  const uploadedFavoriteSongUrls =
    await Promise.all(
      favoriteSongFiles.map((file) =>
        MediaEngine.uploadOptionalFile(
          file,
          slug,
          "memorial-audio"
        )
      )
    );

  const validUploadedFavoriteSongUrls =
    uploadedFavoriteSongUrls.filter(
      (url): url is string => Boolean(url)
    );

  favoriteSongUrls = [
    ...savedFavoriteSongUrlsRef.current,
    ...validUploadedFavoriteSongUrls,
  ].slice(0, 5);

  favoriteSongNotes = [
    ...savedFavoriteSongNotesRef.current,
    ...selectedFavoriteSongNotes,
  ].slice(0, 5);

  setSavedFavoriteSongUrls(favoriteSongUrls);
  setSavedFavoriteSongNotes(favoriteSongNotes);

  setFavoriteSongFiles([]);
  setSelectedFavoriteSongNotes([]);
}

if (videoFiles.length > 0) {
  const newlyUploadedVideos =
    await MediaEngine.uploadVideos({
      videoFiles,
      videoNotes: videoNotesForSave,
    });

  combinedUploadedVideos = [
    ...combinedUploadedVideos,
    ...newlyUploadedVideos,
  ];
}
const fullName = [
  form.firstName,
  form.middleName,
  form.lastName,
  form.maidenName ? `(${form.maidenName})` : "",
]
  .filter(Boolean)
  .join(" ")
  .replace(/\s+/g, " ")
  .trim();

const normalizedName = `${form.firstName} ${form.lastName}`
  .trim()
  .toLowerCase();

const requiresReview = famousNames.includes(normalizedName);

const {
  data: { user: authUser },
  error: authError,
} = await supabase.auth.getUser();

if (authError) {
  console.error("Auth error:", authError);
}

let usingBetaCode = false;

if (form.betaCode.trim()) {
  const enteredCode = form.betaCode.trim().toUpperCase();

  const res = await fetch("/api/validate-promo-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: enteredCode,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error || "Invalid or inactive promo code."
    );
  }

  const promoCode = data.promoCode;

  usingBetaCode = true;

  if (promoCode.allowed_plan) {
    selectedPlan = promoCode.allowed_plan as PlanKey;
  }
}

const memorialData = PersistenceEngine.buildMemorialData({
  slug,
  form,
  fullName,
  ownerId:
  existingMemorialOwnerId ??
  authUser?.id ??
  null,
  selectedPlan,
  requiresReview,
  usingBetaCode,
  featuredPhotoUrl,
  bannerPhotoUrl,
  bannerSourcePhotoUrl,
  headstonePhoto1Url,
  headstonePhoto2Url,
  obituaryImageUrl,
  galleryPhotoUrls,
galleryPhotoCaptions,
newspaperArticleUrls,
favoriteSongUrl: favoriteSongUrls[0] ?? "",
favoriteSongUrls,
favoriteSongNotes,
videoLinkThumbnailUrls,
uploadedVideos: combinedUploadedVideos,
  isDraft: false,
guidedCurrentChapter: null,
existingIsPublished: isExistingMemorialEdit
  ? true
  : null,
});

let completedMemorialId: number;

if (draftMemorialId) {
  const updateResponse =
    await postMemorialUpdate({
      memorialId: draftMemorialId,
      updatePayload: memorialData,
      ...(isBackupAccess
        ? {}
        : {
            giftToken:
              searchParams.get("gift"),
            sessionId:
              searchParams.get("session_id"),
            promoCode:
              form.betaCode.trim() || null,
          }),
    });

  const updateResult =
    await updateResponse.json();

  if (!updateResponse.ok) {
    throw new Error(
      updateResult.error ||
        "The memorial could not be saved."
    );
  }

  const updateWarning =
    getApiWarningMessage(updateResult);

  if (updateWarning) {
    alert(updateWarning);
  }

  completedMemorialId = draftMemorialId;
} else {
  const createResult =
  await PersistenceEngine.createMemorial({
    slug,
    memorialData,
    giftToken:
      searchParams.get("gift"),
    sessionId:
      searchParams.get("session_id"),
    promoCode:
      form.betaCode.trim() || null,
  });

  if (!createResult.success || !createResult.memorialId) {
    throw new Error(
      createResult.error ||
        "The memorial could not be created."
    );
  }

  completedMemorialId = createResult.memorialId;
}
if (form.isLivingPreplan && !isBackupAccess) {
  await saveBackupSettings(completedMemorialId);
}
if (videoFiles.length > 0) {
  const newlyUploadedVideosOnly =
    combinedUploadedVideos.slice(savedVideoUrls.length);

  if (newlyUploadedVideosOnly.length > 0) {
    await PersistenceEngine.createMemorialVideos({
      memorialId: completedMemorialId,
      videos: newlyUploadedVideosOnly,
    });
  }
}
if (usingBetaCode && form.betaCode.trim()) {
  await PersistenceEngine.incrementPromoCodeUsage(
    form.betaCode
  );
}
      localStorage.removeItem("memorialDraft");
localStorage.removeItem("paidExtraVideos");
localStorage.removeItem("guidedDraftMemorialId");
localStorage.removeItem("guidedDraftMemorialSlug");
localStorage.removeItem("guidedDraftCurrentChapter");
localStorage.removeItem(
  `memorialUnsavedEdit:${completedMemorialId}`
);
/*
 * Do not reset React form/media state before navigating away. Resetting here
 * briefly repaints Chapter 1 after Finish Review, which makes the completed
 * memorial appear to jump backward before MyEMemorials opens. The browser
 * storage above is already cleared, so navigation can happen immediately.
 */

if (requiresReview) {
  alert(
    "This memorial requires review before publication."
  );
}

if (isBackupAccess) {
  window.location.assign(
    `/memorial/${slug}/manage`
  );
} else {
  window.location.assign("/my-memorials");
}

return;
    } catch (error) {
      console.error("CREATE MEMORIAL ERROR:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(`Problem: ${message}`);
      setIsSubmitting(false);
    }
  }
  async function saveBackupSettings(memorialId: number) {
  /*
   * Legacy Instructions are a paid Living MyEMemorial feature.
   * Normal Free-plan Guided Flow saves must skip this private
   * Backup Person/settings API entirely.
   */
  if (
    !form.isLivingPreplan ||
    isBackupAccess ||
    form.plan === "free" ||
    !isPaid
  ) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Please sign in again before saving your Backup Person information."
    );
  }

  const primaryPasswordWasSubmitted =
    Boolean(form.backupPassword.trim());
  const secondaryPasswordWasSubmitted =
    Boolean(form.secondaryBackupPassword.trim());

  /*
   * Capture the saved Secondary identity before writing the new form.
   * A standby Secondary email replacement clears the old password but does
   * not use a revoked marker, so the client must remember that a fresh
   * password is still required before declaring setup complete.
   */
  const beforeAuthorityResponse = await fetch(
    `/api/backup-settings?memorialId=${encodeURIComponent(String(memorialId))}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    }
  );

  const beforeAuthorityResult = await beforeAuthorityResponse.json();

  if (!beforeAuthorityResponse.ok) {
    throw new Error(
      beforeAuthorityResult.error ||
        "The current Backup Person access state could not be checked."
    );
  }

  const savedSecondaryEmail = String(
    beforeAuthorityResult?.settings?.secondaryBackupEmail || ""
  )
    .trim()
    .toLowerCase();

  const nextSecondaryEmail = String(form.secondaryBackupEmail || "")
    .trim()
    .toLowerCase();

  const secondaryIdentityChanged =
    savedSecondaryEmail !== nextSecondaryEmail;

  const response = await fetch("/api/backup-settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      memorialId,

      backupPhone: form.backupPhone,

      secondaryBackupName: form.secondaryBackupName,
      secondaryBackupEmail: form.secondaryBackupEmail,
      secondaryBackupPhone: form.secondaryBackupPhone,

      hasWill: form.hasWill,
      willLocation: form.willLocation,
willAttorneyOffice: form.willAttorneyOffice,
hasLifeInsurance: form.hasLifeInsurance,
lifeInsuranceLocation: form.lifeInsuranceLocation,
      hasExecutor: form.hasExecutor,
      primaryBackupIsExecutor: form.primaryBackupIsExecutor,

      hasFuneralDecisionDesignee:
        form.hasFuneralDecisionDesignee,

      primaryBackupIsFuneralDesignee:
        form.primaryBackupIsFuneralDesignee,

      funeralDecisionPersonName:
        form.funeralDecisionPersonName,

      funeralDecisionPersonRelationship:
        form.funeralDecisionPersonRelationship,

      funeralAuthorityDocumentLocation:
        form.funeralAuthorityDocumentLocation,

      primaryFuneralHomeName:
        form.primaryFuneralHomeName,

      primaryFuneralHomeCity:
        form.primaryFuneralHomeCity,

      primaryFuneralHomeState:
        form.primaryFuneralHomeState,

      primaryFuneralHomeWebsite:
  form.primaryFuneralHomeWebsite,

primaryFuneralHomeEmail:
  form.primaryFuneralHomeEmail,



primaryFuneralHomeNotifyAuthorized:
  form.primaryFuneralHomeNotifyAuthorized,

alternateFuneralHomeName:
  form.alternateFuneralHomeName,

alternateFuneralHomeCity:
  form.alternateFuneralHomeCity,

alternateFuneralHomeState:
  form.alternateFuneralHomeState,

alternateFuneralHomeWebsite:
  form.alternateFuneralHomeWebsite,

alternateFuneralHomeEmail:
  form.alternateFuneralHomeEmail,



alternateFuneralHomeNotifyAuthorized:
  form.alternateFuneralHomeNotifyAuthorized,

      legacyInstructions:
  form.legacyInstructions,

privateOwnerMessage:
  form.privateOwnerMessage,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Backup Person information could not be saved."
    );
  }
 if (form.backupPassword.trim()) {
  const passwordResponse = await fetch(
    "/api/backup-person/set-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        memorialId,
        password: form.backupPassword,
        backupRole: "primary",
      }),
    }
  );

  const passwordResult =
    await passwordResponse.json();

  if (!passwordResponse.ok) {
    throw new Error(
      passwordResult.error ||
        "The Backup Person password could not be saved."
    );
  }

  setForm((previousForm) => ({
    ...previousForm,
    primaryBackupRevokedAt: "",
  }));
}

if (form.secondaryBackupPassword.trim()) {
  const secondaryPasswordResponse = await fetch(
    "/api/backup-person/set-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        memorialId,
        password: form.secondaryBackupPassword,
        backupRole: "secondary",
      }),
    }
  );

  const secondaryPasswordResult =
    await secondaryPasswordResponse.json();

  if (!secondaryPasswordResponse.ok) {
    throw new Error(
      secondaryPasswordResult.error ||
        "The Secondary Backup Person password could not be saved."
    );
  }
}

/*
 * Re-read the authoritative access state after every owner save.
 * Identity replacement can revoke a role on the server, so the
 * chapter must know that result before deciding whether it may
 * advance to Review.
 */
const authorityResponse = await fetch(
  `/api/backup-settings?memorialId=${encodeURIComponent(String(memorialId))}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  }
);

const authorityResult = await authorityResponse.json();

if (!authorityResponse.ok) {
  throw new Error(
    authorityResult.error ||
      "The Backup Person access state could not be refreshed."
  );
}

const authoritySettings = authorityResult?.settings || {};

const authorityState = {
  secondaryBackupActivatedAt:
    String(authoritySettings.secondaryBackupActivatedAt || ""),
  secondaryBackupActivatedBy:
    String(authoritySettings.secondaryBackupActivatedBy || ""),
  primaryBackupRevokedAt:
    String(authoritySettings.primaryBackupRevokedAt || ""),
  secondaryBackupRevokedAt:
    String(authoritySettings.secondaryBackupRevokedAt || ""),
};

const nextSecondaryFreshPasswordRequired =
  Boolean(nextSecondaryEmail) &&
  (
    (secondaryIdentityChanged && !secondaryPasswordWasSubmitted) ||
    (secondaryFreshPasswordRequired && !secondaryPasswordWasSubmitted)
  );

setSecondaryFreshPasswordRequired(
  nextSecondaryFreshPasswordRequired
);

setForm((previousForm) => ({
  ...previousForm,
  ...authorityState,
  ...(primaryPasswordWasSubmitted
    ? { backupPassword: "" }
    : {}),
  ...(secondaryPasswordWasSubmitted
    ? { secondaryBackupPassword: "" }
    : {}),
}));

return {
  authorityState,
  secondaryFreshPasswordRequired:
    nextSecondaryFreshPasswordRequired,
  accessWorkflowWasSaved:
    backupAccessWorkflowDirty ||
    primaryPasswordWasSubmitted ||
    secondaryPasswordWasSubmitted ||
    secondaryIdentityChanged ||
    secondaryFreshPasswordRequired,
};
}

async function activateSecondaryBackupPerson() {
  if (!draftMemorialId) {
    alert(
      "Please save this Living MyEMemorial before activating the Secondary Backup Person."
    );
    return;
  }

  const confirmed = window.confirm(
    "Activate the Secondary Backup Person now? Only do this if the Primary Backup Person is unable or no longer willing to serve."
  );

  if (!confirmed) {
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization =
      `Bearer ${session.access_token}`;
  }

  try {
    const response = await fetch(
      "/api/backup-person/activate-secondary",
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          memorialId: draftMemorialId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The Secondary Backup Person could not be activated."
      );
    }

    setForm((previousForm) => ({
      ...previousForm,
      secondaryBackupActivatedAt:
        result.activatedAt ||
        previousForm.secondaryBackupActivatedAt ||
        "",
      secondaryBackupActivatedBy:
        result.activatedBy ||
        previousForm.secondaryBackupActivatedBy ||
        "",
      secondaryBackupRevokedAt: "",
    }));

    setBackupAccessWorkflowDirty(false);
    setSecondaryFreshPasswordRequired(false);
    setShowBackupSetupCompleteMessage(true);

    alert(
      result.alreadyActivated
        ? "The Secondary Backup Person is already active."
        : "The Secondary Backup Person has been activated."
    );
  } catch (error) {
    console.error(
      "SECONDARY BACKUP ACTIVATION ERROR:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "The Secondary Backup Person could not be activated."
    );
  }
}

async function revokeBackupPerson(
  backupRole: "primary" | "secondary"
) {
  if (!draftMemorialId) {
    alert(
      "Please save this Living MyEMemorial before changing Backup Person access."
    );
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    alert(
      "Please sign in again before changing Backup Person access."
    );
    return;
  }

  const roleLabel =
    backupRole === "secondary"
      ? "Secondary Backup Person"
      : "Primary Backup Person";

  const warning =
    backupRole === "secondary"
      ? "End Secondary Backup Person access now?\n\nThis immediately revokes their access and removes their stored Backup Person password. If the Secondary is currently active, MyEMemorial will NOT automatically restore the Primary Backup Person."
      : "End Primary Backup Person access now?\n\nThis immediately revokes their access and removes their stored Backup Person password. MyEMemorial will NOT automatically activate the Secondary Backup Person.";

  if (!window.confirm(warning)) {
    return;
  }

  try {
    const response = await fetch(
      "/api/backup-person/revoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memorialId: draftMemorialId,
          backupRole,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          `${roleLabel} access could not be ended.`
      );
    }

    setForm((previousForm) => ({
      ...previousForm,
      ...(backupRole === "secondary"
        ? {
            secondaryBackupPassword: "",
            secondaryBackupRevokedAt:
              result.revokedAt ||
              previousForm.secondaryBackupRevokedAt ||
              new Date().toISOString(),
          }
        : {
            backupPassword: "",
            primaryBackupRevokedAt:
              result.revokedAt ||
              previousForm.primaryBackupRevokedAt ||
              new Date().toISOString(),
          }),
    }));

    setBackupAccessWorkflowDirty(false);
    setShowBackupSetupCompleteMessage(false);

    if (backupRole === "secondary") {
      setSecondaryFreshPasswordRequired(false);
    }

    alert(
      `${roleLabel} access has been ended immediately.`
    );
  } catch (error) {
    console.error(
      "BACKUP PERSON OWNER REVOCATION ERROR:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : `${roleLabel} access could not be ended.`
    );
  }
}

async function restorePrimaryBackupPerson() {
  if (!draftMemorialId) {
    alert(
      "Please save this Living MyEMemorial before restoring the Primary Backup Person."
    );
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    alert(
      "Please sign in again before restoring the Primary Backup Person."
    );
    return;
  }

  const confirmed = window.confirm(
    "Restore the Primary Backup Person as the active Backup Person?\n\nThis is an explicit role switch. The Secondary Backup Person will no longer be the active Backup Person, and existing Backup Person sessions will be invalidated."
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      "/api/backup-person/activate-primary",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memorialId: draftMemorialId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Primary Backup Person authority could not be restored."
      );
    }

    setForm((previousForm) => ({
      ...previousForm,
      secondaryBackupActivatedAt: "",
      secondaryBackupActivatedBy: "",
    }));

    setBackupAccessWorkflowDirty(false);
    setShowBackupSetupCompleteMessage(
      !secondaryFreshPasswordRequired
    );

    alert(
      result.alreadyActive
        ? "The Primary Backup Person is already active."
        : "The Primary Backup Person has been restored as the active Backup Person."
    );
  } catch (error) {
    console.error(
      "PRIMARY BACKUP RESTORE ERROR:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Primary Backup Person authority could not be restored."
    );
  }
}

async function notifyPrimaryFuneralHome() {
  if (!draftMemorialId) {
    alert(
      "Please save this Living MyEMemorial before notifying the funeral home."
    );
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    alert(
      "Please sign in again before notifying the funeral home."
    );
    return;
  }

  try {
    /*
 * Save the ENTIRE current Living MyEMemorial before notifying
 * the funeral home. This preserves unsaved memorial information
 * such as the owner's name as well as Backup Person, legal,
 * and funeral-home information.
 */
const backupPersonChapter = getGuidedChapters("personal").find(
  (chapter) => chapter.id === "backup-person"
);

if (!backupPersonChapter) {
  throw new Error(
    "The Backup Person chapter could not be found."
  );
}

await saveGuidedDraft(
  backupPersonChapter,
  false,
  true
);

const response = await fetch(
      "/api/funeral-home/notify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memorialId: draftMemorialId,
          funeralHomeType: "primary",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The funeral home could not be notified."
      );
    }

    setForm((previousForm) => ({
      ...previousForm,
      primaryFuneralHomeNotifiedAt:
        new Date().toISOString(),
    }));

    const notificationWarning =
      getApiWarningMessage(result);

    alert(
      notificationWarning
        ? `The funeral home preference notification was sent.\n\nImportant:\n${notificationWarning}`
        : "The funeral home preference notification was sent."
    );
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "The funeral home could not be notified."
    );
  }
}
async function notifyAlternateFuneralHome() {
  if (!draftMemorialId) {
    alert(
      "Please save this Living MyEMemorial before notifying the alternate funeral home."
    );
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  /*
   * Owners authenticate with their Supabase session.
   * Backup Persons authenticate with the protected
   * Backup Person cookie instead.
   */
  if (
    !isBackupAccess &&
    !session?.access_token
  ) {
    alert(
      "Please sign in again before notifying the alternate funeral home."
    );
    return;
  }

  try {
    const requestHeaders:
      Record<string, string> = {
        "Content-Type": "application/json",
      };

    /*
     * Only owners send the Supabase bearer token.
     * Backup Person access is verified server-side
     * using the HTTP-only Backup Person cookie.
     */
    if (
      !isBackupAccess &&
      session?.access_token
    ) {
      requestHeaders.Authorization =
        `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      "/api/funeral-home/notify",
      {
        method: "POST",
        headers: requestHeaders,
        credentials: "include",
        body: JSON.stringify({
          memorialId: draftMemorialId,
          funeralHomeType: "alternate",
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The alternate funeral home could not be notified."
      );
    }

    setForm((previousForm) => ({
      ...previousForm,
      alternateFuneralHomeNotifiedAt:
        new Date().toISOString(),
    }));

    const notificationWarning =
      getApiWarningMessage(result);

    alert(
      notificationWarning
        ? `The alternate funeral home preference notification was sent.\n\nImportant:\n${notificationWarning}`
        : "The alternate funeral home preference notification was sent."
    );
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "The alternate funeral home could not be notified."
    );
  }
}
async function activateAlternateFuneralHome() {
  if (!draftMemorialId) {
    alert(
      "Please save this Living MyEMemorial before activating the alternate funeral home."
    );
    return;
  }

  const reason = window.prompt(
    "Why is the Primary Funeral Home unavailable?"
  );

  if (!reason?.trim()) {
    return;
  }

  const {
  data: { session },
} = await supabase.auth.getSession();

if (!isBackupAccess && !session?.access_token) {
  alert(
    "Please sign in again before activating the alternate funeral home."
  );
  return;
}

try {
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBackupAccess && session?.access_token) {
    requestHeaders.Authorization =
      `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    "/api/funeral-home/activate-alternate",
    {
      method: "POST",
      headers: requestHeaders,
      credentials: "include",
      body: JSON.stringify({
        memorialId: draftMemorialId,
        reason: reason.trim(),
      }),
    }
  );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The alternate funeral home could not be activated."
      );
    }

    setForm((previousForm) => ({
      ...previousForm,
      primaryFuneralHomeUnavailableAt:
        result.primaryFuneralHomeUnavailableAt || "",
      primaryFuneralHomeUnavailableReason:
        result.primaryFuneralHomeUnavailableReason || "",
      alternateFuneralHomeActivatedAt:
        result.alternateFuneralHomeActivatedAt || "",
    }));

    alert(
      "The Primary Funeral Home has been marked unavailable and the Alternate Funeral Home is now active."
    );
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "The alternate funeral home could not be activated."
    );
  }
}
async function reportDeath() {
  if (!draftMemorialId) {
    alert(
      "This Living MyEMemorial must be saved before a death can be reported."
    );
    return;
  }

  const note = window.prompt(
    "Optional: Add any information that may help MyEMemorial verify the death."
  );

  if (note === null) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to report that this person has died?\n\nSubmitting this report will begin the verification process. It will NOT immediately unlock post-death access."
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      "/api/backup-person/report-death",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          memorialId: draftMemorialId,
          deathReportNote: note.trim(),
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The death report could not be submitted."
      );
    }

    if (result.alreadyReported) {
      alert(
        "A death report has already been submitted for this Living MyEMemorial and is awaiting verification."
      );
      return;
    }

    const reportWarning =
      getApiWarningMessage(result);

    alert(
      reportWarning
        ? `The death report has been submitted. Post-death access remains locked until the death is independently verified.\n\nImportant:\n${reportWarning}`
        : "The death report has been submitted. Post-death access remains locked until the death is independently verified."
    );
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "The death report could not be submitted."
    );
  }
}
async function unlockPostDeathAccess() {
  if (!draftMemorialId) {
    alert(
      "This Living MyEMemorial must be saved before post-death access can be activated."
    );
    return;
  }

  const confirmed = window.confirm(
    "The death must already have been independently verified.\n\nActivate post-death access for this Living MyEMemorial?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      "/api/backup-person/unlock-post-death",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          memorialId: draftMemorialId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Post-death access could not be activated."
      );
    }

    if (result.alreadyUnlocked) {
      alert(
        "Post-death access has already been activated for this Living MyEMemorial."
      );
    } else {
      alert(
        "Post-death access has been activated. The memorial will now reload in after-death mode."
      );
    }

    window.location.reload();
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Post-death access could not be activated."
    );
  }
}
async function handleCompletePlanPayment() {
  const selectedPlan = form.plan;

  if (
    selectedPlan !== "basic" &&
    selectedPlan !== "plus" &&
    selectedPlan !== "premium"
  ) {
    return;
  }

  const planPrices = {
    basic: 4995,
    plus: 6995,
    premium: 8995,
  } as const;

  localStorage.setItem(
    "memorialDraft",
    JSON.stringify({
      ...form,
      plan: selectedPlan,
    })
  );

  /*
   * The gallery is intentionally kept outside `form`. Preserve its current
   * server-backed URLs/captions before leaving for Stripe so the same draft
   * can be reconstructed even if the return-page database read is delayed.
   */
  localStorage.setItem(
    "guidedDraftGalleryPhotoUrls",
    JSON.stringify(savedGalleryPhotoUrlsRef.current)
  );
  localStorage.setItem(
    "guidedDraftGalleryPhotoCaptions",
    JSON.stringify(savedGalleryPhotoCaptionsRef.current)
  );

  if (draftMemorialId) {
    localStorage.setItem(
      "guidedDraftMemorialId",
      String(draftMemorialId)
    );

    if (draftMemorialSlug) {
      localStorage.setItem(
        "guidedDraftMemorialSlug",
        draftMemorialSlug
      );
    }
  }

  const resumeMemorialQuery = draftMemorialId
    ? `&resume=${encodeURIComponent(String(draftMemorialId))}`
    : "";

  setIsStartingPlanCheckout(true);

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: selectedPlan,
        amount: planPrices[selectedPlan],
        memorialId: draftMemorialId,
        returnUrl:
          `${window.location.origin}/create?` +
          `${form.isLivingPreplan ? "mode=personal&" : "mode=memorial&"}` +
          `plan=${encodeURIComponent(selectedPlan)}` +
          resumeMemorialQuery,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      throw new Error(
        data?.error ||
          "Checkout could not be started. Please try again."
      );
    }

    if (
      typeof window !== "undefined" &&
      typeof (window as any).fbq === "function"
    ) {
      (window as any).fbq("track", "InitiateCheckout", {
        value: planPrices[selectedPlan] / 100,
        currency: "USD",
        content_name: selectedPlan,
      });
    }

    window.location.href = data.url;
  } catch (error) {
    setIsStartingPlanCheckout(false);
    alert(
      error instanceof Error
        ? error.message
        : "Checkout could not be started. Please try again."
    );
  }
}

async function handleBuyExtraVideos(extraCount: number) {
  const selectedPlan = form.plan || "basic";

  localStorage.setItem(
    "memorialDraft",
    JSON.stringify({
      ...form,
      plan: selectedPlan,
    })
  );

  const amount = extraCount * 995;

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan: "extra_videos",
      amount,
      quantity: extraCount,
      returnUrl: `${window.location.origin}/create?extra_videos_paid=${extraCount}`,
    }),
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Error starting extra video checkout");
  }
}
  function clearForm() {
    localStorage.removeItem("memorialDraft");
    localStorage.removeItem("memorialPaid");
    localStorage.removeItem("paidExtraVideos");
    localStorage.removeItem("agreedToTerms");

    setForm(initialForm);
    setFeaturedPhoto(null);
    setBannerPhoto(null);
    setBannerSourcePhotoFile(null);
    setBannerPhotoFitStatus(null);
    setBannerPhotoPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
      }
      return null;
    });
    setHeadstonePhoto1(null);
    setHeadstonePhoto2(null);
    setGalleryPhotos([]);
    setFavoriteSongFiles([]);
setSelectedFavoriteSongNotes([]);
setSavedFavoriteSongUrls([]);
setSavedFavoriteSongNotes([]);
    setVideoFiles([]);
    setVideoError("");
    setErrorMessage("");
    setSuccessMessage("");
  }
async function saveGuidedDraft(
  chapter: GuidedChapter,
  exitAfterSave: boolean,
  stayOnCurrentChapter = false
) {
  try {
    /*
     * A Backup Person may view a Living MyEMemorial, but must not
     * save or upload changes until independent post-death access has been
     * activated. Guided Memory Builder navigation still calls this function,
     * so treat those calls as navigation-only while access is view-only.
     */
    const isLivingBackupReadOnly =
      form.isLivingPreplan &&
      isBackupAccess &&
      !isPostDeathUnlocked;

    if (isLivingBackupReadOnly) {
      if (exitAfterSave && draftMemorialSlug) {
        window.location.assign(
          `/memorial/${draftMemorialSlug}/manage`
        );
      }

      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    if (!user && !isBackupAccess) {
      alert(
        "Please sign in or use authorized backup-person access before saving this memorial."
      );
      return;
    }

    const galleryPhotosForSave = galleryPhotosRef.current;
    const savedGalleryPhotoCaptionsForSave =
      savedGalleryPhotoCaptionsRef.current;
    const videoNotesForSave = videoNotesRef.current;
    const savedVideoNotesForSave =
      savedVideoNotesRef.current;

    localStorage.setItem(
      "memorialDraft",
      JSON.stringify({
        ...form,
        plan: form.plan || "basic",
      })
    );

    let slug = draftMemorialSlug;

    if (!slug) {
      const baseSlug =
        SlugEngine.createBaseSlug({
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
        }) || `draft-${Date.now()}`;

      slug = await SlugEngine.createUniqueSlug(baseSlug);
    }

    let featuredPhotoUrl = form.featuredPhotoUrl || "";
let bannerPhotoUrl = form.bannerPhotoUrl || "";
let bannerSourcePhotoUrl = form.bannerSourcePhotoUrl || bannerPhotoUrl;
let headstonePhoto1Url = savedHeadstonePhoto1Url;
let headstonePhoto2Url = savedHeadstonePhoto2Url;
let obituaryImageUrl = savedObituaryImageUrl;

let galleryPhotoUrls = savedGalleryPhotoUrlsRef.current;
let newspaperArticleUrls =
  splitGalleryPhotos(form.newspaperArticles);

let videoLinkThumbnailUrls = [
  ...(form.videoLinkThumbnailUrls ?? []),
];

const normalizedExistingFavoriteSongs = normalizeFavoriteSongEntries(
  savedFavoriteSongUrlsRef.current,
  savedFavoriteSongNotesRef.current
);

let favoriteSongUrls = normalizedExistingFavoriteSongs.urls;
let favoriteSongNotes = normalizedExistingFavoriteSongs.notes;

setSavedFavoriteSongUrls(favoriteSongUrls);
setSavedFavoriteSongNotes(favoriteSongNotes);

let combinedUploadedVideos = savedVideoUrls.map(
  (playbackId, index) => ({
    playbackId,
    durationSeconds: 0,
    note: savedVideoNotesForSave[index] || "",
    originalFilename: "",
    fileSize: 0,
  })
);

if (featuredPhoto) {
  const uploadedFeaturedPhotoUrl =
    await MediaEngine.uploadOptionalFile(
      featuredPhoto,
      slug,
      "memorial-photos"
    );

  if (uploadedFeaturedPhotoUrl) {
  featuredPhotoUrl = uploadedFeaturedPhotoUrl;

  setForm((previousForm) => ({
    ...previousForm,
    featuredPhotoUrl: uploadedFeaturedPhotoUrl,
  }));

  setFeaturedPhoto(null);
}
}

if (bannerPhoto) {
  if (
    bannerSourcePhotoFile &&
    bannerSourcePhotoFile !== bannerPhoto
  ) {
    const uploadedSourcePhotoUrl =
      await MediaEngine.uploadOptionalFile(
        bannerSourcePhotoFile,
        slug,
        "memorial-photos"
      );

    if (uploadedSourcePhotoUrl) {
      bannerSourcePhotoUrl =
        uploadedSourcePhotoUrl;
    }
  }

  const uploadedBannerPhotoUrl =
    await MediaEngine.uploadOptionalFile(
      bannerPhoto,
      slug,
      "memorial-photos"
    );

  if (uploadedBannerPhotoUrl) {
    bannerPhotoUrl = uploadedBannerPhotoUrl;

    if (
      !bannerSourcePhotoFile ||
      bannerSourcePhotoFile === bannerPhoto
    ) {
      bannerSourcePhotoUrl =
        uploadedBannerPhotoUrl;
    }

    setForm((previousForm) => ({
      ...previousForm,
      bannerPhotoUrl: uploadedBannerPhotoUrl,
      bannerSourcePhotoUrl,
      bannerNeedsExtension: false,
    }));

    setBannerPhoto(null);
    setBannerSourcePhotoFile(null);

    setBannerPhotoPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
      }
      return null;
    });
  }
}

if (headstonePhoto1) {
  const uploadedHeadstonePhoto1Url =
    await MediaEngine.uploadOptionalFile(
      headstonePhoto1,
      slug,
      "memorial-photos"
    );

  if (uploadedHeadstonePhoto1Url) {
  headstonePhoto1Url = uploadedHeadstonePhoto1Url;
  setSavedHeadstonePhoto1Url(uploadedHeadstonePhoto1Url);

  setHeadstonePhoto1(null);
}
}

if (headstonePhoto2) {
  const uploadedHeadstonePhoto2Url =
    await MediaEngine.uploadOptionalFile(
      headstonePhoto2,
      slug,
      "memorial-photos"
    );

  if (uploadedHeadstonePhoto2Url) {
  headstonePhoto2Url = uploadedHeadstonePhoto2Url;
  setSavedHeadstonePhoto2Url(uploadedHeadstonePhoto2Url);

  setHeadstonePhoto2(null);
}
}

if (obituaryImageFile) {
  const uploadedObituaryImageUrl =
    await MediaEngine.uploadOptionalFile(
      obituaryImageFile,
      slug,
      "memorial-photos"
    );

 if (uploadedObituaryImageUrl) {
  obituaryImageUrl = uploadedObituaryImageUrl;
  setSavedObituaryImageUrl(uploadedObituaryImageUrl);

  setForm((previousForm) => ({
    ...previousForm,
    obituaryImageUrl: uploadedObituaryImageUrl,
  }));

  setObituaryImageFile(null);
}
}

if (videoLinkThumbnailFiles.length > 0) {
  for (
    let index = 0;
    index < videoLinkThumbnailFiles.length;
    index++
  ) {
    const file = videoLinkThumbnailFiles[index];

    if (!file) {
      continue;
    }

    const uploadedThumbnailUrl =
      await MediaEngine.uploadOptionalFile(
        file,
        slug,
        "memorial-photos"
      );

    if (uploadedThumbnailUrl) {
      videoLinkThumbnailUrls[index] =
        uploadedThumbnailUrl;
    }
  }

  setForm((previousForm) => ({
    ...previousForm,
    videoLinkThumbnailUrls,
  }));

  setVideoLinkThumbnailFiles([]);
}

if (galleryPhotosForSave.length > 0) {
  const uploadedGalleryPhotoUrls =
    await MediaEngine.uploadSelectedGalleryPhotos({
      photos: galleryPhotosForSave,
      slug,
      setGalleryPhotos,
      setGalleryUploadProgress,
      setIsGalleryUploading,
    });

  galleryPhotoUrls = [
    ...savedGalleryPhotoUrlsRef.current,
    ...uploadedGalleryPhotoUrls,
  ];
}


const galleryPhotoCaptions = [
  ...savedGalleryPhotoCaptionsForSave,
  ...galleryPhotosForSave.map((photo) => photo.caption || ""),
].slice(0, galleryPhotoUrls.length);

if (newspaperArticleFiles.length > 0) {
  const uploadedNewspaperArticleUrls =
    await Promise.all(
      newspaperArticleFiles.map((file) =>
        MediaEngine.uploadOptionalFile(
          file,
          slug,
          "memorial-articles"
        )
      )
    );

  newspaperArticleUrls = [
  ...newspaperArticleUrls,
  ...uploadedNewspaperArticleUrls.filter(
    (url): url is string => Boolean(url)
  ),
];

  setSavedNewspaperArticleUrls(newspaperArticleUrls);

setNewspaperArticleFiles([]);

setForm((previousForm) => ({
  ...previousForm,
  newspaperArticles: newspaperArticleUrls.join(","),
}));
}

if (favoriteSongFiles.length > 0) {
  const uploadedFavoriteSongUrls =
    await Promise.all(
      favoriteSongFiles.map((file) =>
        MediaEngine.uploadOptionalFile(
          file,
          slug,
          "memorial-audio"
        )
      )
    );

  const validUploadedFavoriteSongUrls =
    uploadedFavoriteSongUrls.filter(
      (url): url is string => Boolean(url)
    );

  favoriteSongUrls = [
    ...savedFavoriteSongUrlsRef.current,
    ...validUploadedFavoriteSongUrls,
  ].slice(0, 5);

  favoriteSongNotes = [
    ...savedFavoriteSongNotesRef.current,
    ...selectedFavoriteSongNotes,
  ].slice(0, 5);

  setSavedFavoriteSongUrls(favoriteSongUrls);
  setSavedFavoriteSongNotes(favoriteSongNotes);

  setFavoriteSongFiles([]);
  setSelectedFavoriteSongNotes([]);
}

if (videoFiles.length > 0) {
  const newlyUploadedVideos =
    await MediaEngine.uploadVideos({
      videoFiles,
      videoNotes: videoNotesForSave,
    });

  combinedUploadedVideos = [
    ...combinedUploadedVideos,
    ...newlyUploadedVideos,
  ];

  setSavedVideoUrls(
    combinedUploadedVideos.map(
      (video) => video.playbackId
    )
  );

  setSavedVideoNotes(
    combinedUploadedVideos.map(
      (video) => video.note
    )
  );

  setForm((previousForm) => ({
    ...previousForm,
    videoUrls: combinedUploadedVideos.map(
      (video) => video.playbackId
    ),
  }));

  setVideoFiles([]);
  setVideoNotes([]);
}

const fullName = [
  form.firstName,
  form.middleName,
  form.lastName,
  form.maidenName ? `(${form.maidenName})` : "",
]
  .filter(Boolean)
  .join(" ")
  .replace(/\s+/g, " ")
  .trim();

const normalizedName = `${form.firstName} ${form.lastName}`
  .trim()
  .toLowerCase();
const guidedExperienceType =
  form.isLivingPreplan &&
  isBackupAccess &&
  isPostDeathUnlocked
    ? "after-death"
    : form.isLivingPreplan
      ? "personal"
      : "memorial";

const guidedChapters = getGuidedChapters(guidedExperienceType);

const currentGuidedChapterIndex = guidedChapters.findIndex(
  (guidedChapter) => guidedChapter.id === chapter.id
);

const nextGuidedChapterId =
  currentGuidedChapterIndex >= 0 &&
  currentGuidedChapterIndex < guidedChapters.length - 1
    ? guidedChapters[currentGuidedChapterIndex + 1].id
    : chapter.id;
const memorialData = PersistenceEngine.buildMemorialData({
  slug,
  form,
  fullName,
  ownerId:
    existingMemorialOwnerId ??
    user?.id ??
    null,
  selectedPlan: form.plan || "basic",
  requiresReview: false,
  usingBetaCode: false,
  featuredPhotoUrl,
  bannerPhotoUrl,
  bannerSourcePhotoUrl,
  headstonePhoto1Url,
  headstonePhoto2Url,
  obituaryImageUrl,
  galleryPhotoUrls,
  galleryPhotoCaptions,
  newspaperArticleUrls,
  favoriteSongUrl: favoriteSongUrls[0] ?? "",
  favoriteSongUrls,
  favoriteSongNotes,
  videoLinkThumbnailUrls,
  uploadedVideos: combinedUploadedVideos,
  isDraft: isExistingMemorialEdit
  ? (existingMemorialIsDraft ?? true)
  : true,
  guidedCurrentChapter: stayOnCurrentChapter
  ? chapter.id
  : nextGuidedChapterId,
  existingIsPublished: isExistingMemorialEdit
    ? existingMemorialIsPublished
    : null,
});
let savedMemorialId = draftMemorialId;
if (draftMemorialId) {
  const updateResponse =
    await postMemorialUpdate({
      memorialId: draftMemorialId,
      updatePayload: memorialData,
      ...(isBackupAccess
        ? {}
        : {
            giftToken: searchParams.get("gift"),
            sessionId: searchParams.get("session_id"),
            promoCode: form.betaCode.trim() || null,
          }),
    });

  const updateResult =
    await updateResponse.json();

  if (!updateResponse.ok) {
    throw new Error(
      updateResult.error ||
        "The memorial could not be saved."
    );
  }

  const updateWarning =
    getApiWarningMessage(updateResult);

  if (updateWarning) {
    alert(updateWarning);
  }
} else {
  const createResult =
    await PersistenceEngine.createMemorial({
      slug,
      memorialData,
      giftToken: searchParams.get("gift"),
      sessionId: searchParams.get("session_id"),
      promoCode: form.betaCode.trim() || null,
    });

  if (
    !createResult.success ||
    !createResult.memorialId
  ) {
    throw new Error(
      createResult.error ||
        "The draft memorial could not be saved."
    );
  }

  setDraftMemorialId(
    createResult.memorialId
  );
savedMemorialId = createResult.memorialId;
  setDraftMemorialSlug(slug);

  localStorage.setItem(
    "guidedDraftMemorialId",
    String(createResult.memorialId)
  );

  localStorage.setItem(
    "guidedDraftMemorialSlug",
    slug
  );
}

/*
 * Only convert selected gallery previews into saved-gallery state after the
 * memorial row has been written successfully. If the database update fails,
 * the selected photos remain visible/retryable instead of disappearing.
 */
setSavedGalleryPhotoUrls(galleryPhotoUrls);
setSavedGalleryPhotoCaptions(galleryPhotoCaptions);

if (galleryPhotosForSave.length > 0) {
  setGalleryPhotos([]);
}

localStorage.setItem(
  "guidedDraftGalleryPhotoUrls",
  JSON.stringify(galleryPhotoUrls)
);
localStorage.setItem(
  "guidedDraftGalleryPhotoCaptions",
  JSON.stringify(galleryPhotoCaptions)
);

let backupSettingsSaveResult: Awaited<
  ReturnType<typeof saveBackupSettings>
> = null;

if (
  savedMemorialId &&
  form.isLivingPreplan &&
  !isBackupAccess
) {
  backupSettingsSaveResult =
    await saveBackupSettings(savedMemorialId);
}

/*
 * The current edits are now safely stored in Supabase,
 * so the emergency browser recovery copy is no longer needed.
 */
if (
  !isBackupAccess &&
  savedMemorialId &&
  typeof window !== "undefined"
) {
  localStorage.removeItem(
    `memorialUnsavedEdit:${savedMemorialId}`
  );
}

if (exitAfterSave) {
  if (isBackupAccess) {
    window.location.assign(
      `/memorial/${slug}/manage`
    );
  } else {
    window.location.assign(
      "/my-memorials"
    );
  }
}

return backupSettingsSaveResult;
  } catch (error) {
    console.error("SAVE GUIDED DRAFT ERROR:", error);

    alert(
      error instanceof Error
        ? `Could not save your draft: ${error.message}`
        : "Could not save your draft."
    );

    throw error;
  }
}
const guidedExperienceType =
  form.isLivingPreplan &&
  isBackupAccess &&
  isPostDeathUnlocked
    ? "after-death"
    : form.isLivingPreplan
      ? "personal"
      : "memorial";

const memorialBuilderDisplayName = [
  form.firstName,
  form.middleName,
  form.lastName,
]
  .filter(Boolean)
  .join(" ")
  .replace(/\s+/g, " ")
  .trim();

const isBackupChapterReadOnly = (
  chapterId: GuidedChapter["id"]
) => {
  if (!isBackupAccess) {
    return false;
  }

  if (!isPostDeathUnlocked) {
    return (
      chapterId !== "backup-person" &&
      chapterId !== "review"
    );
  }

  return POST_DEATH_BACKUP_OWNER_LOCKED_CHAPTERS.has(
    chapterId
  );
};

  if (isResolvingPaymentReturn) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-stone-900">
              Confirming Your Payment
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-700">
              Please wait while MyEMemorial confirms your payment and prepares the next step.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <MemorialBuilderPageFrame
        navigationHostId="memorial-builder-chapter-nav"
        hero={
          <MemorialBuilderHero
            fullName={memorialBuilderDisplayName}
            birthDate={form.birthDate}
            deathDate={form.deathDate}
            isLivingPreplan={form.isLivingPreplan}
            featuredPhotoUrl={form.featuredPhotoUrl || null}
            bannerUrl={
              bannerPhotoPreviewUrl ||
              form.bannerPhotoUrl ||
              (draftMemorialId === 149 || !form.isLivingPreplan
                ? "/memorial-banners/sample-sunset-lake-banner.jpg"
                : null)
            }
            bannerPositionX={form.bannerPositionX}
            bannerPositionY={form.bannerPositionY}
          />
        }
        leftRail={
          <SideAd
            pageType={form.isLivingPreplan ? "personal" : "create"}
            memorialZip={
              form.isLivingPreplan
                ? form.creatorZip
                : form.backupZip
            }
            categorySlot={leftAdCategory}
          />
        }
        rightRail={
          <SideAd
            pageType={form.isLivingPreplan ? "personal" : "create"}
            memorialZip={
              form.isLivingPreplan
                ? form.creatorZip
                : form.backupZip
            }
            categorySlot={rightAdCategory}
          />
        }
      >
        <div className="mx-auto max-w-6xl">

            {successMessage === "Payment Successful" && (
              <section
                ref={paymentSuccessBoxRef}
                className="mx-auto mt-6 max-w-3xl rounded-xl border border-green-300 bg-green-50 p-5 text-center shadow-sm"
              >
                <h2 className="text-xl font-bold text-green-800">
                  ✓ Payment Successful
                </h2>

                <p className="mt-2 text-base text-green-700">
                  Your payment has been confirmed. Continue below to complete your MyEMemorial.
                </p>
              </section>
            )}

            {errorMessage && (
              <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </section>
            )}

            {successMessage &&
  !isGiftFlow &&
  successMessage !== "Payment Successful" && (
    <section className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-4 shadow-sm">
      <p className="text-sm text-green-700">{successMessage}</p>
    </section>
  )}

            <form
  id="create-memorial-form"
  onSubmit={handleSubmit}

  autoComplete="off"
  className="mt-8 space-y-8"
>
  {!isGiftFlow && (
<section
  id="plan-selection"
  className="rounded-3xl bg-white p-6 shadow-sm"
>
  <div>
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
      Current Plan
    </p>

    <p className="mt-1 text-xl font-bold text-stone-900">
      {form.isLivingPreplan
        ? form.plan === "free"
          ? "Free Living MyEMemorial"
          : form.plan === "basic"
            ? "Basic Living MyEMemorial"
            : form.plan === "plus"
              ? "Plus Living MyEMemorial"
              : "Premium Living MyEMemorial"
        : form.plan === "free"
          ? "Free Departed MyEMemorial"
          : form.plan === "basic"
            ? "Basic Departed MyEMemorial"
            : form.plan === "plus"
              ? "Plus Departed MyEMemorial"
              : "Premium Departed MyEMemorial"}
    </p>

    {!isPaid && form.plan !== "free" && (
      <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <p className="text-lg font-bold text-amber-900">
          Payment Pending
        </p>

        <p className="mt-2 text-base leading-7 text-amber-900">
          Your selected plan has not been paid for yet. Until Stripe confirms
          payment, this MyEMemorial keeps Free access only.
        </p>

        <button
          type="button"
          onClick={handleCompletePlanPayment}
          disabled={isStartingPlanCheckout}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-stone-900 px-6 py-3 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isStartingPlanCheckout
            ? "Opening Payment..."
            : "Complete Payment"}
        </button>
      </div>
    )}

    {(form.plan === "free" || !isPaid) && (
      <div className="mt-4">
        <p className="text-base font-semibold text-stone-800">
          {form.plan === "free"
            ? `Included with your ${
                form.isLivingPreplan
                  ? "Free Living MyEMemorial"
                  : "Free Departed MyEMemorial"
              }:`
            : "Available while payment is pending:"}
        </p>

        <ul className="mt-2 grid gap-2 text-sm text-stone-600 md:grid-cols-2">
          <li>✓ Basic Information</li>
          <li>✓ Life Story</li>
          <li>✓ Featured Photo</li>
          <li>✓ Up to 5 Gallery Photos</li>
          <li>✓ Contributors</li>

          {!form.isLivingPreplan && (
            <>
              <li>✓ Obituary</li>
              <li>✓ Final Resting Place</li>

            </>
          )}
        </ul>

        <p className="mt-4 text-sm text-stone-500">
          Some additional chapters are shown in the Guided Memory Builder
          and are available with paid plans.
        </p>
      </div>
    )}
  </div>
</section>
              )}

             <GuidedMemoryBuilder
  chapterNavTargetId="memorial-builder-chapter-nav"
  experienceType={guidedExperienceType}
  isSaving={isSubmitting}
  initialChapterId={guidedInitialChapterId}
  isReady={draftReady}
    finalButtonLabel={
  form.isLivingPreplan &&
  isBackupAccess &&
  !isPostDeathUnlocked
    ? "Return to Manage Memorial"
    : guidedExperienceType === "after-death"
      ? "Save After-Death Updates"
      : "Finish Review"
}
  onSaveAndContinue={async (chapter) => {
  const isLivingBackupReadOnly =
    form.isLivingPreplan &&
    isBackupAccess &&
    !isPostDeathUnlocked;

  if (isLivingBackupReadOnly) {
    if (chapter.id === "review" && draftMemorialSlug) {
      window.location.assign(
        `/memorial/${draftMemorialSlug}/manage`
      );
    }

    return;
  }

  if (
    isBackupAccess &&
    isPostDeathUnlocked &&
    POST_DEATH_BACKUP_OWNER_LOCKED_CHAPTERS.has(
      chapter.id
    )
  ) {
    return true;
  }

  if (chapter.id !== "review") {
    const isOwnerBackupPersonChapter =
      chapter.id === "backup-person" &&
      form.isLivingPreplan &&
      !isBackupAccess &&
      form.plan !== "free" &&
      isPaid;

    if (!isOwnerBackupPersonChapter) {
      await saveGuidedDraft(chapter, false);
      return true;
    }

    /*
     * Once the final Backup Person command has completed, the next
     * Save & Continue is the owner's deliberate instruction to leave
     * this chapter and proceed to Review.
     */
    const currentActiveRoleHasPendingCommand =
      form.secondaryBackupActivatedAt
        ? Boolean(form.secondaryBackupRevokedAt)
        : Boolean(form.primaryBackupRevokedAt);

    if (
      showBackupSetupCompleteMessage &&
      !secondaryFreshPasswordRequired &&
      !currentActiveRoleHasPendingCommand
    ) {
      setShowBackupSetupCompleteMessage(false);
      setShowBackupSaveConfirmationMessage(false);
      setBackupAccessWorkflowDirty(false);
      setBackupPersonChapterDirty(false);
      await saveGuidedDraft(chapter, false);
      return true;
    }

    if (showBackupSetupCompleteMessage) {
      setShowBackupSetupCompleteMessage(false);
    }

    const chapterHadUnsavedChanges = backupPersonChapterDirty;

    const workflowMayNeedAnotherCommand =
      chapterHadUnsavedChanges ||
      backupAccessWorkflowDirty ||
      secondaryFreshPasswordRequired ||
      currentActiveRoleHasPendingCommand ||
      Boolean(form.backupPassword.trim()) ||
      Boolean(form.secondaryBackupPassword.trim());

    if (!workflowMayNeedAnotherCommand) {
      await saveGuidedDraft(chapter, false);
      return true;
    }

    const backupSaveResult =
      await saveGuidedDraft(chapter, false, true);

    // Always acknowledge an owner-initiated Backup Person save before
    // deciding whether another access command is still required.
    setShowBackupSaveConfirmationMessage(true);

    const authorityState =
      backupSaveResult?.authorityState;

    const secondaryIsActive = Boolean(
      authorityState?.secondaryBackupActivatedAt ??
        form.secondaryBackupActivatedAt
    );

    const activeRoleStillNeedsCommand =
      secondaryIsActive
        ? Boolean(
            authorityState?.secondaryBackupRevokedAt ??
              form.secondaryBackupRevokedAt
          )
        : Boolean(
            authorityState?.primaryBackupRevokedAt ??
              form.primaryBackupRevokedAt
          );

    const freshSecondaryPasswordStillRequired =
      Boolean(
        backupSaveResult?.secondaryFreshPasswordRequired ??
          secondaryFreshPasswordRequired
      );

    const accessWorkflowWasSaved =
      Boolean(backupSaveResult?.accessWorkflowWasSaved) ||
      backupAccessWorkflowDirty ||
      secondaryFreshPasswordRequired;

    setBackupAccessWorkflowDirty(false);
    setBackupPersonChapterDirty(false);

    if (
      activeRoleStillNeedsCommand ||
      freshSecondaryPasswordStillRequired
    ) {
      setShowBackupSetupCompleteMessage(false);
      return false;
    }

    if (accessWorkflowWasSaved || chapterHadUnsavedChanges) {
      setShowBackupSetupCompleteMessage(true);
      return false;
    }

    return true;
  }
  if (guidedExperienceType === "after-death") {
  await saveGuidedDraft(chapter, false);

  setShowAfterDeathSaveModal(true);

  return;
}

  if (isPaid || form.plan === "free") {
    const createForm = document.getElementById(
      "create-memorial-form"
    ) as HTMLFormElement | null;

    createForm?.requestSubmit();

    return;
  }

  await saveGuidedDraft(chapter, false);

  alert(
    "Payment has not been completed. Your draft is saved with Free access. Complete payment to unlock the selected plan and finish your MyEMemorial."
  );

  document
    .getElementById("plan-selection")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  return false;
}}
onSaveAndExit={async (chapter) => {
  if (
    isBackupAccess &&
    isPostDeathUnlocked &&
    POST_DEATH_BACKUP_OWNER_LOCKED_CHAPTERS.has(
      chapter.id
    )
  ) {
    if (draftMemorialSlug) {
      window.location.assign(
        `/memorial/${draftMemorialSlug}/manage`
      );
    }

    return;
  }

  await saveGuidedDraft(chapter, true);
}}



  renderChapter={(chapter) => {
    const chapterContent = (() => {
 switch (chapter.id) {
  case "basic-information":
    return (
      <div
        className={
          form.isLivingPreplan
            ? "personal-basic-information"
            : undefined
        }
      >
        <BasicInformationSection
          form={form}
          handleChange={handleChange}
          setFeaturedPhotoFile={setFeaturedPhoto}
          isSaving={isSubmitting}
          isPublished={false}
          isPaid={isPaid}
          isFreePlan={form.plan === "free" || !isPaid}
        />

        {!isBackupAccess && (
          <MemorialBannerPhotoSection
            bannerUrl={
              bannerPhotoPreviewUrl ||
              form.bannerPhotoUrl ||
              null
            }
            positionX={form.bannerPositionX}
            positionY={form.bannerPositionY}
            fitStatus={
              bannerPhotoFitStatus ||
              (form.bannerNeedsExtension
                ? "needs-extension"
                : form.bannerPhotoUrl
                  ? "wide"
                  : null)
            }
            isSaving={isSubmitting}
            isExtending={isExtendingBanner}
            onPhotoSelected={handleBannerPhotoSelected}
            onStockBannerSelected={selectStockBanner}
            onExtendPhoto={createFullWidthBanner}
            onPositionChange={(positionX, positionY) => {
              setForm((previousForm) => ({
                ...previousForm,
                bannerPositionX: positionX,
                bannerPositionY: positionY,
              }));
            }}
            onRemove={removeBannerPhoto}
          />
        )}

        {form.isLivingPreplan && (
          <style>{`
            .personal-basic-information div:has(> input[name="deathDate"]),
            .personal-basic-information label:has(> input[name="deathDate"]),
            .personal-basic-information label:has(input[name="deathDate"]) {
              display: none !important;
            }
          `}</style>
        )}
      </div>
    );

  case "family-history":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Family History"
    >
      <FamilyHistorySection
        form={form}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    </PlanLockedSection>

    );

  case "life-story":
    return (
      <LifeStorySection
        form={form}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    );

  case "places-lived":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Places Lived"
    >
      <PlacesLivedSection
        placesLived={form.placesLived}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    </PlanLockedSection>
  );

  case "places-worked":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Places Worked"
    >
      <PlacesWorkedSection
        placesWorked={form.placesWorked}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    </PlanLockedSection>
  );

  case "schools-and-awards":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Schools & Awards"
    >
      <SchoolsAndAwardsSection
        schoolsAttended={form.schoolsAttended}
        awardsWon={form.awardsWon}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    </PlanLockedSection>
  );

  case "social-media":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Social Media"
    >
      <SocialMediaSection
        form={form}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    </PlanLockedSection>
  );

  case "newspaper-articles":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Newspaper Articles"
    >
      <NewspaperArticlesSection
        newspaperArticles={form.newspaperArticles}
        handleChange={handleChange}
        splitGalleryPhotos={splitGalleryPhotos}
        setNewspaperArticles={(value) => {
          setForm((previousForm) => ({
            ...previousForm,
            newspaperArticles: value,
          }));

          setSavedNewspaperArticleUrls(
            splitGalleryPhotos(value)
          );
        }}
        setNewspaperArticleFiles={setNewspaperArticleFiles}
        isSaving={isSubmitting}
        isPublished={false}
      />
    </PlanLockedSection>
  );

  case "favorite-songs":
  return (
   <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
  locked={form.plan === "free" || !isPaid}
  featureName="Favorite Songs"
>
  <FavoriteSongsSection
    firstName={form.firstName}
    nickname={form.nickname}
    favoriteSongUrl={savedFavoriteSongUrls[0] ?? ""}
    favoriteSongUrls={savedFavoriteSongUrls}
    favoriteSongNotes={savedFavoriteSongNotes}
    favoriteSongFiles={favoriteSongFiles}
    selectedFavoriteSongNotes={selectedFavoriteSongNotes}
    showFuneralPresentationPreference
    funeralPresentationMusicSource={form.funeralPresentationMusicSource}
    funeralPresentationPreferenceReadOnly={isBackupAccess}
    handleChange={handleChange}
    setForm={setForm}
    isPaid={isPaid}
    setFavoriteSongFiles={setFavoriteSongFiles}
    setSelectedFavoriteSongNotes={setSelectedFavoriteSongNotes}
    setFavoriteSongUrls={setSavedFavoriteSongUrls}
    setFavoriteSongNotes={setSavedFavoriteSongNotes}
  />
</PlanLockedSection>
  );

  case "photo-gallery":
    return (
      <Section title="Photo Gallery">
        <div className="-mx-4 sm:mx-0">
          <CreateGallerySection
  form={{
    plan: !isPaid ? "free" : form.plan,
  }}
  savedGalleryPhotoUrls={savedGalleryPhotoUrls}
  setSavedGalleryPhotoUrls={setSavedGalleryPhotoUrls}
  savedGalleryPhotoCaptions={savedGalleryPhotoCaptions}
setSavedGalleryPhotoCaptions={setSavedGalleryPhotoCaptions}
  galleryPhotos={galleryPhotos}
            setGalleryPhotos={setGalleryPhotos}
            galleryUploadProgress={galleryUploadProgress}
            isPaid={isPaid}
            PLAN_LIMITS={PLAN_LIMITS}
          />

          <p className="mt-2 text-base text-stone-500">
            You can select multiple gallery images at once.
          </p>
        </div>
      </Section>
    );

  case "video-memories":
    return (
      <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
  locked={form.plan === "free" || !isPaid}
  featureName="Video Memories"
>
  <CreateVideoMemoriesSection
    isPaid={isPaid}
    videoFiles={videoFiles}
    videoNotes={videoNotes}
    savedVideoUrls={savedVideoUrls}
    savedVideoNotes={savedVideoNotes}
    setSavedVideoUrls={setSavedVideoUrls}
    setSavedVideoNotes={setSavedVideoNotes}
    videoError={videoError}
    form={form}
    handleVideoChange={handleVideoChange}
    addVideoFiles={addVideoFiles}
    setVideoFiles={setVideoFiles}
    setVideoNotes={setVideoNotes}
    videoLinkThumbnailFiles={videoLinkThumbnailFiles}
    setVideoLinkThumbnailFiles={setVideoLinkThumbnailFiles}
    setForm={setForm}
  />
</PlanLockedSection>
    );

  case "obituary":
  return (
    <ObituarySection
      form={form}
      handleChange={handleChange}
      setForm={setForm}
      setObituaryImageFile={setObituaryImageFile}
      isSaving={isSubmitting}
      isPublished={false}
      isPaid={isPaid}
    />
  );

  case "final-resting-place":
  return (
    <FinalRestingPlaceSection
      form={form}
      handleChange={handleChange}
      handleDispositionChange={handleChange}
      handleCenterMap={handleCenterMap}
      handleUseCurrentLocation={handleUseCurrentLocation}
      mapSearchStatus={mapSearchStatus}
      locationStatus={locationStatus}
      setForm={setForm}
    />
  );

  case "backup-person":
  return (
    <PlanLockedSection
      isPersonalMyEMemorial={form.isLivingPreplan}
      memorialId={draftMemorialId}
      paymentPending={form.plan !== "free" && !isPaid}
      onCompletePayment={handleCompletePlanPayment}
      isStartingPayment={isStartingPlanCheckout}
      locked={form.plan === "free" || !isPaid}
      featureName="Legacy Instructions"
    >
      <div className="space-y-6">
        <BackupPersonSection
          form={form}
          handleChange={handleChange}
          isSaving={isSubmitting}
          isPublished={false}
          onNotifyPrimaryFuneralHome={
            notifyPrimaryFuneralHome
          }
          onNotifyAlternateFuneralHome={
            notifyAlternateFuneralHome
          }
          onActivateAlternateFuneralHome={
            activateAlternateFuneralHome
          }
          onActivateSecondaryBackupPerson={
            activateSecondaryBackupPerson
          }
          onRevokePrimaryBackupPerson={
            !isBackupAccess && draftMemorialId
              ? () => revokeBackupPerson("primary")
              : undefined
          }
          onRevokeSecondaryBackupPerson={
            !isBackupAccess && draftMemorialId
              ? () => revokeBackupPerson("secondary")
              : undefined
          }
          onRestorePrimaryBackupPerson={
            !isBackupAccess && draftMemorialId
              ? restorePrimaryBackupPerson
              : undefined
          }
          showSetupCompleteMessage={
            showBackupSetupCompleteMessage
          }
          showSaveConfirmationMessage={
            showBackupSaveConfirmationMessage
          }
          secondaryFreshPasswordRequired={
            secondaryFreshPasswordRequired
          }
          accessWorkflowDirty={backupAccessWorkflowDirty}
          isBackupAccess={isBackupAccess}
          isPostDeathUnlocked={isPostDeathUnlocked}
          onReportDeath={reportDeath}
        />

        {isBackupAccess && !isPostDeathUnlocked && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-5">
            <h3 className="text-xl font-bold text-green-900">
              Post-Death Access
            </h3>

            <p className="mt-3 text-base leading-7 text-green-900">
              Once the death has been independently verified,
              you may activate post-death access to continue
              completing the memorial.
            </p>

            <button
              type="button"
              onClick={unlockPostDeathAccess}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-green-800 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-700"
            >
              Activate Post-Death Access
            </button>
          </div>
        )}
      </div>
    </PlanLockedSection>
  );

  case "review": {
  const fullReviewName = [
    form.firstName,
    form.middleName,
    form.lastName,
    form.maidenName ? `(${form.maidenName})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const socialLinks = [
    form.socialLink1,
    form.socialLink2,
    form.socialLink3,
    form.socialLink4,
    form.socialLink5,
  ].filter((value) => value?.trim());

  const photoCount =
    savedGalleryPhotoUrls.length + galleryPhotos.length;

  const songCount =
    savedFavoriteSongUrls.filter(Boolean).length +
    favoriteSongFiles.length;

  const videoCount =
    savedVideoUrls.length +
    videoFiles.length +
    (form.videoLinkUrls ?? []).filter(Boolean).length;

  const newspaperCount =
    savedNewspaperArticleUrls.length +
    newspaperArticleFiles.length;

  const hasPaidPlanAccess =
    isPaid && form.plan !== "free";

  const ReviewItem = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="border-b border-stone-200 py-4 last:border-b-0">
      <p className="text-base font-semibold text-stone-900">
  {label}
</p>

<div className="mt-2 whitespace-pre-wrap text-base leading-7 text-stone-600">
        {value || (
          <span className="italic text-stone-400">
            Nothing added
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-stone-900">
          {guidedExperienceType === "after-death"
  ? "Review the Memorial Before Publication"
  : form.isLivingPreplan
    ? "Review Your Living MyEMemorial"
    : "Review the Memorial"}
        </h2>

        <p className="mt-4 text-base leading-7 text-stone-700">
          Review the information below before finishing. If something needs
          to be changed, use the Back button to return to the appropriate
          chapter.
        </p>


      </div>

      {!hasPaidPlanAccess && form.plan !== "free" && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <p className="text-lg font-bold text-amber-900">
            Payment Pending — Free Access Only
          </p>
          <p className="mt-2 text-base leading-7 text-amber-900">
            Paid-plan information already saved in this draft is preserved,
            but it stays locked until payment is completed.
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <ReviewItem
          label="Basic Information"
          value={
            <>
              <div>{fullReviewName || "Name not entered"}</div>

              {form.nickname && (
                <div>Nickname: {form.nickname}</div>
              )}

              {form.birthDate && (
                <div>Born: {form.birthDate}</div>
              )}

              {form.deathDate && (
                <div>Died: {form.deathDate}</div>
              )}
            </>
          }
        />

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Family History"
            value={
             [
    form.greatGrandparentsNames &&
      `Great-Grandparents: ${form.greatGrandparentsNames}`,
    form.grandparentsFatherSide &&
      `Grandparents — Father's Side: ${form.grandparentsFatherSide}`,
    form.grandparentsMotherSide &&
      `Grandparents — Mother's Side: ${form.grandparentsMotherSide}`,
    form.parentsNames &&
      `Parents: ${form.parentsNames}`,
    form.siblingsNames &&
      `Siblings: ${form.siblingsNames}`,
    form.spouseNames &&
      `Spouse/Partner: ${form.spouseNames}`,
    form.childrenNames &&
      `Children: ${form.childrenNames}`,
    form.grandchildrenNames &&
      `Grandchildren: ${form.grandchildrenNames}`,
    form.greatGrandchildrenNames &&
      `Great-Grandchildren: ${form.greatGrandchildrenNames}`,
  ]
                .filter(Boolean)
                .join("\n")
            }
          />
        )}

        <ReviewItem
          label="Life Story"
          value={form.lifeStory}
        />

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Places Lived"
            value={form.placesLived}
          />
        )}

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Places Worked"
            value={form.placesWorked}
          />
        )}

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Schools & Awards"
            value={
              [
                form.schoolsAttended &&
                  `Schools:\n${form.schoolsAttended}`,
                form.awardsWon &&
                  `Awards:\n${form.awardsWon}`,
              ]
                .filter(Boolean)
                .join("\n\n")
            }
          />
        )}

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Social Media"
            value={
              socialLinks.length > 0
                ? `${socialLinks.length} link${
                    socialLinks.length === 1 ? "" : "s"
                  } added`
                : ""
            }
          />
        )}

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Newspaper Articles"
            value={
              newspaperCount > 0
                ? `${newspaperCount} article${
                    newspaperCount === 1 ? "" : "s"
                  } added`
                : ""
            }
          />
        )}

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Favorite Songs"
            value={
              songCount > 0
                ? `${songCount} song${
                    songCount === 1 ? "" : "s"
                  } added`
                : ""
            }
          />
        )}

        <ReviewItem
          label="Photo Gallery"
          value={
            photoCount > 0
              ? `${photoCount} photo${
                  photoCount === 1 ? "" : "s"
                } added`
              : ""
          }
        />

        {hasPaidPlanAccess && (
          <ReviewItem
            label="Video Memories"
            value={
              videoCount > 0
                ? `${videoCount} video${
                    videoCount === 1 ? "" : "s"
                  } added`
                : ""
            }
          />
        )}

        {(
  !form.isLivingPreplan ||
  guidedExperienceType === "after-death"
) && (
          <>
            <ReviewItem
              label="Obituary"
              value={
                form.obituary
                  ? form.obituary
                  : form.obituaryUrl
                    ? "Obituary link added"
                    : savedObituaryImageUrl ||
                        obituaryImageFile
                      ? "Obituary image added"
                      : ""
              }
            />

            <ReviewItem
              label="Final Resting Place"
              value={
                form.finalRestingType === "buried"
                  ? [
                      "Buried",
                      form.cemeteryName,
                      form.graveSection &&
                        `Section: ${form.graveSection}`,
                      form.graveRow &&
                        `Row: ${form.graveRow}`,
                      form.gravePlot &&
                        `Plot: ${form.gravePlot}`,
                        form.graveDirections &&
  `Directions: ${form.graveDirections}`,
                    ]
                      .filter(Boolean)
                      .join("\n")
                  : form.finalRestingType === "cremated"
                    ? [
                        "Cremated",
                        form.ashesLocationDescription,
                      ]
                        .filter(Boolean)
                        .join("\n")
                    : ""
              }
            />
          </>
        )}

        {form.isLivingPreplan &&
          !isBackupAccess &&
          hasPaidPlanAccess && (
          <>
            <ReviewItem
              label="Primary Backup Person"
              value={
                [
                  form.backupPersonName,
                  form.backupPhone,
                  form.backupEmail,
                ]
                  .filter(Boolean)
                  .join("\n")
              }
            />

            {(form.secondaryBackupName ||
              form.secondaryBackupPhone ||
              form.secondaryBackupEmail) && (
              <ReviewItem
                label="Secondary Backup Person"
                value={
                  [
                    form.secondaryBackupName,
                    form.secondaryBackupPhone,
                    form.secondaryBackupEmail,
                    form.secondaryBackupActivatedAt
                      ? "Status: Active"
                      : "Status: Fallback",
                  ]
                    .filter(Boolean)
                    .join("\n")
                }
              />
            )}
          </>
        )}
      </div>

{guidedExperienceType === "after-death" && (
  <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
    <h3 className="text-xl font-bold text-stone-900">
      Private Legacy Instructions
    </h3>

    <p className="mt-2 text-base font-semibold leading-7 text-amber-900">
      These private instructions were released only after post-death access was verified.
    </p>

    <div className="mt-4 whitespace-pre-wrap text-lg leading-8 text-stone-800">
      {form.legacyInstructions?.trim()
        ? form.legacyInstructions
        : "No private legacy instructions were left."}
    </div>
  </div>
)}
      {guidedExperienceType === "after-death" && (
  <div className="mt-6 rounded-2xl border-2 border-blue-300 bg-blue-50 p-6">
    <h3 className="text-xl font-bold text-stone-900">
      Private Message from the Memorial Owner
    </h3>

    <p className="mt-2 text-base font-semibold leading-7 text-blue-900">
      This private message was released only after post-death access was verified.
    </p>

    <div className="mt-4 whitespace-pre-wrap text-lg leading-8 text-stone-800">
      {form.privateOwnerMessage?.trim()
        ? form.privateOwnerMessage
        : "No private message was left."}
    </div>
  </div>
)}
    </div>
  );
}

    default:
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <p className="text-stone-600">
          This chapter has not been connected yet.
        </p>
      </div>
    );
  }
    })();

    return (
      <BackupReadOnlyChapter
        locked={isBackupChapterReadOnly(chapter.id)}
        ownerLiving={!isPostDeathUnlocked}
      >
        {chapterContent}
      </BackupReadOnlyChapter>
    );
}}
/>
            </form>
          </div>
      </MemorialBuilderPageFrame>

      {showAfterDeathSaveModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
      <h2 className="text-2xl font-bold text-stone-900">
        After-Death Updates Saved
      </h2>

      <p className="mt-4 text-lg leading-8 text-stone-700">
        Your updates have been saved successfully.
      </p>

      <p className="mt-3 text-base font-semibold leading-7 text-stone-700">
        The memorial is still private and has not been published.
      </p>

      <button
        type="button"
        onClick={() => setShowAfterDeathSaveModal(false)}
        className="mt-6 rounded-full bg-stone-900 px-8 py-3 text-base font-semibold text-white transition hover:bg-stone-700"
      >
        OK
      </button>
    </div>
  </div>
)}
    </main>
  );
}
export default function CreateClient() {
  return (
    <Suspense fallback={null}>
      <CreatePageContent />
    </Suspense>
  );
}
function normalizeFavoriteSongEntries(
  urls: string[],
  notes: string[]
): { urls: string[]; notes: string[] } {
  const entries = urls
    .slice(0, 5)
    .map((url, index) => ({
      url: url?.trim() ?? "",
      note: notes[index] ?? "",
    }))
    .filter((entry) => Boolean(entry.url));

  return {
    urls: entries.map((entry) => entry.url),
    notes: entries.map((entry) => entry.note),
  };
}

function splitGalleryPhotos(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
function BackupReadOnlyChapter({
  locked,
  ownerLiving,
  children,
}: {
  locked: boolean;
  ownerLiving: boolean;
  children: React.ReactNode;
}) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-stone-300 bg-stone-100 p-5">
        <p className="text-lg font-bold text-stone-900">
          {ownerLiving
            ? "View Only — Memorial Owner Protected"
            : "Preserved by the Memorial Owner"}
        </p>

        <p className="mt-2 text-base font-semibold leading-7 text-stone-700">
          {ownerLiving
            ? "This chapter is read-only while the memorial owner is living."
            : "This chapter is locked after death so the memorial owner's story cannot be rewritten by a Backup Person."}
        </p>
      </div>

      <fieldset
        disabled
        aria-disabled="true"
        className="min-w-0 opacity-60 grayscale"
      >
        {children}
      </fieldset>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>;
}

type ChangeHandler = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => void;

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete = "off",
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}



      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
      >
        <option value="">Select one</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}