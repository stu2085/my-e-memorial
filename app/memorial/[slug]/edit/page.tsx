"use client";

import EditActionButtons from "../../../components/EditActionButtons";
import SubmissionPhotoViewerModal from "../../../components/SubmissionPhotoViewerModal";
import SchoolsAndAwardsSection from "../../../components/SchoolsAndAwardsSection";
import PlacesWorkedSection from "../../../components/PlacesWorkedSection";
import PlacesLivedSection from "../../../components/PlacesLivedSection";
import VisitorContributionsSection from "../../../components/VisitorContributionsSection";
import PlanSection from "../../../components/PlanSection";
import NewspaperArticlesSection from "../../../components/NewspaperArticlesSection";
import HeadstonePhotosSection from "../../../components/HeadstonePhotosSection";
import FinalRestingPlaceSection from "../../../components/FinalRestingPlaceSection";
import BackupPersonSection from "../../../components/BackupPersonSection";

import LifeStorySection from "../../../components/LifeStorySection";
import ObituarySection from "../../../components/ObituarySection";
import BasicInformationSection from "../../../components/BasicInformationSection";

import FamilyHistorySection from "../../../components/FamilyHistorySection";
import FavoriteSongsSection from "../../../components/FavoriteSongsSection";
import GallerySection from "../../../components/GallerySection";

import VideoMemoriesEditor from "../../../components/VideoMemoriesEditor";
import VideoUploadSection from "../../../components/VideoUploadSection";
import {
  reorderVideoMemoryState,
  removeVideoMemoryState,
} from "../../../../lib/videoMemoryState";

import {
  loadMemorialVideos,
  deleteMemorialVideo,
  updateMemorialVideoOrder,
  insertMemorialVideos,
  buildMemorialVideoRows,
  updateMemorialVideoNotes,
} from "../../../../lib/videoMemoryDatabase";
import { uploadVideoMemories } from "../../../../lib/videoMemoryUpload";
import { getVideoDuration } from "../../../../lib/videoMemoryUtils";

import { optimizeImage } from "../../../lib/optimizeImage";

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

const PLAN_PRICES = {
  basic: 4995,
  plus: 6995,
  premium: 8995,
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
greatGrandchildrenNames: string
  obituary: string;
  obituaryUrl: string;
  obituaryImageUrl: string;
  lifeStory: string;
backupPersonName: string;
  finalRestingType: string;
  cemeteryName: string;
  graveSection: string;
  graveRow: string;
  gravePlot: string;
  ashesLocationDescription: string;

  placesLived: string;
  placesWorked: string;
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
extraVideoMinutes: string;
videoLinkUrls: string[];
videoLinkNotes: string[];
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
greatGrandchildrenNames: "",
    obituary: "",
  obituaryUrl: "",
  obituaryImageUrl: "",
  lifeStory: "",
backupPersonName: "",
  finalRestingType: "",
  cemeteryName: "",
  graveSection: "",
  graveRow: "",
  gravePlot: "",
  ashesLocationDescription: "",

  placesLived: "",
  placesWorked: "",
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
extraVideoMinutes: "0",
videoLinkUrls: [],
videoLinkNotes: [],
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
  const EXTRA_VIDEO_PRICE = 9.95;
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
const searchParams = useSearchParams();
const returnedExtraVideos = Number(searchParams.get("extra_videos_paid") || 0);


const [form, setForm] = useState<MemorialForm>(emptyForm);

const savedExtraVideos = Number(form.extraVideoMinutes || 0);
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
  const [obituaryImageFile, setObituaryImageFile] =
  useState<File | null>(null);
  const [galleryInputResetKey, setGalleryInputResetKey] = useState(0);
  const [newspaperArticleFiles, setNewspaperArticleFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoError, setVideoError] = useState("");
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [videoNotes, setVideoNotes] = useState<string[]>([]);
  const [existingVideoDurations, setExistingVideoDurations] = useState<number[]>([]);
  const [selectedVideoDurations, setSelectedVideoDurations] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
const [newVideoLinkUrl, setNewVideoLinkUrl] = useState("");
const [newVideoLinkNote, setNewVideoLinkNote] = useState("");
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
      `"${oversizedFile.name}" exceeds the upload limit. Videos must be 1 GB or smaller and 5 minutes or less.`
    );
    e.target.value = "";
    return;
  }

  // 🔒 2. Plan minute limit
const baseVideoMinutes =
  form.plan === "premium" ? 60 : form.plan === "plus" ? 30 : 15;

const maxVideoMinutes =
  baseVideoMinutes + Number(form.extraVideoMinutes || 0);

const existingSelectedNames = new Set(videoFiles.map((file) => file.name));

const newUniqueFiles = files.filter(
  (file) => !existingSelectedNames.has(file.name)
);

let selectedVideoSeconds = 0;

for (const file of videoFiles) {
  selectedVideoSeconds += await getVideoDuration(file);
}

let newVideoSeconds = 0;

for (const file of newUniqueFiles) {
  newVideoSeconds += await getVideoDuration(file);
}

const existingVideoSeconds = existingVideoDurations.reduce(
  (total, seconds) => total + Number(seconds || 0),
  0
);

const totalVideoSeconds =
  existingVideoSeconds + selectedVideoSeconds + newVideoSeconds;

if (totalVideoSeconds > maxVideoMinutes * 60) {
  setVideoError(
    `This plan includes ${maxVideoMinutes} minutes of Video Memories. Please remove or shorten a video before adding more.`
  );

  e.target.value = "";
  return;
}

  // 🔒 3. Duration check (ADD THIS BACK)
  try {
    for (const file of files) {
      const duration = await getVideoDuration(file);

      if (duration > 300) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60)
          .toString()
          .padStart(2, "0");

        setVideoError(
          `"${file.name}" is ${minutes}:${seconds}. Maximum allowed is 5:00.`
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

  
async function handleMoveExistingVideo(index: number, direction: "up" | "down") {
  if (!memorialId) return;

  const state = reorderVideoMemoryState(
    existingVideos,
    videoNotes,
    index,
    direction
  );

  if (!state.changed) return;

  const reorderedVideos = state.existingVideos;
  const reorderedNotes = state.videoNotes;

  setExistingVideos(reorderedVideos);
  setVideoNotes(reorderedNotes);

  for (let i = 0; i < reorderedVideos.length; i++) {
    const { error } = await updateMemorialVideoOrder(
      memorialId,
      reorderedVideos[i],
      i
    );

    if (error) {
      console.error("UPDATE VIDEO SORT ORDER ERROR:", error);
      setVideoError("Could not update video order.");
      return;
    }
  }
}
  async function handleRemoveExistingVideo(videoIdToRemove: string) {
  if (!memorialId) return;

  const confirmed = window.confirm("Delete this video from the memorial?");

  if (!confirmed) return;

  const { data, error } = await deleteMemorialVideo(
  memorialId,
  videoIdToRemove
);



  if (error) {
    console.error("DELETE MEMORIAL VIDEO ERROR:", error);
    setVideoError("Could not delete this video.");
    return;
  }

  const state = removeVideoMemoryState(
    existingVideos,
    videoNotes,
    videoIdToRemove
  );

  setExistingVideos(state.existingVideos);
  setVideoNotes(state.videoNotes);
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
greatGrandchildrenNames: data.great_grandchildren_names || "",
        obituary: data.obituary ?? "",
        obituaryUrl: data.obituary_url ?? "",
        obituaryImageUrl: data.obituary_image_url ?? "",
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
        placesWorked: data.places_worked ?? "",
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
extraVideoMinutes: String(data.extra_video_minutes ?? 0),
backupEmail: "",
backupPassword: "",
videoLinkUrls: Array.isArray(data.video_link_urls) ? data.video_link_urls : [],
videoLinkNotes: Array.isArray(data.video_link_notes) ? data.video_link_notes : [],

});

const { data: videosData, error: videosError } =
  await loadMemorialVideos(data.id);

if (videosError) {
  console.error("LOAD MEMORIAL VIDEOS ERROR:", videosError);
}

const loadedVideos = (videosData || []).map((video) => video.playback_id);
const loadedVideoNotes = (videosData || []).map((video) => video.note || "");
const loadedVideoDurations = (videosData || []).map(
  (video) => video.duration_seconds || 0
);

setExistingVideos(loadedVideos);
setVideoNotes(loadedVideoNotes);
setExistingVideoDurations(loadedVideoDurations);

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

  const fileToUpload =
    bucketName === "memorial-photos"
      ? await optimizeImage(file)
      : file;

  const fileExt = fileToUpload.name.split(".").pop();
  const filePath = `${folderName}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileToUpload);

  if (error) {
    throw error;
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
      const newSlug = originalSlug;

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
      let obituaryImageUrl = form.obituaryImageUrl;

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
  headstonePhoto1Url = await uploadFile(
    headstonePhoto1File,
    newSlug,
    "memorial-photos"
  );
}

if (headstonePhoto2File) {
  headstonePhoto2Url = await uploadFile(
    headstonePhoto2File,
    newSlug,
    "memorial-photos"
  );
}

if (obituaryImageFile) {
  obituaryImageUrl = await uploadFile(
    obituaryImageFile,
    newSlug,
    "memorial-photos"
  );
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
        obituary_image_url: obituaryImageUrl,
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
                places_worked: form.placesWorked,
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
        
video_link_urls: form.videoLinkUrls,
video_link_notes: form.videoLinkNotes,
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
if (newPlaybackIds.length > 0) {
  const startingSortOrder = existingVideos.length;

  const newVideoRows = buildMemorialVideoRows(
  memorialId,
  newPlaybackIds,
  startingSortOrder
);

  const { error: insertVideoError } =
  await insertMemorialVideos(newVideoRows);

  if (insertVideoError) {
    console.error("INSERT MEMORIAL VIDEOS ERROR:", insertVideoError);
    setErrorMessage(
      "The memorial was saved, but the new videos could not be attached."
    );
    return;
  }
}
const existingVideoUpdates = existingVideos.map((playbackId, index) => ({
  playback_id: playbackId,
  note: videoNotes[index] || "",
}));

const { error: updateVideoError } =
  await updateMemorialVideoNotes(
    memorialId,
    existingVideoUpdates
  );

if (updateVideoError) {
  console.error(
    "UPDATE MEMORIAL VIDEO NOTE ERROR:",
    updateVideoError
  );
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

      setExistingVideos([
  ...existingVideos,
  ...newPlaybackIds.map((video) => video.playbackId),
]);
      setFavoriteSongFiles([]);
      setHeadstonePhoto1File(null);
      setHeadstonePhoto2File(null);
      setGalleryPhotoFiles([]);
      setGalleryInputResetKey((prev) => prev + 1);
      setNewspaperArticleFiles([]);
      setVideoFiles([]);
      setSelectedVideoDurations([]);

      setSuccessMessage(
  videoFiles.length > 0
    ? `✅ Changes saved successfully. ${videoFiles.length} video${videoFiles.length === 1 ? "" : "s"} uploaded. Videos may take a few moments to finish processing.`
    : "✅ Changes saved successfully."
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
    alert("You do not have permission to purchase additional Video Memory time for this memorial.");
    return;
  }

  if (!memorialId) {
    alert("Missing memorial record. Could not start checkout.");
    return;
  }

  try {
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
async function uploadVideos() {
  return uploadVideoMemories({
    videoFiles,
    videoNotes,
    maxVideoSizeBytes: MAX_VIDEO_SIZE_BYTES,
    onError: setVideoError,
  });
}
async function handlePublishMemorial() {
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
}
  const displayName =
  [form.firstName, form.middleName, form.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unnamed Memorial";


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
  <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-8 px-4 lg:grid-cols-[180px_minmax(0,900px)_180px] lg:justify-center"></div>
<div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-8 px-4 lg:grid-cols-[180px_minmax(0,900px)_180px] lg:justify-center">
  <div className="hidden lg:block lg:-translate-x-6">
  <div className="sticky top-24">
    <SideAd
      pageType="edit"
      memorialZip={form.mapZip}
      categorySlot={leftAdCategory}
    />
  </div>
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
                      href={`/memorial/${originalSlug}`}
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
                  
                 <PlanSection
  plan={form.plan}
  handleUpgradePlan={handleUpgradePlan}
/>
<VisitorContributionsSection
  submissionsMessage={submissionsMessage}
  submissions={submissions}
  form={form}
  existingVideoDurations={existingVideoDurations}
  setSubmissionPhotoViewer={setSubmissionPhotoViewer}
  handleSubmissionStatus={handleSubmissionStatus}
  handleBuyExtraVideos={handleBuyExtraVideos}
/>
{form.isLivingPreplan && (
<BackupPersonSection
  form={form}
  handleChange={handleChange}
  isSaving={isSaving}
  isPublished={isPublished}
/>
)}
<FavoriteSongsSection
  firstName={form.firstName}
  favoriteSongUrl={form.favoriteSongUrl}
  favoriteSongUrls={form.favoriteSongUrls}
  favoriteSongNotes={form.favoriteSongNotes}
  isSaving={isSaving}
  isPublished={isPublished}
  handleChange={handleChange}
  setForm={setForm}
  setFavoriteSongFiles={setFavoriteSongFiles}
/>

                  

   
<BasicInformationSection
  form={form}
  handleChange={handleChange}
  setFeaturedPhotoFile={setFeaturedPhotoFile}
  isSaving={isSaving}
  isPublished={isPublished}
/>
                    
<PlacesLivedSection
  placesLived={form.placesLived}
  handleChange={handleChange}
  isSaving={isSaving}
  isPublished={isPublished}
/>
<PlacesWorkedSection
  placesWorked={form.placesWorked}
  handleChange={handleChange}
  isSaving={isSaving}
  isPublished={isPublished}
/>
                 <SchoolsAndAwardsSection
  schoolsAttended={form.schoolsAttended}
  awardsWon={form.awardsWon}
  handleChange={handleChange}
  isSaving={isSaving}
  isPublished={isPublished}
/>
                 

<LifeStorySection
  form={form}
  handleChange={handleChange}
  isSaving={isSaving}
  isPublished={isPublished}
/>

<FamilyHistorySection
  form={form}
  handleChange={handleChange}
  isSaving={isSaving}
  isPublished={isPublished}
/>
                  
<GallerySection
  form={form}
  setForm={setForm}
  handleChange={handleChange}
  splitGalleryPhotos={splitGalleryPhotos}
  galleryDragSensors={galleryDragSensors}
  galleryInputResetKey={galleryInputResetKey}
  galleryPhotoFiles={galleryPhotoFiles}
  setGalleryPhotoFiles={setGalleryPhotoFiles}
  isSaving={isSaving}
  isPublished={isPublished}
/>

<NewspaperArticlesSection
  newspaperArticles={form.newspaperArticles}
  handleChange={handleChange}
  splitGalleryPhotos={splitGalleryPhotos}
  setNewspaperArticleFiles={setNewspaperArticleFiles}
  isSaving={isSaving}
  isPublished={isPublished}
/>

  
  <div className="space-y-5">
    <VideoUploadSection
      isPublished={isPublished}
      videoFiles={videoFiles}
      handleVideoChange={handleVideoChange}
      newVideoLinkUrl={newVideoLinkUrl}
      setNewVideoLinkUrl={setNewVideoLinkUrl}
      newVideoLinkNote={newVideoLinkNote}
      setNewVideoLinkNote={setNewVideoLinkNote}
      form={form}
      setForm={setForm}
      existingVideosLength={existingVideos.length}
      paidExtraVideos={paidExtraVideos}
      handleBuyExtraVideos={handleBuyExtraVideos}
      videoError={videoError}
      existingVideoDurations={existingVideoDurations}
      selectedVideoDurations={selectedVideoDurations}
    />

    <VideoMemoriesEditor
      existingVideos={existingVideos}
      videoNotes={videoNotes}
      previewVideoId={previewVideoId}
      setPreviewVideoId={setPreviewVideoId}
      setVideoNotes={setVideoNotes}
      handleMoveExistingVideo={handleMoveExistingVideo}
      handleRemoveExistingVideo={handleRemoveExistingVideo}
      isSaving={isSaving}
      isPublished={isPublished}
    />
  </div>


                 <ObituarySection
  form={form}
  handleChange={handleChange}
  setForm={setForm}
  setObituaryImageFile={setObituaryImageFile}
  isSaving={isSaving}
  isPublished={isPublished}
/>
       <HeadstonePhotosSection
  form={form}
  handleChange={handleChange}
  setForm={setForm}
  setHeadstonePhoto1File={setHeadstonePhoto1File}
  setHeadstonePhoto2File={setHeadstonePhoto2File}
  isSaving={isSaving}
  isPublished={isPublished}
/>
<FinalRestingPlaceSection
  form={form}
  handleChange={handleChange}
  handleDispositionChange={handleDispositionChange}
  handleCenterMap={handleCenterMap}
  handleUseCurrentLocation={handleUseCurrentLocation}
  mapSearchStatus={mapSearchStatus}
  locationStatus={locationStatus}
  setForm={setForm}
/>

<EditActionButtons
  isPublished={isPublished}
  isSaving={isSaving}
  isOwner={isOwner}
  isBackupUnlocked={isBackupUnlocked}
  successMessage={successMessage}
  originalSlug={originalSlug}
  handlePublishMemorial={handlePublishMemorial}
/>
                 
                </form>
              </div>
            </section>
                   </>
        )}
      </div>

     <div className="hidden lg:block">
  <div className="sticky top-24">
    <SideAd
      pageType="edit"
      memorialZip={form.mapZip}
      categorySlot={rightAdCategory}
    />
  </div>
</div>
</div>

    <SubmissionPhotoViewerModal
  submissionPhotoViewer={submissionPhotoViewer}
  setSubmissionPhotoViewer={setSubmissionPhotoViewer}
/>
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

