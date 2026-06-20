"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SideAd from "../components/SideAd";
import { supabase } from "../lib/supabase";
import dynamic from "next/dynamic";
import { famousNames } from "../lib/famousNames";
const GraveLocationMap = dynamic(
  () => import("../components/GraveLocationMap"),
  { ssr: false }
);

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
    videos: 2,
  },
  plus: {
    label: "Plus Memorial",
    galleryPhotos: 150,
    videos: 5,
  },
  premium: {
    label: "Premium Memorial",
    galleryPhotos: Infinity,
    videos: 10,
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
  const [galleryPhotos, setGalleryPhotos] = useState<File[]>([]);
  const [favoriteSongFile, setFavoriteSongFile] = useState<File | null>(null);
const [draftReady, setDraftReady] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoNotes, setVideoNotes] = useState<string[]>([]);
  const [videoError, setVideoError] = useState("");

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

    if (savedDraft) {
      const parsedDraft = JSON.parse(savedDraft);

      setForm({
        ...initialForm,
        ...parsedDraft,
        isLivingPreplan:
          isPersonalModeFromUrl || parsedDraft.isLivingPreplan === true,
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
        const parsedDraft = JSON.parse(savedDraft);
        const selectedPlan = parsedDraft.plan || "basic";

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
              isPersonalModeFromUrl ? "?mode=personal" : ""
            }`,
          }),
        });

       const data = await res.json();

if (data.url) {
  // Facebook Pixel: user started checkout
  if (
    typeof window !== "undefined" &&
    typeof (window as any).fbq === "function"
  ) {
    (window as any).fbq("track", "InitiateCheckout");
  }

  // Give Facebook a fraction of a second to send the event
  setTimeout(() => {
    window.location.href = data.url;
  }, 300);
}

return;
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
    setIsPaid(data.paid === true);
  }

  verifyPayment();
}, [searchParams]);
useEffect(() => {
  if (!draftReady) return;

  const isPersonalModeFromUrl = searchParams.get("mode") === "personal";

  localStorage.setItem(
    "memorialDraft",
    JSON.stringify({
      ...form,
      isLivingPreplan: isPersonalModeFromUrl || form.isLivingPreplan,
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
    const street = form.mapStreet.trim();
    const city = form.mapCity.trim();
    const state = form.mapState.trim();
    const zip = form.mapZip.trim();
    const country = form.mapCountry.trim() || "USA";

    if (!street && !city && !state && !zip) {
      setMapSearchStatus("Enter at least a city and state, or a full address.");
      return;
    }

    setMapSearchStatus("Searching for location...");

    try {
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
        setMapSearchStatus(data.error || "No matching location found.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        graveLat: Number(data.lat).toFixed(6),
        graveLng: Number(data.lng).toFixed(6),
      }));

      setMapSearchStatus("Map centered on the address. You can now zoom in and place the pin.");
    } catch {
      setMapSearchStatus("Could not search that location.");
    }
  }

  function makeSlug() {
    const fullName = `${form.firstName} ${form.middleName} ${form.lastName}`
      .replace(/\s+/g, " ")
      .trim();

    return fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function generateUniqueSlug(baseSlug: string) {
    let candidate = baseSlug;
    let counter = 2;

    while (true) {
      const { data, error } = await supabase
        .from("memorials")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  async function uploadFile(file: File, folder: string, bucket: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return data.publicUrl;
  }

  function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error(`Could not read video duration for ${file.name}`));
        return;
      }

      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read video duration for ${file.name}`));
    };

    video.src = url;
    video.load();
  });
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

 const maxVideos = limits.videos + paidExtraVideos;
const totalVideos = videoFiles.length + newUniqueFiles.length;
const [videoNotes, setVideoNotes] = useState<string[]>([]);
if (totalVideos > maxVideos) {
    setVideoError(
      `${limits.label} allows up to ${maxVideos} videos. You selected ${totalVideos}.`
    );
    e.target.value = "";
    return;
  }

  for (const file of newUniqueFiles) {
    const duration = await getVideoDuration(file);

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


  async function uploadVideos(slug: string) {
    if (videoFiles.length === 0) return [];
    const oversizedFile = videoFiles.find(
  (file) => file.size > MAX_VIDEO_SIZE_BYTES
);

if (oversizedFile) {
  throw new Error(
    `"${oversizedFile.name}" is too large. Maximum video size is 1 GB.`
  );
}
for (const file of videoFiles) {
  const duration = await getVideoDuration(file);

  if (duration > 300) {
    throw new Error(
      `"${file.name}" is longer than 5 minutes. Please remove it before saving.`
    );
  }
}
    const playbackIds: string[] = [];

    for (const file of videoFiles) {
      const uploadRes = await fetch("/api/mux-upload", {
        method: "POST",
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.uploadUrl || !uploadData.uploadId) {
        throw new Error(uploadData.error || "Could not create Mux upload.");
      }

      const putRes = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!putRes.ok) {
        throw new Error(`Mux upload failed for ${file.name}.`);
      }

      const playbackRes = await fetch("/api/mux-playback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadId: uploadData.uploadId }),
      });

      const playbackData = await playbackRes.json();

      if (playbackData.playbackId) {
        playbackIds.push(playbackData.playbackId);
      }
    }

    return playbackIds;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const baseSlug = makeSlug();

      if (!form.firstName.trim() || !form.lastName.trim()) {
        throw new Error("Please enter both a first and last name before continuing.");
      }

      if (!form.plan) {
        throw new Error("Please choose a memorial plan before continuing.");
      }

      let selectedPlan = form.plan as PlanKey;
      const limits = PLAN_LIMITS[selectedPlan];

      if (!limits) {
        throw new Error("Please choose a valid memorial plan before continuing.");
      }

      if (galleryPhotos.length > limits.galleryPhotos) {
        throw new Error(
          `${limits.label} allows up to ${limits.galleryPhotos} gallery photos.`
        );
      }

      if (videoFiles.length > limits.videos) {
        throw new Error(
          `${limits.label} allows up to ${limits.videos} video${limits.videos === 1 ? "" : "s"}.`
        );
      }

      if (
        (form.finalRestingType === "buried" || form.finalRestingType === "cremated") &&
        (!form.graveLat || !form.graveLng)
      ) {
        throw new Error("Please center the map or place a pin before saving the final resting place.");
      }

      const slug = await generateUniqueSlug(baseSlug);
      const uploadedVideoUrls = await uploadVideos(slug);
      const folder = slug;

      let featuredPhotoUrl = "";
let headstonePhoto1Url = "";
let headstonePhoto2Url = "";
let galleryPhotoUrls: string[] = [];
let favoriteSongUrl = "";
if (featuredPhoto) {
  featuredPhotoUrl = await uploadFile(
    featuredPhoto,
    folder,
    "memorial-photos"
  );
}
      if (headstonePhoto1) {
        headstonePhoto1Url = await uploadFile(
          headstonePhoto1,
          folder,
          "memorial-photos"
        );
      }

      if (headstonePhoto2) {
        headstonePhoto2Url = await uploadFile(
          headstonePhoto2,
          folder,
          "memorial-photos"
        );
      }

      if (galleryPhotos.length > 0) {
        galleryPhotoUrls = await Promise.all(
          galleryPhotos.map((file) => uploadFile(file, folder, "memorial-photos"))
        );
      }

      if (favoriteSongFile) {
        favoriteSongUrl = await uploadFile(
          favoriteSongFile,
          folder,
          "memorial-audio"
        );
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

      const { error } = await supabase
        .from("memorials")
        .insert({
          slug,
          full_name: fullName,
          first_name: form.firstName,
          middle_name: form.middleName,
          last_name: form.lastName,
          owner_id: authUser?.id ?? null,
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
          video_urls: uploadedVideoUrls,
video_notes: videoNotes,
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
        });

      if (error) {
        console.error("SUPABASE INSERT ERROR:", error);
        throw new Error(error.message);
      }
if (usingBetaCode && form.betaCode.trim()) {
  const enteredCode = form.betaCode.trim().toUpperCase();

  const { data: promoCode } = await supabase
    .from("promo_codes")
    .select("id, uses_count")
    .eq("code", enteredCode)
    .maybeSingle();

  if (promoCode) {
    await supabase
      .from("promo_codes")
      .update({
        uses_count: Number(promoCode.uses_count || 0) + 1,
      })
      .eq("id", promoCode.id);
  }
}
      localStorage.removeItem("memorialDraft");
localStorage.removeItem("paidExtraVideos");
setForm(initialForm);
setFeaturedPhoto(null);
setHeadstonePhoto1(null);
setHeadstonePhoto2(null);
setGalleryPhotos([]);
setFavoriteSongFile(null);
setVideoFiles([]);
setVideoError("");

if (requiresReview) {
  alert(
    "This memorial requires review before publication."
  );
}

window.location.assign(`/memorial/${slug}`);
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

            <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-8">
              <Section title="Basic Identity">
  <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 p-5">
    <label className="mb-2 block text-sm font-semibold text-stone-800">
      Featured Memorial Photo
    </label>

    <p className="mb-4 text-sm text-stone-600">
      This photo will appear at the top of the public memorial page.
    </p>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setFeaturedPhoto(e.target.files?.[0] ?? null)}
      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
    />
    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  Uploads are not permanently saved until payment is completed. If you leave this page before checkout, uploaded files may need to be selected again.
</div>
  </div>

  <Grid>
                  <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required autoComplete="new-password" />

<Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} autoComplete="new-password" />

<Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required autoComplete="new-password" />
                 
                  <Input label="Maiden Name" name="maidenName" value={form.maidenName} onChange={handleChange} autoComplete="off"/>
                  <Input label="Nickname" name="nickname" value={form.nickname} onChange={handleChange} autoComplete="off"/>

                  <Select
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={["Male", "Female", "Other", "Prefer not to say"]}
                  />

                  <Input label="Birth Date" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} />
                  <Input label="Death Date" name="deathDate" type="date" value={form.deathDate} onChange={handleChange} />
                </Grid>
              </Section>
     {form.isLivingPreplan && (
<Section
  title="Backup Person Access"
>
  <Grid>
    <Input
  label="Backup Person Name"
  name="backupPersonName"
  value={form.backupPersonName}
  onChange={handleChange}
/>
    <Input
      label="Backup Email"
      name="backupEmail"
      value={form.backupEmail}
      onChange={handleChange}
      autoComplete="off"
    />
<Input
  label="Backup Person Password"
  name="backupPassword"
  value={form.backupPassword}
  onChange={handleChange}
  autoComplete="new-password"
/>
    
    <Input
  label="Backup Street Address"
  name="backupStreet"
  value={form.backupStreet}
  onChange={handleChange}
/>

<Input
  label="Backup City"
  name="backupCity"
  value={form.backupCity}
  onChange={handleChange}
/>

<div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Backup State
  </label>

  <select
    name="backupState"
    value={form.backupState}
    onChange={handleChange}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  >
    <option value="">Select a state</option>

    {US_STATES.map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ))}
  </select>
</div>

<Input
  label="Backup ZIP Code"
  name="backupZip"
  value={form.backupZip}
  onChange={handleChange}
/>
  </Grid>
</Section>
)}         
{form.isLivingPreplan && (
  <Section title="Personal E-Memorial Backup Person">
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-semibold text-amber-900">
        This personal E-Memorial will be saved but not published.
      </p>
      <p className="mt-2 text-sm leading-6 text-amber-800">
        Your backup person will be responsible for completing and publishing this memorial upon your passing.
      </p>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      <Input
        label="Backup Person Name"
        name="backupPersonName"
        value={form.backupPersonName}
        onChange={handleChange}
      />
<Input
  label="Your Street Address"
  name="creatorStreet"
  value={form.creatorStreet}
  onChange={handleChange}
/>

<Input
  label="Your City"
  name="creatorCity"
  value={form.creatorCity}
  onChange={handleChange}
/>

<div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Your State
  </label>

  <select
    name="creatorState"
    value={form.creatorState}
    onChange={handleChange}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  >
    <option value="">Select a state</option>

    {US_STATES.map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ))}
  </select>
</div>

<Input
  label="Your ZIP Code"
  name="creatorZip"
  value={form.creatorZip}
  onChange={handleChange}
/>
      <Input
        label="Backup Person Email"
        name="backupPersonEmail"
        value={form.backupPersonEmail}
        onChange={handleChange}
      />
<Input
  label="Backup Person Password"
  name="backupPassword"
  value={form.backupPassword}
  onChange={handleChange}
  autoComplete="new-password"
/>
      <Input
        label="Backup Person Username"
        name="backupPersonUsername"
        value={form.backupPersonUsername}
        onChange={handleChange}
      />
    </div>
  </Section>
)}
              <Section title="Life Story">
                <div className="grid grid-cols-1 gap-6">
                  
                  <TextArea
                    label="Obituary"
                    name="obituary"
                    value={form.obituary}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Enter obituary text..."
                  />
<Input
  label="Obituary Link (optional)"
  name="obituaryUrl"
  value={form.obituaryUrl}
  onChange={handleChange}
/>
                  <TextArea
                    label="Life Story"
                    name="lifeStory"
                    value={form.lifeStory}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Share the person's story, accomplishments, and memories..."
                  />
                  
                </div>
              </Section>
<Section title="Family History">
  <div className="grid grid-cols-1 gap-6">
    <TextArea
      label="Great Grandparents Names"
      name="greatGrandparentsNames"
      value={form.greatGrandparentsNames}
      onChange={handleChange}
      rows={3}
      placeholder="Enter great grandparents names..."
    />

    <TextArea
      label="Grandparents Names — Father’s Side"
      name="grandparentsFatherSide"
      value={form.grandparentsFatherSide}
      onChange={handleChange}
      rows={3}
      placeholder="Enter grandparents on father’s side..."
    />

    <TextArea
      label="Grandparents Names — Mother’s Side"
      name="grandparentsMotherSide"
      value={form.grandparentsMotherSide}
      onChange={handleChange}
      rows={3}
      placeholder="Enter grandparents on mother’s side..."
    />

    <TextArea
      label="Parents Names"
      name="parentsNames"
      value={form.parentsNames}
      onChange={handleChange}
      rows={3}
      placeholder="Enter parents names..."
    />

    <TextArea
      label="Siblings Names"
      name="siblingsNames"
      value={form.siblingsNames}
      onChange={handleChange}
      rows={3}
      placeholder="Enter siblings names..."
    />

    <TextArea
      label="Children Names"
      name="childrenNames"
      value={form.childrenNames}
      onChange={handleChange}
      rows={3}
      placeholder="Enter children names..."
    />

    <TextArea
      label="Grandchildren Names"
      name="grandchildrenNames"
      value={form.grandchildrenNames}
      onChange={handleChange}
      rows={3}
      placeholder="Enter grandchildren names..."
    />

    <TextArea
      label="Great Grandchildren Names"
      name="greatGrandchildrenNames"
      value={form.greatGrandchildrenNames}
      onChange={handleChange}
      rows={3}
      placeholder="Enter great grandchildren names..."
    />
  </div>
</Section>

              <Section title="Favorite Song">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Upload Favorite Song
                  </label>

                  <input
                    type="file"
                    accept=".mp3,.m4a,.wav,.mp4,audio/*,video/mp4"
                    onChange={(e) => setFavoriteSongFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
                  />
<div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  Audio uploads are not permanently saved until payment is completed. If you leave this page before checkout, you may need to select the file again.
</div>
                  <p className="mt-2 text-sm text-stone-600">
                    Please only upload music for which you hold the rights or that is royalty-free.
                    By uploading, you confirm you have the legal right to share this audio.
                    We recommend using licensed or royalty-free tracks.
                  </p>
                </div>
              </Section>

              <Section title="Final Resting Place">
                <Grid>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-800">
                      Was this person buried or cremated?
                    </label>

                    <select
                      name="finalRestingType"
                      value={form.finalRestingType}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
                    >
                      <option value="">Not specified</option>
                      <option value="buried">Buried</option>
                      <option value="cremated">Cremated</option>
                    </select>
                  </div>
                </Grid>

                {form.finalRestingType === "buried" && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input label="Cemetery Name" name="cemeteryName" value={form.cemeteryName} onChange={handleChange} />
                    <Input label="Grave Section" name="graveSection" value={form.graveSection} onChange={handleChange} />
                    <Input label="Grave Row" name="graveRow" value={form.graveRow} onChange={handleChange} />
                    <Input label="Grave Plot" name="gravePlot" value={form.gravePlot} onChange={handleChange} />
                  </div>
                )}

                {form.finalRestingType === "cremated" && (
                  <div className="mt-6">
                    <TextArea
                      label="Where were the ashes scattered or placed?"
                      name="ashesLocationDescription"
                      value={form.ashesLocationDescription}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Example: Ashes were scattered at the family farm in Lancaster County, PA."
                    />
                  </div>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Input label="Street Address (recommended for map)" name="mapStreet" value={form.mapStreet} onChange={handleChange} />
                  <Input label="City (recommended for map)" name="mapCity" value={form.mapCity} onChange={handleChange} />
                  <div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    State (recommended for map)
  </label>

  <select
    name="mapState"
    value={form.mapState}
    onChange={handleChange}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  >
    <option value="">Select a state</option>
    {US_STATES.map((state) => (
      <option key={state} value={state}>
        {state}
      </option>
    ))}
  </select>
</div>
                  <Input label="ZIP Code (recommended for map)" name="mapZip" value={form.mapZip} onChange={handleChange} />
                  <Input label="Country (recommended for map)" name="mapCountry" value={form.mapCountry} onChange={handleChange} />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleCenterMap}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                  >
                    Center Map
                  </button>
                </div>

                {mapSearchStatus && (
                  <p className="mt-3 text-sm text-stone-500">
                    {mapSearchStatus}
                  </p>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-stone-900">Location Map</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {form.finalRestingType === "cremated"
                      ? "Use the map to mark where ashes were scattered or placed."
                      : "Use the map to mark the burial location."}
                  </p>

                  <div className="mt-4">
                    <GraveLocationMap
                      lat={form.graveLat ? Number(form.graveLat) : null}
                      lng={form.graveLng ? Number(form.graveLng) : null}
                      onChange={(lat, lng) =>
                        setForm((prev) => ({
                          ...prev,
                          graveLat: String(lat),
                          graveLng: String(lng),
                        }))
                      }
                      readOnly={false}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Input label="Latitude" name="graveLat" value={form.graveLat} onChange={handleChange} />
                  <Input label="Longitude" name="graveLng" value={form.graveLng} onChange={handleChange} />
                </div>

                <div className="mt-6">
                  <TextArea
                    label={form.finalRestingType === "cremated" ? "Location Note" : "Directions Note"}
                    name="graveDirections"
                    value={form.graveDirections}
                    onChange={handleChange}
                    rows={4}
                    placeholder={
                      form.finalRestingType === "cremated"
                        ? "Example: Overlook above the lake near the family cabin."
                        : "Example: Near the large oak tree, third row from the chapel side."
                    }
                  />
                </div>
              </Section>
<Section title="Social Media Links">
  <div className="grid grid-cols-1 gap-6">
    <Input
      label="Social Media Link 1"
      name="socialLink1"
      value={form.socialLink1}
      onChange={handleChange}
    />

    <Input
      label="Social Media Link 2"
      name="socialLink2"
      value={form.socialLink2}
      onChange={handleChange}
    />

    <Input
      label="Social Media Link 3"
      name="socialLink3"
      value={form.socialLink3}
      onChange={handleChange}
    />

    <Input
      label="Social Media Link 4"
      name="socialLink4"
      value={form.socialLink4}
      onChange={handleChange}
    />

    <Input
      label="Social Media Link 5"
      name="socialLink5"
      value={form.socialLink5}
      onChange={handleChange}
    />

    <p className="text-sm text-stone-500">
      Add links to Facebook, Instagram, X/Twitter, TikTok, YouTube, LinkedIn, or other memorial-related social pages.
    </p>
  </div>
</Section>
             <Section title="Places Lived, Places Worked, Schools Attended & Awards Won">
  <div className="grid grid-cols-1 gap-6">
    <div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Places Lived
  </label>

  <textarea
    name="placesLived"
    value={form.placesLived}
    onChange={handleChange}
    rows={5}
    placeholder={`Example:
Lancaster, Pennsylvania
Philadelphia, Pennsylvania
Naples, Florida`}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  />

  <p className="mt-2 text-xs text-stone-500">
    Enter one place per line.
  </p>
</div>
<div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Places Worked
  </label>

  <textarea
    name="placesWorked"
    value={form.placesWorked}
    onChange={handleChange}
    rows={5}
    placeholder={`Example:
Armstrong World Industries
Stum's Repair Service
Hershey Foods Corporation`}
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  />

  <p className="mt-2 text-xs text-stone-500">
    Enter one employer, job, or workplace per line.
  </p>
</div>
    <Input
      label="Schools Attended"
      name="schoolsAttended"
      value={form.schoolsAttended}
      onChange={handleChange}
    />

    <Input
      label="Awards Won"
      name="awardsWon"
      value={form.awardsWon}
      onChange={handleChange}
    />
  </div>
</Section>

              <Section title="Photo Uploads">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-800">
                      Headstone Photo 1
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setHeadstonePhoto1(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-800">
                      Headstone Photo 2
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setHeadstonePhoto2(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-stone-800">
                      Gallery Photos
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
  const files = Array.from(e.target.files ?? []);
  const selectedPlan = form.plan as PlanKey;
  const limit = PLAN_LIMITS[selectedPlan]?.galleryPhotos ?? 50;

  if (Number.isFinite(limit) && files.length > limit) {
    alert(
      `${PLAN_LIMITS[selectedPlan].label} allows up to ${limit} gallery photos. You selected ${files.length}.`
    );
    e.target.value = "";
    setGalleryPhotos([]);
    return;
  }

  setGalleryPhotos(files);
}}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
                    />
<p className="mt-2 text-sm text-stone-600">
  {form.plan === "premium"
    ? `${galleryPhotos.length} gallery photo${galleryPhotos.length === 1 ? "" : "s"} selected. Premium allows unlimited photos.`
    : `${galleryPhotos.length} of ${
        form.plan === "plus" ? 150 : 50
      } gallery photos selected.`}
</p>
                    <p className="mt-2 text-sm text-stone-500">
                      You can select multiple gallery images at once.
                    </p>
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  Photo uploads are not permanently saved until payment is completed. If you leave this page before checkout, uploaded files may need to be selected again.
</div>
                  </div>
                </div>
              </Section>

              <section className="rounded-3xl bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-stone-900">Memorial Videos</h2>

                <p className="mt-2 text-sm text-stone-600">
                  Basic allows 2 videos, Plus allows 5 videos, and Premium allows 10 videos. Each video must be 5 minutes or less.
                </p>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Upload Videos
                  </label>

                  {isPaid ? (
  <input
    type="file"
    accept="video/*"
    multiple
    onChange={handleVideoChange}
    className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700"
  />
) : (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    Please choose a plan and complete payment before uploading videos. Videos selected before payment cannot be permanently saved and may need to be uploaded again after checkout.
  </div>
)}
                </div>

                {videoError && (
                  <p className="mt-3 text-sm text-red-600">{videoError}</p>
                )}
{(() => {
  const limit =
    form.plan === "premium" ? 10 :
    form.plan === "plus" ? 5 : 2;

  const total = videoFiles.length;
  const remaining = Math.max(limit - total, 0);

  return (
    remaining <= 0 && (
      <>
        <p className="mt-3 text-sm text-amber-600">
          You’ve reached your video limit. You can add more videos for $9.95 each.
        </p>

        <p className="mt-3 text-sm text-amber-600">
  Video limits depend on your selected plan. You can add more videos later from the Edit page.
</p>
      </>
    )
  );
})()}
                {videoFiles.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-stone-800">
                      {videoFiles.length} video{videoFiles.length === 1 ? "" : "s"} selected
                    </p>

                    <ul className="mt-3 space-y-2 text-sm text-stone-600">
  {videoFiles.map((file, index) => (
  <li
    key={file.name}
    className="rounded-xl bg-white px-3 py-3"
  >
    <div className="flex items-center justify-between gap-3">
      <span className="break-all">{file.name}</span>

      <button
        type="button"
        onClick={() => {
          setVideoFiles((prev) =>
            prev.filter((item) => item.name !== file.name)
          );

          setVideoNotes((prev) =>
            prev.filter((_, i) => i !== index)
          );
        }}
        className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Remove
      </button>
    </div>

    <input
      type="text"
      placeholder="Video caption or memory..."
      value={videoNotes[index] || ""}
      onChange={(e) => {
        const updated = [...videoNotes];
        updated[index] = e.target.value;
        setVideoNotes(updated);
      }}
      className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
    />
  </li>
))}
</ul>
                  </div>
                )}
              </section>

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
                      <li>✔ Up to 2 videos (up to 5 minutes each)</li>
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
                      <li>✔ Up to 5 videos (up to 5 minutes each)</li>
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
                      <li>✔ Up to 10 videos (up to 5 minutes each)</li>
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