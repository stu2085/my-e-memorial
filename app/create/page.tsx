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
import LifeStorySection from "../components/LifeStorySection";
import ObituarySection from "../components/ObituarySection";
import FamilyHistorySection from "../components/FamilyHistorySection";
import SocialMediaSection from "../components/SocialMediaSection";

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
  finalRestingType: string;
  ashesLocationDescription: string;
  plan: string;
  isLivingPreplan: boolean;
backupPersonName: string;
backupPersonEmail: string;
backupPersonUsername: string;
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
  finalRestingType: "",
  ashesLocationDescription: "",
  plan: "basic",
  isLivingPreplan: false,
backupPersonName: "",
backupPersonEmail: "",
backupPersonUsername: "",
backupEmail: "",
backupPassword: "",
backupStreet: "",
backupCity: "",
backupState: "",
backupZip: "",

creatorStreet: "",
creatorCity: "",
creatorState: "",
creatorZip: "",
betaCode: "",
promotionCategory: "personal",
};

const PLAN_LIMITS = {
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



function CreatePageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

const isPersonalMode =
  mode === "personal" || mode === "preplan";
  const isGiftFlow = Boolean(searchParams.get("gift"));
  const isExistingMemorialEdit =
  Number(searchParams.get("edit") || 0) > 0;
  const [isPaid, setIsPaid] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const MAX_VIDEO_SIZE_BYTES = 1000 * 1000 * 1000; // 1 GB
  const [mapSearchStatus, setMapSearchStatus] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
const [paidExtraVideos, setPaidExtraVideos] = useState(0);
const [featuredPhoto, setFeaturedPhoto] = useState<File | null>(null);
  const [headstonePhoto1, setHeadstonePhoto1] = useState<File | null>(null);
  const [headstonePhoto2, setHeadstonePhoto2] = useState<File | null>(null);
  const [obituaryImageFile, setObituaryImageFile] =
  useState<File | null>(null);
  
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [newspaperArticleFiles, setNewspaperArticleFiles] =
  useState<File[]>([]);
  const [galleryUploadProgress, setGalleryUploadProgress] =
  useState<UploadProgress | null>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);



const [favoriteSongFiles, setFavoriteSongFiles] = useState<File[]>([]);
const [selectedFavoriteSongNotes, setSelectedFavoriteSongNotes] =
  useState<string[]>([]);

const [savedFavoriteSongUrls, setSavedFavoriteSongUrls] =
  useState<string[]>([]);

const [savedFavoriteSongNotes, setSavedFavoriteSongNotes] =
  useState<string[]>([]);
const [savedHeadstonePhoto1Url, setSavedHeadstonePhoto1Url] = useState("");
const [savedHeadstonePhoto2Url, setSavedHeadstonePhoto2Url] = useState("");
const [savedObituaryImageUrl, setSavedObituaryImageUrl] = useState("");
const [savedGalleryPhotoUrls, setSavedGalleryPhotoUrls] = useState<string[]>([]);
const [savedGalleryPhotoCaptions, setSavedGalleryPhotoCaptions] =
  useState<string[]>([]);
const [savedNewspaperArticleUrls, setSavedNewspaperArticleUrls] = useState<string[]>([]);
const [draftReady, setDraftReady] = useState(false);
const [draftMemorialId, setDraftMemorialId] = useState<number | null>(null);
const [draftMemorialSlug, setDraftMemorialSlug] = useState("");

const [isBackupAccess, setIsBackupAccess] = useState(false);
const [existingMemorialOwnerId, setExistingMemorialOwnerId] =
  useState<string | null>(null);

const [existingMemorialIsPublished, setExistingMemorialIsPublished] =
  useState<boolean | null>(null);
const [guidedInitialChapterId, setGuidedInitialChapterId] =
  useState<string | null>(null);
const [videoFiles, setVideoFiles] = useState<File[]>([]);
const [videoNotes, setVideoNotes] = useState<string[]>([]);
const [savedVideoUrls, setSavedVideoUrls] = useState<string[]>([]);
const [savedVideoNotes, setSavedVideoNotes] = useState<string[]>([]);

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
      if (memorialId > 0) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  let hasBackupAccess = false;

  if (isEditingExistingMemorial) {
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
    return;
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
          "Could not load this Personal E-Memorial."
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

  if (
    hasBackupAccess &&
    draftData &&
    !draftData.is_living_preplan
  ) {
    setErrorMessage(
      "Backup-person access is only available for Personal E-Memorials."
    );
    setDraftReady(true);
    return;
  }

  if (hasBackupAccess) {
    setIsBackupAccess(true);
  }

  if (draftError) {
    console.error("LOAD GUIDED DRAFT ERROR:", draftError);
    setErrorMessage("Could not load this draft memorial.");
    setDraftReady(true);
    return;
  }

  if (!draftData) {
    setErrorMessage("This draft memorial could not be found.");
    setDraftReady(true);
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
    finalRestingType:
      draftData.final_resting_type ?? "",
    ashesLocationDescription:
      draftData.ashes_location_description ?? "",
    plan: draftData.plan ?? "basic",
    isLivingPreplan:
      Boolean(draftData.is_living_preplan),
    backupPersonName:
      draftData.backup_person_name ?? "",
    backupPersonEmail: "",
    backupPersonUsername: "",
    backupEmail: draftData.backup_email ?? "",
    backupPassword: draftData.backup_password ?? "",
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
return;
}

    const savedDraft = localStorage.getItem("memorialDraft");
    const extraVideosPaid = Number(params.get("extra_videos_paid") || 0);
    const promoFromUrl = params.get("promo");
    const sessionId = params.get("session_id");
    const autoCheckout = params.get("autocheckout");
    const giftToken = params.get("gift");

    const parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;
    const selectedPlan = parsedDraft?.plan || form.plan || "basic";

    const planPrices = {
      basic: 4995,
      plus: 6995,
      premium: 8995,
    };

    if (savedDraft) {
    setForm({
  ...initialForm,
  ...parsedDraft,
  isLivingPreplan: isPersonalModeFromUrl,
  promotionCategory: isPersonalModeFromUrl
    ? "personal"
    : parsedDraft.promotionCategory || "personal",
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
        isPersonalModeFromUrl ? "/create?mode=personal" : "/create"
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
    if (autoCheckout === "1") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && savedDraft) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedPlan,
            amount: planPrices[selectedPlan as keyof typeof planPrices],
            returnUrl: `${window.location.origin}/create${
              isPersonalModeFromUrl ? "?mode=personal" : ""
            }`,
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
      }
    }

    if (!sessionId) {
      return;
    }

    const res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    const data = await res.json();

   if (data.paid === true) {
  setIsPaid(true);
  setSuccessMessage("Payment Successful");

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
    }
  }

  verifyPayment();
}, [searchParams]);
useEffect(() => {
  if (!draftReady) return;

  const isPersonalModeFromUrl =
  searchParams.get("mode") === "personal" ||
  searchParams.get("mode") === "preplan";

  localStorage.setItem(
  "memorialDraft",
  JSON.stringify({
    ...form,
    isLivingPreplan: isPersonalModeFromUrl,
    promotionCategory: isPersonalModeFromUrl
      ? "personal"
      : form.promotionCategory,
  })
);
}, [draftReady, form, searchParams]);
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
  

  

  

 async function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
  const files = Array.from(e.target.files || []);
  let selectedPlan = form.plan as PlanKey;

  if (files.length === 0) return;

  const limits = PLAN_LIMITS[selectedPlan];

  if (!limits) {
    setVideoError("Please choose a memorial plan before uploading videos.");
    e.target.value = "";
    return;
  }

  const oversizedFile = files.find(
    (file) => file.size > MAX_VIDEO_SIZE_BYTES
  );

  if (oversizedFile) {
    setVideoError(
      `"${oversizedFile.name}" is too large. Maximum video size is 1 GB.`
    );
    e.target.value = "";
    return;
  }

  const existingNames = new Set(videoFiles.map((f) => f.name));

  const newUniqueFiles = files.filter(
    (file) => !existingNames.has(file.name)
  );

  const maxTotalVideoSeconds = limits.videoMinutes * 60;

let existingVideoSeconds = 0;

for (const file of videoFiles) {
  existingVideoSeconds += await MediaEngine.getVideoDuration(file)
}

let newVideoSeconds = 0;

for (const file of newUniqueFiles) {
  newVideoSeconds += await MediaEngine.getVideoDuration(file);
}

if (existingVideoSeconds + newVideoSeconds > maxTotalVideoSeconds) {
  setVideoError(
    `${limits.label} allows up to ${limits.videoMinutes} minutes of Video Memories.`
  );
  e.target.value = "";
  return;
}

  for (const file of newUniqueFiles) {
    const duration = await MediaEngine.getVideoDuration(file);

    if (duration > 300) {
      setVideoError(
        `"${file.name}" is longer than 5 minutes. Maximum video length is 5 minutes.`
      );
      e.target.value = "";
      return;
    }
  }

  setVideoFiles((prev) => [...prev, ...newUniqueFiles]);

setVideoNotes((prev) => [
  ...prev,
  ...newUniqueFiles.map(() => ""),
]);

setVideoError("");
e.target.value = "";
}


  

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
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
  isPaid,
  galleryPhotos,
});

      await ValidationEngine.validateVideos({
  videoFiles,
  getVideoDuration: MediaEngine.getVideoDuration,
  maximumVideoMinutes: limits.videoMinutes,
  planLabel: limits.label,
});

      if (
        (form.finalRestingType === "buried" || form.finalRestingType === "cremated") &&
        (!form.graveLat || !form.graveLng)
      ) {
        throw new Error("Please center the map or place a pin before saving the final resting place.");
      }

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
let headstonePhoto1Url = savedHeadstonePhoto1Url;
let headstonePhoto2Url = savedHeadstonePhoto2Url;
let obituaryImageUrl =
  form.obituaryImageUrl || savedObituaryImageUrl;

let galleryPhotoUrls = [...savedGalleryPhotoUrls];

let newspaperArticleUrls =
  savedNewspaperArticleUrls.length > 0
    ? [...savedNewspaperArticleUrls]
    : splitGalleryPhotos(form.newspaperArticles);

let favoriteSongUrl = savedFavoriteSongUrls[0] ?? "";

let videoLinkThumbnailUrls = [
  ...(form.videoLinkThumbnailUrls ?? []),
];

let combinedUploadedVideos = savedVideoUrls.map(
  (playbackId, index) => ({
    playbackId,
    durationSeconds: 0,
    note: savedVideoNotes[index] || "",
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
if (galleryPhotos.length > 0) {
  const newlyUploadedGalleryPhotoUrls =
    await MediaEngine.uploadSelectedGalleryPhotos({
      photos: galleryPhotos,
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
  ...savedGalleryPhotoCaptions,
  ...galleryPhotos.map((photo) => photo.caption || ""),
].slice(0, galleryPhotoUrls.length);

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

let favoriteSongUrls = [...savedFavoriteSongUrls];
let favoriteSongNotes = [...savedFavoriteSongNotes];

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
    ...savedFavoriteSongUrls,
    ...validUploadedFavoriteSongUrls,
  ].slice(0, 5);

  favoriteSongNotes = [
    ...savedFavoriteSongNotes,
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
      videoNotes,
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
  ? existingMemorialIsPublished
  : null,
});

let completedMemorialId: number;

if (draftMemorialId) {
  if (isBackupAccess) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const updateHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      updateHeaders.Authorization =
        `Bearer ${session.access_token}`;
    }

    const updateResponse = await fetch(
      "/api/memorials/update",
      {
        method: "POST",
        headers: updateHeaders,
        credentials: "include",
        body: JSON.stringify({
          memorialId: draftMemorialId,
          updatePayload: memorialData,
        }),
      }
    );

    const updateResult =
      await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(
        updateResult.error ||
          "The memorial could not be saved."
      );
    }
  } else {
    await PersistenceEngine.updateMemorial({
      memorialId: draftMemorialId,
      memorialData,
    });
  }

  completedMemorialId = draftMemorialId;
} else {
  const createResult =
    await PersistenceEngine.createMemorial({
      slug,
      memorialData,
    });

  if (!createResult.success || !createResult.memorialId) {
    throw new Error(
      createResult.error ||
        "The memorial could not be created."
    );
  }

  completedMemorialId = createResult.memorialId;
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
setForm(initialForm);
setFeaturedPhoto(null);
setHeadstonePhoto1(null);
setHeadstonePhoto2(null);
setObituaryImageFile(null);
setGalleryPhotos([]);
setNewspaperArticleFiles([]);
setFavoriteSongFiles([]);
setSelectedFavoriteSongNotes([]);
setVideoFiles([]);
setVideoError("");

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

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-7xl gap-6">
        <SideAd
  pageType={form.isLivingPreplan ? "personal" : "create"}
  memorialZip={
    form.isLivingPreplan
      ? form.creatorZip
      : form.backupZip
  }
  categorySlot={leftAdCategory}
/>

        <div className="flex-1">
          <div className="mx-auto max-w-6xl">
            <section
              className="relative overflow-hidden rounded-3xl shadow-sm"
              style={{
                backgroundImage: "url('/gravestone1.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/60" />

              <div className="relative z-10 p-8 md:p-10 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-200">
                  {form.isLivingPreplan ? "Create My Personal E-Memorial" : "Create a Memorial"}
                </p>

                <h1 className="mt-3 text-3xl font-bold md:text-4xl text-center">
  {form.isLivingPreplan
    ? "Tell Your Life Story In Your Own Words And In Your Own Way"
    : "Begin preserving a life with dignity and care"}
</h1>
{successMessage === "Payment Successful" && (
  <div
    ref={paymentSuccessBoxRef}
    className="mx-auto mt-6 mb-6 max-w-3xl rounded-xl border border-green-300 bg-green-50 p-5 text-center shadow-sm"
  >
    <h2 className="text-xl font-bold text-green-800">
      ✓ Payment Successful
    </h2>

    <p className="mt-2 text-green-700">
  Your payment has been confirmed. Continue below to complete your memorial.
</p>

    
  </div>
)}
                <p className="mt-6 text-lg text-white/90">
  {form.isLivingPreplan
    ? "Far better than an obituary or headstone with two dates, here's your opportunity to tell your own story in your own words using photos, videos, music, and moments that mattered the most to you in your life, so future generations can truly know and remember you."
    : "Preserve a life, a story, and a voice for future generations. Add photos, videos, and memories to share with loved ones."}
</p>

                <p className="mt-8 text-xl text-white">
  {form.isLivingPreplan
    ? "Add stories, photos, videos, and your favorite songs to preserve your lifetime of memories for generations to come."
    : "Add details, stories, photos, awards, videos, awards and favorite songs."}
</p>
              </div>
            </section>

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
  {!isGiftFlow && !isPaid && (
  <section
  id="plan-selection"
  className="rounded-3xl bg-white p-8 shadow-sm"
>
                <h2 className="text-2xl font-bold text-stone-900">
                  Choose a Memorial Plan
                </h2>

                <p className="mt-3 text-sm text-stone-600">
                  Choose the memorial plan you would like to use before continuing to payment.
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "basic" }))}
                    className={`rounded-3xl border p-6 text-left transition ${
                      form.plan === "basic"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                      Basic Memorial
                    </p>
                    <p className="mt-3 text-3xl font-bold">$49.95</p>
                    <p className="mt-1 text-sm opacity-80">one-time</p>

                    <ul className="mt-5 space-y-2 text-sm leading-6">
                      <li>✔ Up to 50 photos</li>
                      <li>✔ 15 minutes of Video Memories</li>
                      <li>✔ Background music</li>
                      <li>✔ Life story & obituary</li>
                      <li>✔ Unlimited contributors</li>
                      <li>✔ Contributor approval</li>
                      <li>✔ Cemetery map</li>
                    </ul>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "plus" }))}
                    className={`rounded-3xl border p-6 text-left transition ${
                      form.plan === "plus"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                      Plus Memorial
                    </p>
                    <p className="mt-3 text-3xl font-bold">$69.95</p>
                    <p className="mt-1 text-sm opacity-80">one-time</p>

                    <ul className="mt-5 space-y-2 text-sm leading-6">
                      <li>✔ Everything in Basic</li>
                      <li>✔ Up to 150 photos</li>
                      <li>✔ 30 minutes of Video Memories</li>
                    </ul>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "premium" }))}
                    className={`rounded-3xl border p-6 text-left transition ${
                      form.plan === "premium"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                      Premium Memorial
                    </p>
                    <p className="mt-3 text-3xl font-bold">$89.95</p>
                    <p className="mt-1 text-sm opacity-80">one-time</p>

                    <ul className="mt-5 space-y-2 text-sm leading-6">
                      <li>✔ Everything in Plus</li>
                      <li>✔ Unlimited photos</li>
                      <li>✔ 60 minutes of Video Memories</li>
                    </ul>
                  </button>
                </div>

                <p className="mt-6 text-sm text-stone-500">
                  Contributors may add photos and text for free, subject to memorial owner approval.
                </p>
              </section>
              )}
              {!isPaid && (
<section
  id="promo-access"
  className="scroll-mt-6 rounded-3xl bg-white p-8 shadow-sm"
>
  
                {errorMessage && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div className="flex flex-col gap-4">
  {isPaid ? (
  <div className="space-y-3">
    {successMessage && (
      <p className="text-sm font-semibold text-green-700">
        {successMessage}
      </p>
    )}
  </div>
) : (
      
  
    <>
      <Input
  label="Enter the promo code you received in your email"
  name="betaCode"
  value={form.betaCode}
  onChange={handleChange}
/>
{form.betaCode.trim() && (
<div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Promotion Category
  </label>

  <select
    name="promotionCategory"
    value={form.promotionCategory}
    onChange={handleChange}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  >
    <option value="personal">Personal</option>
    <option value="attorney">Attorney</option>
    <option value="estate_planner">Estate Planner</option>
    <option value="funeral_home">Funeral Home</option>
    <option value="monument_company">Monument Company</option>
    <option value="flower_shop">Flower Shop</option>
    <option value="cemetery">Cemetery</option>
    <option value="church">Church</option>
    <option value="other">Other</option>
  </select>
</div>
)}
<label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        />
        <span>
          I agree to the{" "}
          <a href="/terms" className="underline">
            Terms of Service
          </a>
        </span>
      </label>
{!form.betaCode.trim() && (
      <button
        type="button"
        disabled={isSubmitting}
        onClick={async () => {
          if (!agreedToTerms) {
            alert("You must agree to the Terms of Service before continuing.");
            return;
          }
const {
  data: { user },
} = await supabase.auth.getUser();
const selectedPlan = form.plan || "basic";


if (!user) {
  const currentPath =
    window.location.pathname +
    window.location.search +
    (window.location.search ? "&" : "?") +
    "autocheckout=1";
const selectedPlan = form.plan || "basic";

          localStorage.setItem(
  "memorialDraft",
  JSON.stringify({
    ...form,
    plan: form.plan || "basic",
  })
);
localStorage.setItem("agreedToTerms", "true");
  window.location.assign(
    `/login?mode=choice&redirect=${encodeURIComponent(currentPath)}`
  );

  return;
}
          

          const planPrices = {
            basic: 4995,
            plus: 6995,
            premium: 8995,
          };

          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
  plan: selectedPlan,
  amount: planPrices[selectedPlan as keyof typeof planPrices],
 returnUrl: `${window.location.origin}/create${
  form.isLivingPreplan || isPersonalMode ? "?mode=personal" : ""
}`,
}),
          });

          const data = await res.json();

          if (data.url) {
            window.location.href = data.url;
          } else {
            alert("Error starting checkout");
          }
        }}
        className="w-fit rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Continue to Payment —{" "}
        {form.plan === "plus"
          ? "$69.95"
          : form.plan === "premium"
          ? "$89.95"
          : "$49.95"}

      </button>
      )}
      
     <button
  type="button"
  onClick={async () => {
  const enteredCode = form.betaCode.trim().toUpperCase();

  if (!enteredCode) {
    alert("Please enter a promotional code.");
    return;
  }

  if (!agreedToTerms) {
    alert("You must agree to the Terms of Service before continuing.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
  const currentPath =
    window.location.pathname +
    window.location.search +
    (window.location.search ? "&" : "?") +
    "autocheckout=1";

  localStorage.setItem("memorialDraft", JSON.stringify(form));
localStorage.setItem("agreedToTerms", "true");
  window.location.assign(
  `/login?mode=choice&redirect=${encodeURIComponent(currentPath)}`
);

  return;
}

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
  alert(data.error || "Invalid or inactive promotional code.");
  return;
}

const promoCode = data.promoCode;

  setForm((prev) => ({
    ...prev,
    plan: promoCode.allowed_plan || prev.plan,
    promotionCategory: promoCode.promotion_category || prev.promotionCategory,
  }));

  setIsPaid(true);
setSuccessMessage(
  "Free beta access approved. Please complete the memorial form above, then click Save Memorial when finished."
);
}}
  className="w-fit rounded-full border border-green-700 bg-white px-6 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
>
  Activate Free Premium Access
</button>
    </>
  )}


                  <button
                    type="button"
                    onClick={clearForm}
                    className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                  >
                    Clear Form
                  </button>
                </div>
              </section>
   )}           
              <GuidedMemoryBuilder
  experienceType={
    form.isLivingPreplan && isBackupAccess
      ? "after-death"
      : form.isLivingPreplan
        ? "personal"
        : "memorial"
  }
  isSaving={isSubmitting}
  initialChapterId={guidedInitialChapterId}
    finalButtonLabel={
    form.isLivingPreplan && isBackupAccess
      ? "Save After-Death Updates"
      : "Finish Review"
  }
  onSaveAndContinue={(chapter) => {
  if (chapter.id !== "review") {
    return;
  }

  if (isPaid) {
    const createForm = document.getElementById(
  "create-memorial-form"
) as HTMLFormElement | null;

createForm?.requestSubmit();

    return;
  }

  document
    .getElementById("plan-selection")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
}}
onSaveAndExit={async (chapter) => {
  const hasUnsavedFiles = false;

  if (hasUnsavedFiles) {
    const shouldExit = window.confirm(
      "Your written information can be saved as a draft, but the photos, videos, music, obituary images, or newspaper files you selected have not been uploaded yet and will need to be selected again when you return.\n\nDo you still want to Save & Exit?"
    );

    if (!shouldExit) {
      return;
    }
  }

  try {
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
let headstonePhoto1Url = savedHeadstonePhoto1Url;
let headstonePhoto2Url = savedHeadstonePhoto2Url;
let obituaryImageUrl = savedObituaryImageUrl;
let galleryPhotoUrls = savedGalleryPhotoUrls;
let newspaperArticleUrls = savedNewspaperArticleUrls;
let favoriteSongUrl = savedFavoriteSongUrls[0] ?? "";

let videoLinkThumbnailUrls = [
  ...(form.videoLinkThumbnailUrls ?? []),
];

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

if (galleryPhotos.length > 0) {
  const uploadedGalleryPhotoUrls =
    await MediaEngine.uploadSelectedGalleryPhotos({
      photos: galleryPhotos,
      slug,
      setGalleryPhotos,
      setGalleryUploadProgress,
      setIsGalleryUploading,
    });

  galleryPhotoUrls = [
    ...savedGalleryPhotoUrls,
    ...uploadedGalleryPhotoUrls,
  ];

  setSavedGalleryPhotoUrls(galleryPhotoUrls);
}
const galleryPhotoCaptions = [
  ...savedGalleryPhotoCaptions,
  ...galleryPhotos.map((photo) => photo.caption || ""),
].slice(0, galleryPhotoUrls.length);

if (newspaperArticleFiles.length > 0) {
  const uploadedNewspaperArticleUrls = await Promise.all(
    newspaperArticleFiles.map((file) =>
      MediaEngine.uploadOptionalFile(
        file,
        slug,
        "memorial-articles"
      )
    )
  );

  newspaperArticleUrls = [
    ...savedNewspaperArticleUrls,
    ...uploadedNewspaperArticleUrls.filter(
      (url): url is string => Boolean(url)
    ),
  ];

  setSavedNewspaperArticleUrls(newspaperArticleUrls);

setForm((previousForm) => ({
  ...previousForm,
  newspaperArticles: newspaperArticleUrls.join(","),
}));
}

let favoriteSongUrls = [...savedFavoriteSongUrls];
let favoriteSongNotes = [...savedFavoriteSongNotes];

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
    ...savedFavoriteSongUrls,
    ...validUploadedFavoriteSongUrls,
  ].slice(0, 5);

  favoriteSongNotes = [
    ...savedFavoriteSongNotes,
    ...selectedFavoriteSongNotes,
  ].slice(0, 5);
}
let combinedUploadedVideos = savedVideoUrls.map(
  (playbackId, index) => ({
    playbackId,
    durationSeconds: 0,
    note: savedVideoNotes[index] || "",
    originalFilename: "",
    fileSize: 0,
  })
);

if (videoFiles.length > 0) {
  const newlyUploadedVideos =
    await MediaEngine.uploadVideos({
      videoFiles,
      videoNotes,
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
  isDraft: !isExistingMemorialEdit,
guidedCurrentChapter: chapter.id,
existingIsPublished: isExistingMemorialEdit
  ? existingMemorialIsPublished
  : null,
});

    if (draftMemorialId) {
  const updateHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    updateHeaders.Authorization =
      `Bearer ${session.access_token}`;
  }

  const updateResponse = await fetch(
    "/api/memorials/update",
    {
      method: "POST",
      headers: updateHeaders,
      credentials: "include",
      body: JSON.stringify({
        memorialId: draftMemorialId,
        updatePayload: memorialData,
      }),
    }
  );

  const updateResult = await updateResponse.json();

  if (!updateResponse.ok) {
    throw new Error(
      updateResult.error ||
        "The memorial could not be saved."
    );
  }
} else {
  const createResult =
    await PersistenceEngine.createMemorial({
      slug,
      memorialData,
    });

  if (!createResult.success || !createResult.memorialId) {
    throw new Error(
      createResult.error ||
        "The draft memorial could not be saved."
    );
  }

  setDraftMemorialId(createResult.memorialId);
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

    if (isBackupAccess) {
  window.location.assign(
    `/memorial/${slug}/manage`
  );
} else {
  window.location.assign("/my-memorials");
}
  } catch (error) {
    console.error("SAVE GUIDED DRAFT ERROR:", error);

    alert(
      error instanceof Error
        ? `Could not save your draft: ${error.message}`
        : "Could not save your draft."
    );
  }
}}
  renderChapter={(chapter) => {
 switch (chapter.id) {
  case "basic-information":
    return (
      <BasicInformationSection
        form={form}
        handleChange={handleChange}
        setFeaturedPhotoFile={setFeaturedPhoto}
        isSaving={isSubmitting}
        isPublished={false}
        isPaid={isPaid}
      />
    );

  case "family-history":
    return (
      <FamilyHistorySection
        form={form}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
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
      <PlacesLivedSection
        placesLived={form.placesLived}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    );

  case "places-worked":
    return (
      <PlacesWorkedSection
        placesWorked={form.placesWorked}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    );

  case "schools-and-awards":
    return (
      <SchoolsAndAwardsSection
        schoolsAttended={form.schoolsAttended}
        awardsWon={form.awardsWon}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    );

  case "social-media":
    return (
      <SocialMediaSection
        form={form}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    );

  case "newspaper-articles":
    return (
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
    );

  case "favorite-songs":
  return (
    <FavoriteSongsSection
      firstName={form.firstName}
      favoriteSongUrl={savedFavoriteSongUrls[0] ?? ""}
      favoriteSongUrls={savedFavoriteSongUrls}
      favoriteSongNotes={savedFavoriteSongNotes}
      favoriteSongFiles={favoriteSongFiles}
      selectedFavoriteSongNotes={selectedFavoriteSongNotes}
      handleChange={handleChange}
      setForm={setForm}
      isPaid={isPaid}
      setFavoriteSongFiles={setFavoriteSongFiles}
      setSelectedFavoriteSongNotes={setSelectedFavoriteSongNotes}
      setFavoriteSongUrls={setSavedFavoriteSongUrls}
      setFavoriteSongNotes={setSavedFavoriteSongNotes}
    />
  );

  case "photo-gallery":
    return (
      <Section title="Photo Gallery">
        <div>
          <CreateGallerySection
  form={form}
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

          <p className="mt-2 text-sm text-stone-500">
            You can select multiple gallery images at once.
          </p>
        </div>
      </Section>
    );

  case "video-memories":
    return (
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
        setVideoFiles={setVideoFiles}
setVideoNotes={setVideoNotes}
videoLinkThumbnailFiles={videoLinkThumbnailFiles}
setVideoLinkThumbnailFiles={setVideoLinkThumbnailFiles}
setForm={setForm}
      />
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
      <BackupPersonSection
        form={form}
        handleChange={handleChange}
        isSaving={isSubmitting}
        isPublished={false}
      />
    );

  case "review":
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-8 text-center">
      <h2 className="text-2xl font-bold text-stone-900">
        {form.isLivingPreplan && isBackupAccess
          ? "Review the Memorial Before Publication"
          : form.isLivingPreplan
            ? "Review Your Personal E-Memorial"
            : "Review the Memorial"}
      </h2>

      {form.isLivingPreplan && isBackupAccess ? (
        <>
          <p className="mt-4 text-stone-700">
            Review the information you have added, including the date of death,
            obituary, and final resting place.
          </p>

          <p className="mt-4 font-semibold text-stone-900">
            This Personal E-Memorial is still private.
          </p>

          <p className="mt-2 text-stone-600">
            Clicking Save After-Death Updates will save your changes but will
            not publish the memorial. You will have a separate opportunity to
            publish it after these updates are saved.
          </p>
        </>
      ) : (
        <p className="mt-3 text-stone-600">
          Review what has been preserved and make any additions before
          continuing.
        </p>
      )}
    </div>
  );

    default:
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <p className="text-stone-600">
          This chapter has not been connected yet.
        </p>
      </div>
    );
  }
}}
/>    
            </form>
          </div>
        </div>

        <SideAd
  pageType={form.isLivingPreplan ? "personal" : "create"}
  memorialZip={
    form.isLivingPreplan
      ? form.creatorZip
      : form.backupZip
  }
  categorySlot={rightAdCategory}
/>
      </div>
    </main>
  );
}
export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageContent />
    </Suspense>
  );
}
function splitGalleryPhotos(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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