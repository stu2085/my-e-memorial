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
  const [isPaid, setIsPaid] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const MAX_VIDEO_SIZE_BYTES = 1000 * 1000 * 1000; // 1 GB
  const [mapSearchStatus, setMapSearchStatus] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
const [paidExtraVideos, setPaidExtraVideos] = useState(0);
const [featuredPhoto, setFeaturedPhoto] = useState<File | null>(null);
  const [headstonePhoto1, setHeadstonePhoto1] = useState<File | null>(null);
  const [headstonePhoto2, setHeadstonePhoto2] = useState<File | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [newspaperArticleFiles, setNewspaperArticleFiles] =
  useState<File[]>([]);
  const [galleryUploadProgress, setGalleryUploadProgress] =
  useState<UploadProgress | null>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);



  const [favoriteSongFile, setFavoriteSongFile] = useState<File | null>(null);
const [draftReady, setDraftReady] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoNotes, setVideoNotes] = useState<string[]>([]);
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

    const isPersonalModeFromUrl =
      mode === "personal" || mode === "preplan";

    const savedDraft = localStorage.getItem("memorialDraft");
    const extraVideosPaid = Number(params.get("extra_videos_paid") || 0);
    const promoFromUrl = params.get("promo");
    const sessionId = params.get("session_id");
    const autoCheckout = params.get("autocheckout");

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

    if (!sessionId && autoCheckout !== "1") {
      setIsPaid(false);
      return;
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

      const slug = await SlugEngine.createUniqueSlug(baseSlug);
      const uploadedVideoUrls =
  await MediaEngine.uploadVideos({
    videoFiles,
    videoNotes,
  });
      const folder = slug;

      const featuredPhotoUrl =
  await MediaEngine.uploadOptionalFile(
    featuredPhoto,
    folder,
    "memorial-photos"
  );

const headstonePhoto1Url =
  await MediaEngine.uploadOptionalFile(
    headstonePhoto1,
    folder,
    "memorial-photos"
  );

const headstonePhoto2Url =
  await MediaEngine.uploadOptionalFile(
    headstonePhoto2,
    folder,
    "memorial-photos"
  );

let galleryPhotoUrls: string[] = [];
let newspaperArticleUrls = splitGalleryPhotos(form.newspaperArticles);
let favoriteSongUrl = "";

      if (galleryPhotos.length > 0) {
  galleryPhotoUrls =
  await MediaEngine.uploadSelectedGalleryPhotos({
    photos: galleryPhotos,
    slug,
    setGalleryPhotos,
    setGalleryUploadProgress,
    setIsGalleryUploading,
  });
}
if (newspaperArticleFiles.length > 0) {
  const uploadedNewspaperArticleUrls = await Promise.all(
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
    ...uploadedNewspaperArticleUrls.filter(
      (url): url is string => Boolean(url)
    ),
  ];
}

      favoriteSongUrl =
  await MediaEngine.uploadOptionalFile(
    favoriteSongFile,
    folder,
    "memorial-audio"
  );

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
    throw new Error(data.error || "Invalid or inactive promo code.");
  }

  const promoCode = data.promoCode;

  usingBetaCode = true;

  if (promoCode.allowed_plan) {
    selectedPlan = promoCode.allowed_plan as PlanKey;
  }
}
// TEMP: allow creation without login
// if (!authUser) {
//   throw new Error("You must be logged in before creating a memorial.");
// }

      const memorialData = PersistenceEngine.buildMemorialData({
  slug,
  form,
  fullName,
  ownerId: authUser?.id ?? null,
  selectedPlan,
  requiresReview,
  usingBetaCode,
  featuredPhotoUrl,
  headstonePhoto1Url,
  headstonePhoto2Url,
  galleryPhotoUrls,
newspaperArticleUrls,
favoriteSongUrl,
  uploadedVideos: uploadedVideoUrls,
});

const createResult = await PersistenceEngine.createMemorial({
  slug,
  memorialData,
});

if (!createResult.success || !createResult.memorialId) {
  throw new Error(
    createResult.error || "The memorial could not be created."
  );
}

const createdMemorial = {
  id: createResult.memorialId,
};
      await PersistenceEngine.createMemorialVideos({
  memorialId: createdMemorial.id,
  videos: uploadedVideoUrls,
});
if (usingBetaCode && form.betaCode.trim()) {
  await PersistenceEngine.incrementPromoCodeUsage(
    form.betaCode
  );
}
      localStorage.removeItem("memorialDraft");
localStorage.removeItem("paidExtraVideos");
setForm(initialForm);
setFeaturedPhoto(null);
setHeadstonePhoto1(null);
setHeadstonePhoto2(null);
setGalleryPhotos([]);
setNewspaperArticleFiles([]);
setFavoriteSongFile(null);
setVideoFiles([]);
setVideoError("");

if (requiresReview) {
  alert(
    "This memorial requires review before publication."
  );
}

window.location.assign(`/memorial/${slug}/edit`);
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
    setFavoriteSongFile(null);
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
      Your memorial has not been created yet. Please save it first. After saving,
      you'll automatically be taken to the Edit page where you can upload photos,
      videos, music, and additional information.
    </p>

    <button
      type="submit"
      form="create-memorial-form"
      className="mt-4 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
    >
      Save Memorial & Begin Editing
    </button>
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

            {successMessage && (
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
  <section className="rounded-3xl bg-white p-8 shadow-sm">
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

    <button
      type="submit"
      disabled={isSubmitting}
      className="w-fit rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? "Saving Memorial..." : "Save Memorial"}
    </button>
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
              <BasicInformationSection
  form={form}
  handleChange={handleChange}
  setFeaturedPhotoFile={setFeaturedPhoto}
  isSaving={isSubmitting}
  isPublished={false}
  isPaid={isPaid}
/>
{form.isLivingPreplan && (
 <BackupPersonSection
    form={form}
    handleChange={handleChange}
    isSaving={isSubmitting}
    isPublished={false}
  />
  )}
<LifeStorySection
  form={form}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
/>
<FamilyHistorySection
  form={form}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
/>
<SocialMediaSection
  form={form}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
/>
<PlacesLivedSection
  placesLived={form.placesLived}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
/>
<PlacesWorkedSection
  placesWorked={form.placesWorked}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
/>
<SchoolsAndAwardsSection
  schoolsAttended={form.schoolsAttended}
  awardsWon={form.awardsWon}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
/>
<NewspaperArticlesSection
  newspaperArticles={form.newspaperArticles}
  handleChange={handleChange}
  splitGalleryPhotos={splitGalleryPhotos}
  setNewspaperArticles={(value) =>
  setForm((previousForm) => ({
    ...previousForm,
    newspaperArticles: value,
  }))
}
  setNewspaperArticleFiles={setNewspaperArticleFiles}
  isSaving={isSubmitting}
  isPublished={false}
/>
  <FavoriteSongsSection
  firstName={form.firstName}
  favoriteSongUrl=""
  favoriteSongUrls={[]}
  favoriteSongNotes={[]}
  handleChange={handleChange}
  setForm={setForm}
  isPaid={isPaid}
  setFavoriteSongFiles={(filesOrUpdater) => {
    if (Array.isArray(filesOrUpdater)) {
      setFavoriteSongFile(filesOrUpdater[0] ?? null);
    }
  }}
/>
 <Section title="Photo Gallery">
  <div>
    <CreateGallerySection
      form={form}
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
<CreateVideoMemoriesSection
  isPaid={isPaid}
  videoFiles={videoFiles}
  videoNotes={videoNotes}
  videoError={videoError}
  form={form}
  handleVideoChange={handleVideoChange}
  setVideoFiles={setVideoFiles}
  setVideoNotes={setVideoNotes}
/>
<HeadstonePhotosSection
  setHeadstonePhoto1File={setHeadstonePhoto1}
  setHeadstonePhoto2File={setHeadstonePhoto2}
  isPaid={isPaid}
/>
 <ObituarySection
  form={form}
  handleChange={handleChange}
  isSaving={isSubmitting}
  isPublished={false}
  isPaid={isPaid}
/>
   <FinalRestingPlaceSection
  form={form}
  handleChange={handleChange}
  handleDispositionChange={handleChange}
  handleCenterMap={handleCenterMap}
  handleUseCurrentLocation={() => {}}
  mapSearchStatus={mapSearchStatus}
  locationStatus=""
  setForm={setForm}
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