"use client";

import MuxPlayer from "@mux/mux-player-react";
import Link from "next/link";
import { useEffect, useState, ChangeEvent, FormEvent, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import SideAd from "../../../components/SideAd";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const PLAN_PRICES = {
  basic: 9900,
  plus: 12495,
  premium: 14995,
};

const PLAN_LABELS = {
  basic: "Basic",
  plus: "Plus",
  premium: "Premium",
};
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

type MemorialForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  maidenName: string;
  nickname: string;
  birthDate: string;
  deathDate: string;
  greatGrandparentsNames: string;
grandparentsFatherSide: string;
grandparentsMotherSide: string;
parentsNames: string;
siblingsNames: string;
childrenNames: string;
grandchildrenNames: string;
  obituary: string;
  obituaryUrl: string;
  lifeStory: string;
backupPersonName: string;
  finalRestingType: string;
  cemeteryName: string;
  graveSection: string;
  graveRow: string;
  gravePlot: string;
  ashesLocationDescription: string;

  placesLived: string;
  schoolsAttended: string;
  awardsWon: string;
  socialLink1: string;
socialLink2: string;
socialLink3: string;
socialLink4: string;
socialLink5: string;
  favoriteSongUrl: string;
  favoriteSongUrls: string[];
  favoriteSongNotes: string[];
  featuredPhotoUrl: string;
  headstonePhoto1Url: string;
  headstonePhoto2Url: string;
  galleryPhotos: string;
  galleryPhotoNotes: string[];
newspaperArticles: string;
  graveLat: string;
  graveLng: string;
  graveDirections: string;
  mapStreet: string;
  mapCity: string;
  mapState: string;
  mapZip: string;
  mapCountry: string;
  plan: string;
  isLivingPreplan: boolean;
extraVideoSlots: string;
backupEmail: string;
backupPassword: string;

};
type MemorialSubmission = {
  id: number;
  submitter_name: string | null;
  submitter_email: string | null;
  message: string | null;
  photo_urls?: string[] | string | null;
  video_urls?: string[] | string | null;
  status: string;
  created_at: string | null;
};
const emptyForm: MemorialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  maidenName: "",
  nickname: "",
  birthDate: "",
  deathDate: "",
  greatGrandparentsNames: "",
grandparentsFatherSide: "",
grandparentsMotherSide: "",
parentsNames: "",
siblingsNames: "",
childrenNames: "",
grandchildrenNames: "",
  obituary: "",
  obituaryUrl: "",
  lifeStory: "",
backupPersonName: "",
  finalRestingType: "",
  cemeteryName: "",
  graveSection: "",
  graveRow: "",
  gravePlot: "",
  ashesLocationDescription: "",

  placesLived: "",
  schoolsAttended: "",
  awardsWon: "",
  socialLink1: "",
socialLink2: "",
socialLink3: "",
socialLink4: "",
socialLink5: "",
  favoriteSongUrl: "",
  favoriteSongUrls: [],
  favoriteSongNotes: [],
  featuredPhotoUrl: "",
  headstonePhoto1Url: "",
  headstonePhoto2Url: "",
  galleryPhotos: "",
  galleryPhotoNotes: [],
newspaperArticles: "",
  graveLat: "",
  graveLng: "",
  graveDirections: "",
  mapStreet: "",
  mapCity: "",
  mapState: "",
  mapZip: "",
  mapCountry: "USA",
  plan: "basic",
  isLivingPreplan: false,
extraVideoSlots: "0",
backupEmail: "",
  backupPassword: "",
};

function toCommaString(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
}

function makeSlug(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function splitGalleryPhotos(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function EditMemorialPage() {
  const MAX_VIDEO_SIZE_BYTES = 1000 * 1000 * 1000; // 1 GB
  const EXTRA_VIDEO_PRICE = 18.95;
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
const searchParams = useSearchParams();
const returnedExtraVideos = Number(searchParams.get("extra_videos_paid") || 0);


const [form, setForm] = useState<MemorialForm>(emptyForm);

const savedExtraVideos = Number(form.extraVideoSlots || 0);
const paidExtraVideos = savedExtraVideos;
const galleryDragSensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 5,
    },
  })
);
  const isPlanLocked = !!form.plan;
  const [memorialId, setMemorialId] = useState<number | null>(null);
  const [originalSlug, setOriginalSlug] = useState(slug);

  const [favoriteSongFiles, setFavoriteSongFiles] = useState<File[]>([]);
  const [featuredPhotoFile, setFeaturedPhotoFile] = useState<File | null>(null);
  const [headstonePhoto1File, setHeadstonePhoto1File] = useState<File | null>(null);
  const [headstonePhoto2File, setHeadstonePhoto2File] = useState<File | null>(null);
  const [galleryPhotoFiles, setGalleryPhotoFiles] = useState<File[]>([]);
  const [galleryInputResetKey, setGalleryInputResetKey] = useState(0);
  const [newspaperArticleFiles, setNewspaperArticleFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoError, setVideoError] = useState("");
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [videoNotes, setVideoNotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [mapSearchStatus, setMapSearchStatus] = useState("");
const [backupLoginEmail, setBackupLoginEmail] = useState("");
const [backupLoginPassword, setBackupLoginPassword] = useState("");
const [isBackupUnlocked, setIsBackupUnlocked] = useState(false);
const [isOwner, setIsOwner] = useState(false);
const [isPublished, setIsPublished] = useState(false);
const [authChecked, setAuthChecked] = useState(false);
const [backupLoginError, setBackupLoginError] = useState("");
const [submissions, setSubmissions] = useState<MemorialSubmission[]>([]);
const [submissionsMessage, setSubmissionsMessage] = useState("");
const [submissionPhotoViewer, setSubmissionPhotoViewer] = useState<{
  photos: string[];
  index: number;
} | null>(null);
const [adCategoryPair, setAdCategoryPair] = useState<[string, string]>([
  "attorney",
  "estate_planner",
]);

useEffect(() => {
  const pairs: [string, string][] = [
    ["attorney", "cemetery"],
    ["attorney", "estate_planner"],
    ["attorney", "funeral_home"],
    ["attorney", "monument_company"],
    ["cemetery", "estate_planner"],
    ["cemetery", "funeral_home"],
    ["cemetery", "monument_company"],
    ["estate_planner", "funeral_home"],
    ["estate_planner", "monument_company"],
    ["funeral_home", "monument_company"],
  ];

  const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
  setAdCategoryPair(randomPair);
}, []);

const leftAdCategory = adCategoryPair[0];
const rightAdCategory = adCategoryPair[1];
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
async function handleBackupLogin() {
  setBackupLoginError("");

  if (!memorialId) {
    setBackupLoginError("Memorial record is not loaded yet.");
    return;
  }

  try {
    const res = await fetch("/api/backup-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memorialId,
        email: backupLoginEmail,
        password: backupLoginPassword,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setIsBackupUnlocked(false);
      setBackupLoginError(
        result.error || "Backup email or password is incorrect."
      );
      return;
    }

    setIsBackupUnlocked(true);
    setBackupLoginError("");
  } catch (err) {
    console.error(err);
    setIsBackupUnlocked(false);
    setBackupLoginError("Could not verify backup login.");
  }
}
  function handleDispositionChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      finalRestingType: value,
      cemeteryName: value === "cremated" ? "" : prev.cemeteryName,
      graveSection: value === "cremated" ? "" : prev.graveSection,
      graveRow: value === "cremated" ? "" : prev.graveRow,
      gravePlot: value === "cremated" ? "" : prev.gravePlot,
      ashesLocationDescription: value === "buried" ? "" : prev.ashesLocationDescription,
    }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("This device does not support location services.");
      return;
    }

    setLocationStatus("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setForm((prev) => ({
        
          ...prev,
          graveLat: lat.toFixed(6),
          graveLng: lng.toFixed(6),
        }));

        setLocationStatus("Location found. Pin updated.");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Location permission was denied.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationStatus("Your location could not be determined.");
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus("Location request timed out.");
        } else {
          setLocationStatus("Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
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
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Could not read video duration"));
        return;
      }

      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration"));
    };

    video.src = url;
    video.load();
  });
}
  async function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
  setVideoError("");

  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  // 🔒 1. Size check
  const oversizedFile = files.find(
    (file) => file.size > MAX_VIDEO_SIZE_BYTES
  );

  if (oversizedFile) {
    setVideoError(
      `"${oversizedFile.name}" exceeds the upload limit. Videos must be 1 GB or smaller and 10 minutes or less.`
    );
    e.target.value = "";
    return;
  }

  // 🔒 2. Plan limit
  const maxVideos =
    (form.plan === "premium" ? 10 : form.plan === "plus" ? 5 : 2) + paidExtraVideos;

  const existingSelectedNames = new Set(videoFiles.map((file) => file.name));

const newUniqueFiles = files.filter(
  (file) => !existingSelectedNames.has(file.name)
);

const totalVideos =
  [...existingVideos, ...videoFiles.map(v => v.name), ...newUniqueFiles.map(v => v.name)].length;

    if (totalVideos > maxVideos) {
    const extraVideosNeeded = totalVideos - maxVideos;
    const extraVideoTotal = extraVideosNeeded * EXTRA_VIDEO_PRICE;

    setVideoError(
      `This plan includes ${maxVideos} videos. You selected ${totalVideos}. Add ${extraVideosNeeded} extra video${extraVideosNeeded === 1 ? "" : "s"} for $${extraVideoTotal.toFixed(2)}.`
    );

    e.target.value = "";
    return;
  }

  // 🔒 3. Duration check (ADD THIS BACK)
  try {
    for (const file of files) {
      const duration = await getVideoDuration(file);

      if (duration > 600) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60)
          .toString()
          .padStart(2, "0");

        setVideoError(
          `"${file.name}" is ${minutes}:${seconds}. Maximum allowed is 10:00.`
        );
        e.target.value = "";
        return;
      }
    }
  } catch {
    setVideoError("Could not read video length.");
    e.target.value = "";
    return;
  }

  // ✅ Passed all checks
  setVideoFiles((prev) => [...prev, ...newUniqueFiles]);
  e.target.value = "";
}

  

  function handleRemoveExistingVideo(videoIdToRemove: string) {
    setExistingVideos((prev) =>
      prev.filter((videoId) => videoId !== videoIdToRemove)
    );
  }

  useEffect(() => {
    async function loadMemorial() {
      if (!slug) {
        setIsLoading(false);
        setErrorMessage("Missing memorial slug.");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

const {
  data: { user },
} = await supabase.auth.getUser();

if (user && data?.owner_id === user.id) {
  setIsOwner(true);
}

setAuthChecked(true);

      if (error || !data) {
        setErrorMessage("Could not load this memorial.");
        setIsLoading(false);
        return;
      }

      setMemorialId(data.id ?? null);
      if (data.id) {
  loadSubmissions(data.id);
}
      setOriginalSlug(data.slug ?? slug);
      setIsPublished(!!data.is_published);

      setForm({
        firstName: data.first_name ?? "",
        middleName: data.middle_name ?? "",
        lastName: data.last_name ?? "",
        maidenName: data.maiden_name ?? "",
        nickname: data.nickname ?? "",
        birthDate: data.birth_date ?? "",
        deathDate: data.death_date ?? "",
        greatGrandparentsNames: data.great_grandparents_names ?? "",
grandparentsFatherSide: data.grandparents_father_side ?? "",
grandparentsMotherSide: data.grandparents_mother_side ?? "",
parentsNames: data.parents_names ?? "",
siblingsNames: data.siblings_names ?? "",
childrenNames: data.children_names || "",
grandchildrenNames: data.grandchildren_names || "",
        obituary: data.obituary ?? "",
        obituaryUrl: data.obituary_url ?? "",
        lifeStory: data.life_story ?? "",
        backupPersonName: data.backup_person_name ?? "",
        finalRestingType: data.final_resting_type ?? "",
        cemeteryName: data.cemetery_name ?? "",
        graveSection: data.grave_section ?? "",
        graveRow: data.grave_row ?? "",
        gravePlot: data.grave_plot ?? "",
        ashesLocationDescription: data.ashes_location_description ?? "",

        graveLat: data.grave_lat?.toString() ?? "",
        graveLng: data.grave_lng?.toString() ?? "",
        graveDirections: data.grave_directions ?? "",

        placesLived: data.places_lived ?? "",
        schoolsAttended: toCommaString(data.schools_attended),
        awardsWon: toCommaString(data.awards_won),
        socialLink1: data.social_link_1 ?? "",
socialLink2: data.social_link_2 ?? "",
socialLink3: data.social_link_3 ?? "",
socialLink4: data.social_link_4 ?? "",
socialLink5: data.social_link_5 ?? "",
favoriteSongUrl: data.favorite_song_url ?? "",
favoriteSongUrls: data.favorite_song_urls ?? [],
favoriteSongNotes: data.favorite_song_notes ?? [],
featuredPhotoUrl: data.featured_photo_url ?? "",
headstonePhoto1Url: data.headstone_photo_1 ?? "",
headstonePhoto2Url: data.headstone_photo_2 ?? "",
       galleryPhotos: Array.isArray(data.gallery_photos)
  ? data.gallery_photos.join(", ")
  : (data.gallery_photos ?? ""),
galleryPhotoNotes: data.gallery_photo_notes ?? [],
newspaperArticles: data.newspaper_articles ?? "",
      mapStreet: data.map_street ?? "",
      mapCity: data.map_city ?? "",
      mapState: data.map_state ?? "",
      mapZip: data.map_zip ?? "",
      mapCountry: data.map_country ?? "USA",
      plan: data.plan ?? "standard",
    isLivingPreplan: data.is_living_preplan ?? false,  
extraVideoSlots: String(data.extra_video_slots ?? 0),
backupEmail: "",
backupPassword: "",

});

const loadedVideos =
  Array.isArray(data.video_urls)
    ? data.video_urls
        .filter(Boolean)
        .filter((videoId: string) => videoId.length > 15)
    : typeof data.video_urls === "string"
      ? data.video_urls
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
          .filter((videoId: string) => videoId.length > 15)
      : [];

setExistingVideos(loadedVideos);

setVideoNotes(
  Array.isArray(data.video_notes)
    ? data.video_notes
    : []
);

setIsLoading(false);
    }

    loadMemorial();
  }, [slug]);
      

    useEffect(() => {
  if (returnedExtraVideos > 0) {
    window.history.replaceState(
      {},
      "",
      `/memorial/${originalSlug}/edit`
    );

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}, [returnedExtraVideos, originalSlug]);

      

  async function uploadVideos(): Promise<string[]> {
    if (videoFiles.length === 0) return [];

    const playbackIds: string[] = [];

    for (const file of videoFiles) {
      try {
       if (file.size > MAX_VIDEO_SIZE_BYTES) {
  throw new Error(
    `"${file.name}" is too large. Maximum video size is 1 GB.`
  );
} 
        const uploadRes = await fetch("/api/mux-upload", {
          method: "POST",
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error("MUX UPLOAD API ERROR:", errorText);
          throw new Error("Could not create Mux upload URL.");
        }

        const uploadText = await uploadRes.text();
        if (!uploadText) {
          throw new Error("Mux upload API returned empty response.");
        }

        const { uploadUrl, uploadId } = JSON.parse(uploadText);

        const muxRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!muxRes.ok) {
          throw new Error(`Mux upload failed for ${file.name}`);
        }

        let playbackId = "";

        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const playbackRes = await fetch("/api/mux-playback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uploadId }),
          });

          const playbackData = await playbackRes.json();

          if (playbackData.playbackId) {
            playbackId = playbackData.playbackId;
            break;
          }
        }

        if (!playbackId) {
          continue;
        }

        playbackIds.push(playbackId);
      } catch (err) {
        console.error("VIDEO UPLOAD ERROR:", err);
        setVideoError("One or more videos failed to upload.");
      }
    }

    return playbackIds;
  }
async function loadSubmissions(currentMemorialId: number) {
  const { data, error } = await supabase
    .from("memorial_submissions")
    .select("id, submitter_name, submitter_email, message, photo_urls, video_urls, status, created_at")
    .eq("memorial_id", currentMemorialId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("LOAD SUBMISSIONS ERROR:", error);
    return;
  }

  setSubmissions(
  ((data as MemorialSubmission[]) || []).filter(
    (submission) => submission.status === "pending"
  )
);
}

async function handleSubmissionStatus(
  submissionId: number,
  nextStatus: "approved" | "rejected"
) {
  if (!(isOwner || isBackupUnlocked)) {
    setSubmissionsMessage(
      "You do not have permission to review submissions."
    );
    return;
  }

  try {
    setSubmissionsMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSubmissionsMessage("You must be logged in.");
      return;
    }

    const res = await fetch(
      "/api/memorial-submissions/status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          submissionId,
          status: nextStatus,
        }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.error || "Could not update submission."
      );
    }

    setSubmissions((prev) =>
  prev.filter((submission) => submission.id !== submissionId)
);

    setSubmissionsMessage(
      `Submission ${nextStatus}.`
    );
  } catch (err) {
    console.error(err);

    setSubmissionsMessage(
      "There was a problem updating the submission."
    );
  }
}
  
async function uploadFile(file: File, folderName: string, bucketName: string) {
  const safeName = sanitizeFileName(file.name);
  const filePath = `${folderName}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) {
    throw new Error(error.message || "File upload failed.");
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!(isOwner || isBackupUnlocked)) {
    setErrorMessage("You do not have permission to edit this memorial.");
    return;
  }

  if (!memorialId) {
    setErrorMessage("Missing memorial record. Could not save.");
    return;
  }

  const galleryPhotoLimit =
    form.plan === "premium"
      ? Infinity
      : form.plan === "plus"
      ? 150
      : 50;

  const existingGalleryPhotoCount =
    splitGalleryPhotos(form.galleryPhotos).length;

  const newGalleryPhotoCount = galleryPhotoFiles.length;

  const totalGalleryPhotoCount =
    existingGalleryPhotoCount + newGalleryPhotoCount;

  if (
    Number.isFinite(galleryPhotoLimit) &&
    totalGalleryPhotoCount > galleryPhotoLimit
  ) {
    setErrorMessage(
      `${form.plan === "plus" ? "Plus" : "Basic"} Memorial allows up to ${galleryPhotoLimit} gallery photos. This memorial already has ${existingGalleryPhotoCount}, and you selected ${newGalleryPhotoCount}.`
    );
    return;
  }

  setIsSaving(true);
  setErrorMessage("");
  setSuccessMessage("");
  setVideoError("");

    try {
      const newPlaybackIds = await uploadVideos();
      const newSlug = makeSlug(form.firstName, form.lastName) || originalSlug;

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

      let favoriteSongUrl = form.favoriteSongUrl;
      let headstonePhoto1Url = form.headstonePhoto1Url;
      let headstonePhoto2Url = form.headstonePhoto2Url;
      let galleryPhotos = splitGalleryPhotos(form.galleryPhotos);

     let favoriteSongUrls: string[] = [];

if (favoriteSongFiles.length > 0) {
  favoriteSongUrls = await Promise.all(
    favoriteSongFiles.map((file) =>
      uploadFile(file, newSlug, "memorial-audio")
    )
  );
}
let featuredPhotoUrl = form.featuredPhotoUrl;

if (featuredPhotoFile) {
  featuredPhotoUrl = await uploadFile(
    featuredPhotoFile,
    newSlug,
    "memorial-photos"
  );
}
      if (headstonePhoto1File) {
        headstonePhoto1Url = await uploadFile(headstonePhoto1File, newSlug, "memorial-photos");
      }

      if (headstonePhoto2File) {
        headstonePhoto2Url = await uploadFile(headstonePhoto2File, newSlug, "memorial-photos");
      }

      if (galleryPhotoFiles.length > 0) {
        const newGalleryUrls = await Promise.all(
          galleryPhotoFiles.map((file) => uploadFile(file, newSlug, "memorial-photos"))
        );
        galleryPhotos = [...galleryPhotos, ...newGalleryUrls];
      }
let newspaperArticles = splitGalleryPhotos(form.newspaperArticles);

if (newspaperArticleFiles.length > 0) {
  const newArticleUrls = await Promise.all(
    newspaperArticleFiles.map((file) =>
      uploadFile(file, newSlug, "memorial-articles")
    )
  );

  newspaperArticles = [...newspaperArticles, ...newArticleUrls];
}
      const updatePayload = {
        slug: newSlug,
        full_name: fullName,
        first_name: form.firstName,
        middle_name: form.middleName,
        last_name: form.lastName,
        maiden_name: form.maidenName,
        nickname: form.nickname,
        birth_date: form.birthDate || null,
        death_date: form.deathDate || null,
        great_grandparents_names: form.greatGrandparentsNames,
grandparents_father_side: form.grandparentsFatherSide,
grandparents_mother_side: form.grandparentsMotherSide,
parents_names: form.parentsNames,
siblings_names: form.siblingsNames,
children_names: form.childrenNames,
grandchildren_names: form.grandchildrenNames,
        obituary: form.obituary,
        obituary_url: form.obituaryUrl,
        life_story: form.lifeStory,
backup_person_name: form.backupPersonName,
        final_resting_type: form.finalRestingType || null,
        cemetery_name: form.finalRestingType === "buried" ? form.cemeteryName : "",
        grave_section: form.finalRestingType === "buried" ? form.graveSection : "",
        grave_row: form.finalRestingType === "buried" ? form.graveRow : "",
        grave_plot: form.finalRestingType === "buried" ? form.gravePlot : "",
        ashes_location_description:
          form.finalRestingType === "cremated" ? form.ashesLocationDescription : "",

        grave_lat: form.graveLat ? Number(form.graveLat) : null,
        grave_lng: form.graveLng ? Number(form.graveLng) : null,
        grave_directions: form.graveDirections,
map_street: form.mapStreet,
map_city: form.mapCity,
map_state: form.mapState,
map_zip: form.mapZip,
map_country: form.mapCountry,
                places_lived: form.placesLived,
        schools_attended: form.schoolsAttended,
        awards_won: form.awardsWon,
        social_link_1: form.socialLink1,
social_link_2: form.socialLink2,
social_link_3: form.socialLink3,
social_link_4: form.socialLink4,
social_link_5: form.socialLink5,
        favorite_song_url:
  [
    ...(form.favoriteSongUrls?.length > 0
      ? form.favoriteSongUrls
      : form.favoriteSongUrl
        ? [form.favoriteSongUrl]
        : []),
    ...favoriteSongUrls,
  ].filter(Boolean)[0] ?? "",

favorite_song_urls: [
  ...(form.favoriteSongUrls?.length > 0
    ? form.favoriteSongUrls
    : form.favoriteSongUrl
      ? [form.favoriteSongUrl]
      : []),
  ...favoriteSongUrls,
].filter(Boolean).slice(0, 5),
favorite_song_notes: form.favoriteSongNotes ?? [],
featured_photo_url: featuredPhotoUrl,
        headstone_photo_1: headstonePhoto1Url,
        headstone_photo_2: headstonePhoto2Url,
        gallery_photos: galleryPhotos.join(","),
        gallery_photo_notes: form.galleryPhotoNotes ?? [],
        newspaper_articles: newspaperArticles.join(","),
        video_urls: [...existingVideos, ...newPlaybackIds],
video_notes: videoNotes,
backup_email: form.backupEmail,
backup_password: form.backupPassword,
      };

      const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.access_token) {
  setErrorMessage("You must be logged in to save this memorial.");
  return;
}

const res = await fetch("/api/memorials/update", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    memorialId,
    updatePayload,
  }),
});

const result = await res.json();

if (!res.ok) {
  console.error("MEMORIAL UPDATE API ERROR:", result);
  setErrorMessage(result.error || "Could not save memorial.");
  return;
}

      setForm((prev) => {
  const savedSongs = [
    ...(prev.favoriteSongUrls?.length > 0
      ? prev.favoriteSongUrls
      : prev.favoriteSongUrl
        ? [prev.favoriteSongUrl]
        : []),
    ...favoriteSongUrls,
  ]
    .filter(Boolean)
    .slice(0, 5);

  
  return {
    ...prev,
    favoriteSongUrl: savedSongs[0] ?? "",
    favoriteSongUrls: savedSongs,
  headstonePhoto1Url,
        headstonePhoto2Url,
        galleryPhotos: galleryPhotos.join(","),
  };
});

      setExistingVideos([...existingVideos, ...newPlaybackIds]);
      setFavoriteSongFiles([]);
      setHeadstonePhoto1File(null);
      setHeadstonePhoto2File(null);
      setGalleryPhotoFiles([]);
      setGalleryInputResetKey((prev) => prev + 1);
      setNewspaperArticleFiles([]);
      setVideoFiles([]);

      setSuccessMessage(
  videoFiles.length > 0
    ? `Memorial updated successfully. ${videoFiles.length} video${videoFiles.length === 1 ? "" : "s"} uploaded. Please wait while photos and videos finish uploading and processing before making additional changes or leaving this page.`
    : "Memorial updated successfully."
);
    

      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      setErrorMessage(`Could not save changes: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }
async function handleBuyExtraVideos(extraCount: number, submissionId?: number) {
  if (!(isOwner || isBackupUnlocked)) {
    alert("You do not have permission to purchase extra videos for this memorial.");
    return;
  }

  if (!memorialId) {
    alert("Missing memorial record. Could not start checkout.");
    return;
  }

  try {
    const amount = Math.round(extraCount * EXTRA_VIDEO_PRICE * 100);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: "extra_videos",
        amount,
        quantity: extraCount,
        memorialId,
        submissionId: submissionId ?? "",
        returnUrl: `${window.location.origin}/memorial/${originalSlug}/edit?extra_videos_paid=${extraCount}${submissionId ? `&approve_submission=${submissionId}` : ""}`,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Could not start checkout.");
    }
  } catch (err) {
    console.error(err);
    alert("Error starting checkout.");
  }
}
async function handleUpgradePlan(toPlan: "plus" | "premium") {
  if (!(isOwner || isBackupUnlocked)) {
    alert("You do not have permission to upgrade this memorial.");
    return;
  }

  if (!memorialId) {
    alert("Missing memorial record. Could not start upgrade checkout.");
    return;
  }

  const currentPlan = form.plan as keyof typeof PLAN_PRICES;
  const currentPrice = PLAN_PRICES[currentPlan] || PLAN_PRICES.basic;
  const newPrice = PLAN_PRICES[toPlan];
  const upgradeAmount = newPrice - currentPrice;

  if (upgradeAmount <= 0) {
    alert("This memorial is already on this plan or a higher plan.");
    return;
  }

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: toPlan,
        amount: upgradeAmount,
        memorialId,
        checkoutType: "upgrade",
        fromPlan: currentPlan,
        toPlan,
        returnUrl: `${window.location.origin}/memorial/${originalSlug}/edit?upgrade_success=true`,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Could not start upgrade checkout.");
    }
  } catch (err) {
    console.error(err);
    alert("Error starting upgrade checkout.");
  }
}
  const displayName =
    `${form.firstName} ${form.lastName}`.trim() || "Unnamed Memorial";

 return (
  <main className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-stone-100 px-4 py-8 md:px-6 md:py-10 lg:px-8">
  <div className="mx-auto mb-6 w-full max-w-[1500px] px-4">
    <Link
      href="/my-memorials"
      className="inline-flex w-fit rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
    >
      ← Back to My Memorials
    </Link>
  </div>

  <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-8 px-4 lg:grid-cols-[180px_minmax(0,900px)_180px] lg:justify-center">
      <div className="lg:-translate-x-6">
  <SideAd
    pageType="edit"
    memorialZip={form.mapZip}
    categorySlot={leftAdCategory}
  />
</div>

    <div className="mx-auto w-full max-w-[900px] space-y-8">
        {authChecked && !(isOwner || isBackupUnlocked) ? (
  <section className="rounded-[2rem] border border-stone-200/80 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
    <h1 className="text-3xl font-bold text-stone-900">
  {form.isLivingPreplan ? "Backup Person Login" : "Log In Required"}
</h1>

    <p className="mt-3 text-stone-600">
      {form.isLivingPreplan
  ? "This memorial is locked. Enter the backup person email and password to continue."
  : "Please log in with the memorial owner account to review contributions or edit this memorial."}
    </p>

    {!form.isLivingPreplan && (
  <Link
    href={`/login?mode=login&redirect=${encodeURIComponent(`/memorial/${originalSlug}/edit`)}`}
    className="mt-5 inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
  >
    Log In
  </Link>
)}

{form.isLivingPreplan && (
  <>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-800">
          Backup Email
        </label>
        <input
          type="email"
          value={backupLoginEmail}
          onChange={(e) => setBackupLoginEmail(e.target.value)}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-800">
          Backup Password
        </label>
        <input
          type="password"
          value={backupLoginPassword}
          onChange={(e) => setBackupLoginPassword(e.target.value)}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"
        />
      </div>
    </div>

    <button
      type="button"
      onClick={handleBackupLogin}
      className="mt-5 inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
    >
      Unlock Memorial
    </button>
  </>
)}

{backupLoginError && (
  <p className="mt-3 text-sm font-semibold text-red-600">
    {backupLoginError}
  </p>
)}
  </section>
) : isLoading ? (
          <section className="rounded-[2rem] border border-stone-200/80 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-32 rounded bg-stone-200" />
              <div className="h-10 w-64 rounded bg-stone-200" />
              <div className="h-4 w-full rounded bg-stone-100" />
              <div className="h-4 w-5/6 rounded bg-stone-100" />
            </div>
          </section>
        ) : (
          <>
            <section
              className="relative overflow-hidden rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
              style={{
                backgroundImage: "url('/gravestone1.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/60" />

              <div className="relative z-10 px-8 py-10 text-white md:px-10 md:py-12">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-200">
                      Edit Memorial
                    </p>

                    <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                      {displayName}
                    </h1>

                    <p className="mt-4 max-w-2xl leading-7 text-stone-200">
                      Update the memorial details, song, photos, videos, and final resting place below.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/memorial/${makeSlug(form.firstName, form.lastName) || originalSlug}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20"
                    >
                      Back to Memorial
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="p-8 md:p-10 lg:p-12">
                {errorMessage && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <form id="edit-memorial-form" onSubmit={handleSubmit} className="space-y-8">
                  
                  <FormSection
  
  title="Plan"
  description="View the current plan or upgrade this memorial."
>
  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
    <p className="text-sm text-stone-600">Current Plan</p>
    <p className="text-lg font-semibold text-stone-900 capitalize">
      {form.plan}
    </p>

    {form.plan === "basic" && (
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleUpgradePlan("plus")}
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
        >
          Upgrade to Plus — $25.95
        </button>

        <button
          type="button"
          onClick={() => handleUpgradePlan("premium")}
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
        >
          Upgrade to Premium — $50.95
        </button>
      </div>
    )}

    {form.plan === "plus" && (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => handleUpgradePlan("premium")}
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
        >
          Upgrade to Premium — $25.00
        </button>
      </div>
    )}

    {form.plan === "premium" && (
      <p className="mt-3 text-sm text-green-700">
        This memorial already has the highest plan.
      </p>
    )}
  </div>
</FormSection>
<FormSection
  title="Visitor Contributions"
  description="Review memories, stories, corrections, or information submitted by visitors."
>
  {submissionsMessage && (
    <div className="mb-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
      {submissionsMessage}
    </div>
  )}

  {submissions.length === 0 ? (
    <p className="text-sm text-stone-500">
      No visitor contributions have been submitted yet.
    </p>
  ) : (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="rounded-2xl border border-stone-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">
                {submission.submitter_name || "Anonymous visitor"}
              </p>

              {submission.submitter_email && (
                <p className="text-xs text-stone-500">
                  {submission.submitter_email}
                </p>
              )}

              <p className="mt-1 text-xs text-stone-500">
                Status: {submission.status}
              </p>
            </div>

            {submission.created_at && (
              <p className="text-xs text-stone-400">
                {new Date(submission.created_at).toLocaleString()}
              </p>
            )}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-stone-700">
            {submission.message}
          </p>
{(() => {
  if (submission.status !== "pending") return null;

  let submittedPhotos: string[] = [];

  if (Array.isArray(submission.photo_urls)) {
    submittedPhotos = submission.photo_urls;
  } else if (typeof submission.photo_urls === "string") {
    try {
      submittedPhotos = JSON.parse(submission.photo_urls);
    } catch {
      submittedPhotos = [];
    }
  }

  submittedPhotos = submittedPhotos.filter(Boolean);

  if (submittedPhotos.length === 0) return null;

  return (
  <div className="mt-4">
    <p className="mb-3 text-sm font-semibold text-stone-800">
      Submitted Photos
    </p>

    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {submittedPhotos.map((photoUrl, index) => (
        <button
  key={`${photoUrl}-${index}`}
  type="button"
  onClick={() =>
    setSubmissionPhotoViewer({
      photos: submittedPhotos,
      index,
    })
  }
  className="block overflow-hidden rounded-xl border border-stone-200 bg-stone-50 text-left"
>
  <img
    src={photoUrl}
    alt={`Submitted photo ${index + 1}`}
    className="h-20 w-full object-cover transition hover:scale-105"
  />
</button>
      ))}
    </div>
  </div>
);
})()}
{(() => {
  let submittedVideos: string[] = [];

  if (Array.isArray(submission.video_urls)) {
    submittedVideos = submission.video_urls;
  } else if (typeof submission.video_urls === "string") {
    try {
      submittedVideos = JSON.parse(submission.video_urls);
    } catch {
      submittedVideos = submission.video_urls
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  submittedVideos = submittedVideos
  .filter(Boolean)
  .filter((videoId) => videoId.length > 15);

  if (submittedVideos.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {submittedVideos.map((playbackId, index) => (
        <div
          key={`${playbackId}-${index}`}
          className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-4"
        >
          <p className="mb-3 text-sm font-semibold text-stone-800">
            Submitted Video {index + 1}
          </p>

          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            className="aspect-video w-full rounded-xl bg-black"
          />
        </div>
      ))}
    </div>
  );
})()}
          {submission.status === "pending" && (() => {
  const baseLimit =
    form.plan === "premium"
      ? 10
      : form.plan === "plus"
      ? 5
      : 2;

  const effectiveLimit =
    baseLimit + Number(form.extraVideoSlots || 0);

  const submissionVideos = (() => {
    if (Array.isArray(submission.video_urls)) {
      return submission.video_urls.filter(Boolean);
    }

    if (typeof submission.video_urls === "string") {
      try {
        return JSON.parse(submission.video_urls).filter(Boolean);
      } catch {
        return submission.video_urls
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  })();

  const contributorVideoCount = submissionVideos.length;

  const approvedContributorVideoCount = submissions
  .filter(
    (s) =>
      s.status === "approved" &&
      s.id !== submission.id
  )
  .reduce((total, approvedSubmission) => {
    let approvedVideos: string[] = [];

    if (Array.isArray(approvedSubmission.video_urls)) {
      approvedVideos =
        approvedSubmission.video_urls.filter(Boolean);
    } else if (
      typeof approvedSubmission.video_urls === "string"
    ) {
      try {
        approvedVideos = JSON.parse(
          approvedSubmission.video_urls
        ).filter(Boolean);
      } catch {
        approvedVideos =
          approvedSubmission.video_urls
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
      }
    }

    return total + approvedVideos.length;
  }, 0);

const currentVideoCount =
  existingVideos.length +
  approvedContributorVideoCount;

const projectedTotal =
  currentVideoCount + contributorVideoCount;

  const needsExtraVideoPurchase =
    projectedTotal > effectiveLimit;

  return (
    <div className="mt-4 flex flex-wrap gap-2">

      {!needsExtraVideoPurchase ? (
        <button
          type="button"
          onClick={() =>
            handleSubmissionStatus(
              submission.id,
              "approved"
            )
          }
          className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
        >
          Approve
        </button>
      ) : (
        <button
          type="button"
          onClick={() =>
  handleBuyExtraVideos(
    projectedTotal - effectiveLimit,
    submission.id
  )
}
          className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-900 hover:bg-amber-400"
        >
          Approve With Extra Video — $18.95
        </button>
      )}

      <button
        type="button"
        onClick={() =>
          handleSubmissionStatus(
            submission.id,
            "rejected"
          )
        }
        className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Reject
      </button>
    </div>
  );
})()}
        </div>
      ))}
    </div>
  )}
</FormSection>
{form.isLivingPreplan && (
<FormSection
  title="Backup Person"
  description="Assign a trusted person who can manage and publish this memorial."
>
  <div className="grid gap-5 md:grid-cols-2">
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
    />

    <Input
      label="Backup Password"
      name="backupPassword"
      value={form.backupPassword}
      onChange={handleChange}
    />
  </div>

  <p className="mt-3 text-sm text-stone-500">
    This person will be able to edit and publish this memorial if needed.
  </p>
  <QuickSaveButton isSaving={isSaving} />
</FormSection>
)}
<CompactFormSection
  title={form.firstName ? `${form.firstName}'s Favorite Songs` : "Favorite Songs"}
  description="Add up to 5 favorite songs and a short note about each one.  Tip: Record song on phone using Quickvoice or similar app and upload that file."
>
                    <div className="space-y-3">
                      <Input
                        label="Favorite Song URL"
                        name="favoriteSongUrl"
                        value={form.favoriteSongUrl}
                        onChange={handleChange}
                      />

                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">
                          Upload Music File
                        </label>
<p className="mb-2 text-xs text-stone-500">
  Upload MP3, M4A, AAC, or WAV audio files. Most phone recordings are supported.
</p>
                        {(form.favoriteSongUrls?.length > 0 || form.favoriteSongUrl) && (
  <div className="mb-4 space-y-3">
    {(form.favoriteSongUrls?.length > 0
      ? form.favoriteSongUrls
      : [form.favoriteSongUrl]
    ).map((song, index) => (
      <div
        key={`${song}-${index}`}
        className="rounded-xl border border-stone-200 bg-white p-2"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
            Song {index + 1}
          </p>

          <button
            type="button"
           onClick={() => {
  setForm((prev) => {
    const currentSongs =
      prev.favoriteSongUrls?.length > 0
        ? prev.favoriteSongUrls
        : prev.favoriteSongUrl
          ? [prev.favoriteSongUrl]
          : [];

    const nextSongs = currentSongs.filter((_, i) => i !== index);

    const nextNotes = (prev.favoriteSongNotes ?? []).filter(
      (_, i) => i !== index
    );

    return {
      ...prev,
      favoriteSongUrl: nextSongs[0] ?? "",
      favoriteSongUrls: nextSongs,
      favoriteSongNotes: nextNotes,
    };
  });
}}
            className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
          >
            Delete Song
          </button>
        </div>

        <audio controls className="w-full">
          <source src={song} />
          Your browser does not support the audio element.
        </audio>
        <p className="mt-3 text-sm font-semibold text-stone-700">
  Song Note
</p>
        <textarea
  value={form.favoriteSongNotes?.[index] ?? ""}
  onChange={(e) => {
    const value = e.target.value;

    setForm((prev) => {
      const nextNotes = [...(prev.favoriteSongNotes ?? [])];
      nextNotes[index] = value;

      return {
        ...prev,
        favoriteSongNotes: nextNotes,
      };
    });
  }}
  rows={2}
  placeholder="What was special about this song?"
 className="mt-2 block w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-stone-900"
/>
      </div>
    ))}
  </div>
)}

                       <input
  type="file"
  accept=".mp3,.m4a,.aac,.wav,audio/*"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setFavoriteSongFiles(files);
  }}
  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
/>

<p className="mt-2 text-xs text-stone-500">
  <Link
    href="/how-to-add-music"
    target="_blank"
    className="font-semibold text-stone-700 underline hover:text-stone-900"
  >
    Need help recording music from your phone?
  </Link>
</p>
                        
                      </div>
                    </div>

                    <QuickSaveButton isSaving={isSaving} />
                  </CompactFormSection>

                  

   
<FormSection
  title="Basic Information"
  description="Core details about this person."
>
  <div className="space-y-5">

    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <label className="block text-sm font-semibold text-stone-800">
        Featured Memorial Photo
      </label>

      <p className="mt-1 text-xs text-stone-500">
        This photo will appear at the top of the public memorial page.
      </p>

      {form.featuredPhotoUrl && (
        <img
          src={form.featuredPhotoUrl}
          alt="Featured memorial photo"
          className="mt-4 h-48 w-48 rounded-3xl object-cover shadow-sm"
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFeaturedPhotoFile(e.target.files?.[0] ?? null)
        }
        className="mt-4 w-full rounded-2xl border bg-white px-4 py-3"
      />
    </div>

    <div className="grid gap-5 md:grid-cols-2">

      <Input
        label="First Name"
        name="firstName"
        value={form.firstName}
        onChange={handleChange}
      />

      <Input
        label="Middle Name"
        name="middleName"
        value={form.middleName}
        onChange={handleChange}
      />

      <Input
        label="Last Name"
        name="lastName"
        value={form.lastName}
        onChange={handleChange}
      />

      <Input
        label="Maiden Name"
        name="maidenName"
        value={form.maidenName}
        onChange={handleChange}
      />

      <Input
        label="Nickname"
        name="nickname"
        value={form.nickname}
        onChange={handleChange}
      />

      <Input
        label="Birth Date"
        name="birthDate"
        type="date"
        value={form.birthDate}
        onChange={handleChange}
      />

      <Input
        label="Death Date"
        name="deathDate"
        type="date"
        value={form.deathDate}
        onChange={handleChange}
      />

    </div>
  </div>

  <QuickSaveButton isSaving={isSaving} />
</FormSection>
                    
<FormSection
  title="Places Lived"
  description="Cities, states, and countries associated with this person."
>
  
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
  <QuickSaveButton isSaving={isSaving} />
</FormSection>
                  <FormSection
                    title="Schools and Awards"
                    description="Separate multiple items with commas."
                  >
                    <div className="space-y-5">
                      <TextArea
                        label="Schools Attended"
                        name="schoolsAttended"
                        value={form.schoolsAttended}
                        onChange={handleChange}
                        rows={3}
                        helpText="Example: Lancaster Catholic, Penn State, Temple University"
                      />
                      <TextArea
                        label="Awards Won"
                        name="awardsWon"
                        value={form.awardsWon}
                        onChange={handleChange}
                        rows={3}
                        helpText="Example: Purple Heart, Eagle Scout, Teacher of the Year"
                      />
                    </div>
                    <QuickSaveButton isSaving={isSaving} />
                  </FormSection>
                  <FormSection
  title="Social Media Links"
  description="Add up to 5 social media pages for this memorial."
>
  <div className="space-y-5">
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
  </div>
  <QuickSaveButton isSaving={isSaving} />
</FormSection>
                <FormSection
  title="Life Story"
  description="Tell the story of their life."
>
  <TextArea
    label="Life Story"
    name="lifeStory"
    value={form.lifeStory}
    onChange={handleChange}
    rows={8}
  />
  <QuickSaveButton isSaving={isSaving} />
</FormSection>
<FormSection
  title="Family History"
  description="Add family names for future generations and genealogy research."
>
  <div className="space-y-5">
    <TextArea
      label="Great Grandparents Names"
      name="greatGrandparentsNames"
      value={form.greatGrandparentsNames}
      onChange={handleChange}
      rows={3}
    />

    <TextArea
      label="Grandparents Names — Father’s Side"
      name="grandparentsFatherSide"
      value={form.grandparentsFatherSide}
      onChange={handleChange}
      rows={3}
    />

    <TextArea
      label="Grandparents Names — Mother’s Side"
      name="grandparentsMotherSide"
      value={form.grandparentsMotherSide}
      onChange={handleChange}
      rows={3}
    />

    <TextArea
      label="Parents Names"
      name="parentsNames"
      value={form.parentsNames}
      onChange={handleChange}
      rows={3}
    />

    <TextArea
      label="Parent's Siblings Names"
      name="siblingsNames"
      value={form.siblingsNames}
      onChange={handleChange}
      rows={3}
      placeholder={`Mother's siblings:\nFather's siblings:`}
    />
    <TextArea
  label="Parent's Children's Names"
  name="childrenNames"
  value={form.childrenNames}
  onChange={handleChange}
  rows={3}
/>

<TextArea
  label="Grandchildren"
  name="grandchildrenNames"
  value={form.grandchildrenNames}
  onChange={handleChange}
  rows={3}
/>
    
  

  </div>
  <QuickSaveButton isSaving={isSaving} />
</FormSection>
                  
<FormSection
  title="Gallery Photos"
  description="Photos from life, family, and memories."
>
  <input
    type="hidden"
    name="galleryPhotos"
    value={form.galleryPhotos}
    onChange={handleChange}
  />

  {splitGalleryPhotos(form.galleryPhotos).length > 0 ? (
  <DndContext
    sensors={galleryDragSensors}
    collisionDetection={closestCenter}
    onDragEnd={(event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const photos = splitGalleryPhotos(form.galleryPhotos);

      const oldIndex = photos.findIndex(
        (_, index) => `gallery-${index}` === active.id
      );

      const newIndex = photos.findIndex(
        (_, index) => `gallery-${index}` === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedPhotos = arrayMove(photos, oldIndex, newIndex);

      const reorderedNotes = arrayMove(
        form.galleryPhotoNotes ?? [],
        oldIndex,
        newIndex
      );

      setForm((prev) => ({
        ...prev,
        galleryPhotos: reorderedPhotos.join(","),
        galleryPhotoNotes: reorderedNotes,
      }));
    }}
  >
    <SortableContext
      items={splitGalleryPhotos(form.galleryPhotos).map(
        (_, index) => `gallery-${index}`
      )}
      strategy={rectSortingStrategy}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {splitGalleryPhotos(form.galleryPhotos).map((photo, index) => (
          <SortableGalleryPhotoCard
            key={`gallery-${index}`}
            id={`gallery-${index}`}
            photo={photo}
            index={index}
            note={form.galleryPhotoNotes?.[index] ?? ""}
            onNoteChange={(photoIndex, value) => {
              setForm((prev) => {
                const nextNotes = [...(prev.galleryPhotoNotes ?? [])];
                nextNotes[photoIndex] = value;

                return {
                  ...prev,
                  galleryPhotoNotes: nextNotes,
                };
              });
            }}
          />
        ))}
      </div>
    </SortableContext>
  </DndContext>
) : (
  <p className="text-sm text-stone-500">
    No gallery photos uploaded yet.
  </p>
)}

  <div className="mt-4">
    <label className="text-sm font-medium text-stone-700">
      Upload Gallery Photos
    </label>
    <input
  key={`gallery-upload-${galleryInputResetKey}`}
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files ?? []);

    const galleryPhotoLimit =
      form.plan === "premium"
        ? Infinity
        : form.plan === "plus"
        ? 150
        : 50;

    const existingGalleryPhotoCount =
      splitGalleryPhotos(form.galleryPhotos).length;

    const totalGalleryPhotoCount =
      existingGalleryPhotoCount + files.length;

    if (
      Number.isFinite(galleryPhotoLimit) &&
      totalGalleryPhotoCount > galleryPhotoLimit
    ) {
      alert(
        `${form.plan === "plus" ? "Plus" : "Basic"} Memorial allows up to ${galleryPhotoLimit} gallery photos. This memorial already has ${existingGalleryPhotoCount}, and you selected ${files.length}.`
      );

      e.target.value = "";
      setGalleryPhotoFiles([]);
      return;
    }

    setGalleryPhotoFiles(files);
  }}
  className="w-full rounded-2xl border border-stone-300 px-4 py-3"
/>

<p className="mt-2 text-sm text-stone-600">
  {form.plan === "premium"
    ? `${splitGalleryPhotos(form.galleryPhotos).length + galleryPhotoFiles.length} gallery photo${
        splitGalleryPhotos(form.galleryPhotos).length + galleryPhotoFiles.length === 1 ? "" : "s"
      } used. Premium allows unlimited photos.`
    : `${splitGalleryPhotos(form.galleryPhotos).length + galleryPhotoFiles.length} of ${
        form.plan === "plus" ? 150 : 50
      } gallery photos used.`}
</p>
    </div>

  <QuickSaveButton isSaving={isSaving} />
</FormSection>

<FormSection
  title="Newspaper Articles"
  description="Upload obituary clippings, newspaper articles, announcements, or other public records."
>
  <input
    type="hidden"
    name="newspaperArticles"
    value={form.newspaperArticles}
    onChange={handleChange}
  />

  {splitGalleryPhotos(form.newspaperArticles).length > 0 ? (
    <div className="space-y-3">
      {splitGalleryPhotos(form.newspaperArticles).map((article, index) => (
        <a
          key={`${article}-${index}`}
          href={article}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
        >
          View Newspaper Article {index + 1}
        </a>
      ))}
    </div>
  ) : (
    <p className="text-sm text-stone-500">
      No newspaper articles uploaded yet.
    </p>
  )}

  <div className="mt-4">
    <label className="text-sm font-medium text-stone-700">
      Upload Newspaper Articles
    </label>
    <input
      type="file"
      accept="image/*,.pdf"
      multiple
      onChange={(e) =>
        setNewspaperArticleFiles(Array.from(e.target.files ?? []))
      }
      className="w-full rounded-2xl border border-stone-300 px-4 py-3"
    />
    <p className="mt-2 text-sm text-stone-500">
      PDF or image files are supported.
    </p>
  </div>

  <QuickSaveButton isSaving={isSaving} />
</FormSection>

      <FormSection
                    title="Memorial Videos"
                    description="Upload memorial videos to be shown on the memorial page."
                  >
                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">
                          Upload Videos
                        </label>

                        <p className="mb-3 text-sm text-stone-600">
                          Leave a message, tell a life story, or share memories for loved ones and future generations.
                        </p>
                        <p className="mt-2 text-xs text-stone-500">
  After selecting a video, clicking "Save Changes" will upload it.
</p>

                        <input
  
  key={videoFiles.length}
  type="file"
  accept="video/*"
  multiple
  disabled={false}
  onChange={handleVideoChange}
  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
/>
{videoFiles.length > 0 && (
  <p className="mt-2 text-sm font-medium text-green-700">
    {videoFiles.length} video
    {videoFiles.length === 1 ? "" : "s"} selected and ready to upload.
  </p>
)}
{existingVideos.length >=
  ((form.plan === "premium" ? 10 : 
    form.plan === "plus" ? 5 : 2) + paidExtraVideos) && (
  <div className="mt-3 flex items-center justify-between rounded-xl border border-stone-300 bg-stone-50 p-4">
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200">
      🎥
    </div>
    <div>
      <p className="text-sm font-semibold text-stone-800">
        Need more video space?
      </p>
      <p className="text-xs text-stone-600">
        Add extra videos anytime for $18.95 each.
      </p>
    </div>
  </div>

  
</div>
    )}
{/* 🔒 Max reached message */}
{existingVideos.length >=
  ((form.plan === "premium" ? 10 : 
    form.plan === "plus" ? 5 : 2) + paidExtraVideos) && (
  <p className="mt-2 text-sm text-amber-600">
 You’ve reached your current video limit. Save your memorial first. After saving, you may purchase additional video slots and then upload more videos.
  </p>
)}
{existingVideos.length > 0 &&
  existingVideos.length >=
  ((form.plan === "premium" ? 10 : 
    form.plan === "plus" ? 5 : 2) + paidExtraVideos) && (
  <div className="mt-3 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => handleBuyExtraVideos(1)}
      className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-400"
    >
      Buy 1 — $18.95
    </button>

    <button
      type="button"
      onClick={() => handleBuyExtraVideos(3)}
      className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-400"
    >
      Buy 3 — $56.85
    </button>

    <button
      type="button"
      onClick={() => handleBuyExtraVideos(5)}
      className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-400"
    >
      Buy 5 — $94.75
    </button>
  </div>
)}
{/* 🔴 Error message */}
{/* 🔴 Error / extra video message */}
{videoError && (
  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
    <p className="text-sm text-red-700">{videoError}</p>

    
  </div>
)}
                        <div className="mt-2 text-sm text-stone-600">
  {(() => {
    const limit =
      (form.plan === "premium" ? 10 : form.plan === "plus" ? 5 : 2) +
      paidExtraVideos;

    const current = existingVideos.length;
    const selected = videoFiles.length;
    const total = current + selected;
    const remaining = Math.max(limit - total, 0);

    return (
      <div>
        <div
          className={`mt-2 text-sm ${
            total > limit ? "text-red-600" : "text-stone-600"
          }`}
        >
          Videos: {current}
          {selected > 0 && ` + ${selected} selected`}
          {" = "}
          {total} / {limit}
        </div>

        {paidExtraVideos > 0 && (
          <p className="mt-1 text-sm text-green-700">
            You have purchased {paidExtraVideos} extra video slot{paidExtraVideos === 1 ? "" : "s"}.
          </p>
        )}
      </div>
    );
  })()}
</div>
    {/* existing content ABOVE stays */}

   

   

                        <p className="mt-1 text-sm text-stone-500">
                          MP4 recommended. Basic allows 2 videos, Plus allows 5, and Premium allows 10. Extra videos are $18.95 each.
                        </p>

                        {videoError && (
                          <p className="mt-2 text-sm text-red-600">{videoError}</p>
                        )}
                      </div>

                      {existingVideos.length > 0 && (
  <div className="mt-6 grid gap-6 md:grid-cols-2">
    {existingVideos
  .filter(Boolean)
  .filter((videoId) => videoId.length > 15)
  .map((videoId, index) => (
      <div
        key={`${videoId}-${index}`}
        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-stone-800">
            Video {index + 1}
          </p>

          <button
            type="button"
            onClick={() => handleRemoveExistingVideo(videoId)}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete Video
          </button>
        </div>

        {previewVideoId === videoId ? (
          <MuxPlayer
            playbackId={videoId}
            streamType="on-demand"
            className="aspect-video w-full rounded-xl bg-black"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPreviewVideoId(videoId)}
            className="flex aspect-video w-full items-center justify-center rounded-xl bg-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-300"
          >
            Preview Video
          </button>
        )}
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
        <p className="mt-2 text-xs text-stone-500">
          Preview only loads when clicked to keep this edit page fast.
        </p>
      </div>
    ))}
  </div>
)}
                            
                    </div>

                    <QuickSaveButton isSaving={isSaving} />
                  </FormSection>   

                  <FormSection
  title="Obituary"
  description="Traditional obituary or link to full obituary."
>
  <TextArea
    label="Obituary"
    name="obituary"
    value={form.obituary}
    onChange={handleChange}
    rows={6}
  />

  <Input
    label="Obituary Link"
    name="obituaryUrl"
    value={form.obituaryUrl}
    onChange={handleChange}
  />
  <QuickSaveButton isSaving={isSaving} />
      </FormSection>       
       <FormSection
  title="Headstone Photos"
  description="Photos of the headstone or grave marker."
>
  <div className="space-y-5">

    <Input
      label="Headstone Photo 1 URL"
      name="headstonePhoto1Url"
      value={form.headstonePhoto1Url}
      onChange={handleChange}
    />

    {form.headstonePhoto1Url && (
      <img
  src={form.headstonePhoto1Url}
  alt="Headstone photo 1"
  className="h-48 w-full rounded-2xl object-cover"
/>
    )}

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setHeadstonePhoto1File(e.target.files?.[0] ?? null)}
      className="w-full rounded-2xl border px-4 py-3"
    />

    <Input
      label="Headstone Photo 2 URL"
      name="headstonePhoto2Url"
      value={form.headstonePhoto2Url}
      onChange={handleChange}
    />

    {form.headstonePhoto2Url && (
      <img
  src={form.headstonePhoto2Url}
  alt="Headstone photo 2"
  className="h-48 w-full rounded-2xl object-cover"
/>
    )}

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setHeadstonePhoto2File(e.target.files?.[0] ?? null)}
      className="w-full rounded-2xl border px-4 py-3"
    />
    </div>

  
                    <QuickSaveButton isSaving={isSaving} />
</FormSection>

<FormSection
  title="Final Resting Place"
  description="Tell visitors whether this person was buried or cremated. If known, you can also add a map location."
>
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-stone-800">
                          Was this person buried or cremated?
                        </label>
                        <select
                          name="finalRestingType"
                          value={form.finalRestingType}
                          onChange={handleDispositionChange}
                          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                        >
                          <option value="">Not specified</option>
                          <option value="buried">Buried</option>
                          <option value="cremated">Cremated</option>
                        </select>
                      </div>

                      {form.finalRestingType === "buried" && (
                        <div className="grid gap-5 md:grid-cols-2">
                          <Input
                            label="Cemetery Name"
                            name="cemeteryName"
                            value={form.cemeteryName}
                            onChange={handleChange}
                          />
                          <Input
                            label="Section"
                            name="graveSection"
                            value={form.graveSection}
                            onChange={handleChange}
                          />
                          <Input
                            label="Row"
                            name="graveRow"
                            value={form.graveRow}
                            onChange={handleChange}
                          />
                          <Input
                            label="Plot / Lot / Grave"
                            name="gravePlot"
                            value={form.gravePlot}
                            onChange={handleChange}
                          />
                        </div>
                      )}

                      {form.finalRestingType === "cremated" && (
                        <TextArea
                          label="Where were the ashes scattered or placed?"
                          name="ashesLocationDescription"
                          value={form.ashesLocationDescription}
                          onChange={handleChange}
                          rows={4}
                          helpText="Example: Ashes were scattered at the family farm in Lancaster County, Pennsylvania."
                        />
                      )}

                      {(form.finalRestingType === "buried" || form.finalRestingType === "cremated") && (
                        <>
                          <div className="border-t border-stone-200 pt-6">
                            <h3 className="text-xl font-semibold text-stone-900">
                              Map Location
                            </h3>
                            <p className="mt-2 text-sm text-stone-600">
                              {form.finalRestingType === "buried"
                                ? "You may place a pin at the burial location"
                                : "You may enter an address or place a pin at grave location or where the ashes were scattered, kept, or memorialized."}
                            </p>
<p className="mb-2 text-sm text-stone-600">
  
</p>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <Input label="Street Address" name="mapStreet" value={form.mapStreet} onChange={handleChange} />
<Input label="City" name="mapCity" value={form.mapCity} onChange={handleChange} />
<Input label="State" name="mapState" value={form.mapState} onChange={handleChange} />
<Input label="ZIP Code" name="mapZip" value={form.mapZip} onChange={handleChange} />
<Input label="Country" name="mapCountry" value={form.mapCountry} onChange={handleChange} />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={handleCenterMap}
                                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                              >
                                Center Map
                              </button>

                              <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                              >
                                Use My Current Location
                              </button>
                            </div>

                            {mapSearchStatus && (
                              <p className="mt-3 text-sm text-stone-500">{mapSearchStatus}</p>
                            )}

                            {locationStatus && (
                              <p className="mt-3 text-sm text-stone-500">{locationStatus}</p>
                            )}

                            <div className="mt-4 overflow-hidden rounded-2xl">
                              <GraveLocationMap
                                key={`${form.graveLat || "none"}-${form.graveLng || "none"}-edit`}
                                lat={form.graveLat ? Number(form.graveLat) : null}
                                lng={form.graveLng ? Number(form.graveLng) : null}
                                readOnly={false}
                                height="420px"
                                onChange={(lat, lng) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    graveLat: String(lat),
                                    graveLng: String(lng),
                                  }))
                                }
                              />
                            </div>

                            <div className="mt-4 grid gap-5 md:grid-cols-2">
                              <Input
                                label="Latitude"
                                name="graveLat"
                                value={form.graveLat}
                                onChange={handleChange}
                              />
                              <Input
                                label="Longitude"
                                name="graveLng"
                                value={form.graveLng}
                                onChange={handleChange}
                              />
                            </div>

                            <div className="mt-5">
                              <TextArea
                                label={form.finalRestingType === "buried" ? "Directions Note" : "Location Note"}
                                name="graveDirections"
                                value={form.graveDirections}
                                onChange={handleChange}
                                rows={4}
                                helpText={
                                  form.finalRestingType === "buried"
                                    ? "Example: Near the large oak tree, third row from the chapel side"
                                    : "Example: Overlook above the lake near the family cabin"
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </FormSection>

                  

                  

                  

                  {successMessage && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {successMessage}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-6">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    {(isOwner || isBackupUnlocked) && !isPublished && (
                    <button
  type="button"
  onClick={async () => {
    if (!memorialId) return;

    const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.access_token) {
  alert("You must be logged in to publish this memorial.");
  return;
}

const res = await fetch("/api/memorials/publish", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    memorialId,
  }),
});

const result = await res.json();

if (!res.ok) {
  alert(result.error || "Error publishing memorial.");
  return;
}

    alert("Memorial published successfully.");

    window.location.reload();
  }}
  className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
>
  Publish Memorial
</button>
)}

                    <Link
                      href={`/memorial/${originalSlug}`}
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-50"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </section>
                   </>
        )}
      </div>

      <SideAd
        pageType="edit"
        memorialZip={form.mapZip}
        categorySlot={rightAdCategory}
      />
    </div>
    {submissionPhotoViewer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <button
      type="button"
      onClick={() => setSubmissionPhotoViewer(null)}
      className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900"
    >
      Close
    </button>

    <button
      type="button"
      onClick={() =>
        setSubmissionPhotoViewer((prev) =>
          prev
            ? {
                ...prev,
                index:
                  prev.index === 0
                    ? prev.photos.length - 1
                    : prev.index - 1,
              }
            : prev
        )
      }
      className="absolute left-4 rounded-full bg-white px-4 py-3 text-xl font-bold text-stone-900"
    >
      ‹
    </button>

    <img
      src={submissionPhotoViewer.photos[submissionPhotoViewer.index]}
      alt="Submitted photo preview"
      className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
    />

    <button
      type="button"
      onClick={() =>
        setSubmissionPhotoViewer((prev) =>
          prev
            ? {
                ...prev,
                index:
                  prev.index === prev.photos.length - 1
                    ? 0
                    : prev.index + 1,
              }
            : prev
        )
      }
      className="absolute right-4 rounded-full bg-white px-4 py-3 text-xl font-bold text-stone-900"
    >
      ›
    </button>
  </div>
)}
  </main>
  );
}

type GraveLocationMapProps = {
  lat: number | null;
  lng: number | null;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
};
function QuickSaveButton({
  isSaving,
}: {
  isSaving: boolean;
}) {
  return (
    <div className="mt-5 flex justify-end border-t border-stone-200 pt-5">
      <button
        type="submit"
        form="edit-memorial-form"
        formNoValidate
        disabled={isSaving}
        className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
function GraveLocationMap({
  lat,
  lng,
  onChange,
  readOnly = false,
  height = "420px",
}: GraveLocationMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;
      const EL = await import("esri-leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !containerRef.current || mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startCenter: [number, number] =
        lat != null && lng != null ? [lat, lng] : [39.8283, -98.5795];

      const startZoom = lat != null && lng != null ? 18 : 4;

      const container = containerRef.current;
      if (!container) return;

      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      container.innerHTML = "";

      const map = L.map(container, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: true,
      }).setView(startCenter, startZoom);

      mapRef.current = map;

      const streetLayer = EL.basemapLayer("Streets", {
        ignoreDeprecationWarning: true,
      });
      const imageryLayer = EL.basemapLayer("Imagery", {
        ignoreDeprecationWarning: true,
      });
      const imageryLabelsLayer = EL.basemapLayer("ImageryTransportation", {
        ignoreDeprecationWarning: true,
      });

      function applyBasemap(zoom: number) {
        const useImagery = zoom >= 15;

        if (useImagery) {
          if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
          if (!map.hasLayer(imageryLayer)) imageryLayer.addTo(map);
          if (!map.hasLayer(imageryLabelsLayer)) imageryLabelsLayer.addTo(map);
        } else {
          if (map.hasLayer(imageryLayer)) map.removeLayer(imageryLayer);
          if (map.hasLayer(imageryLabelsLayer)) map.removeLayer(imageryLabelsLayer);
          if (!map.hasLayer(streetLayer)) streetLayer.addTo(map);
        }
      }

      applyBasemap(startZoom);

      map.on("zoomend", () => {
        applyBasemap(map.getZoom());
      });

      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng], {
          draggable: !readOnly,
        }).addTo(map);

        if (!readOnly) {
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current.getLatLng();
            onChangeRef.current?.(pos.lat, pos.lng);
          });
        }
      }

      if (!readOnly) {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], {
              draggable: true,
            }).addTo(map);

            markerRef.current.on("dragend", () => {
              const pos = markerRef.current.getLatLng();
              onChangeRef.current?.(pos.lat, pos.lng);
            });
          }

          onChangeRef.current?.(lat, lng);
        });
      }
    }

    initMap();

    return () => {
      isMounted = false;

      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }

      markerRef.current = null;

      if (containerRef.current) {
        (containerRef.current as any)._leaflet_id = null;
        containerRef.current.innerHTML = "";
      }
    };
  }, [readOnly]);

  useEffect(() => {
    async function updateMap() {
      const map = mapRef.current;
      if (!map || lat == null || lng == null) return;

      const L = (await import("leaflet")).default;
      const pos: [number, number] = [lat, lng];

      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        markerRef.current = L.marker(pos, {
          draggable: !readOnly,
        }).addTo(map);

        if (!readOnly) {
          markerRef.current.on("dragend", () => {
            const next = markerRef.current.getLatLng();
            onChangeRef.current?.(next.lat, next.lng);
          });
        }
      }

      map.flyTo(pos, 18, { duration: 1.5 });
    }

    updateMap();
  }, [lat, lng, readOnly]);

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-300">
      <div
        ref={containerRef}
        className="w-full cursor-move"
        style={{ height, touchAction: "none" }}
      />
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200/80 bg-stone-50/70 p-6 transition hover:shadow-sm md:p-7">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>
        {description && (
          <p className="mt-2 leading-7 text-stone-600">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}


function CompactFormSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-stone-200/80 bg-stone-50/70 p-4 transition hover:shadow-sm md:p-5">
      <div className="mb-3">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-stone-600">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
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
}: {
  label: string;
  name: keyof MemorialForm;
  value: string;
  onChange: ChangeHandler;
  type?: string;
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
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  rows = 4,
  helpText,
  placeholder,
}: {
  label: string;
  name: keyof MemorialForm;
  value: string;
  onChange: ChangeHandler;
  rows?: number;
  helpText?: string;
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
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      />
      {helpText && <p className="mt-2 text-sm text-stone-500">{helpText}</p>}
    </div>
  );
}

function SortableGalleryPhotoCard({
  id,
  photo,
  index,
  note,
  onNoteChange,
}: {
  id: string;
  photo: string;
  index: number;
  note: string;
  onNoteChange: (index: number, value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-stone-200 bg-white p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mb-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 active:scale-95"
      >
        Drag to reorder
      </button>

      <img
        src={photo}
        alt={`Gallery photo ${index + 1}`}
        className="h-36 w-full rounded-2xl object-cover"
      />

      <textarea
        value={note}
        onChange={(e) => onNoteChange(index, e.target.value)}
        rows={3}
        placeholder="Add a description for this photo..."
        className="mt-3 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
      />
    </div>
  );
}
