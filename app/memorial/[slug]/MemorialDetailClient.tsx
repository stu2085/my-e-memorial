"use client";

import MuxPlayer from "@mux/mux-player-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import dynamic from "next/dynamic";
import SideAd from "../../components/SideAd";
import MobileAd from "../../components/MobileAd";
const GraveLocationMap = dynamic(
  () => import("../../components/GraveLocationMap"),
  { ssr: false }
);

type Memorial = {
  id?: number;
  slug?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  nickname?: string;
  birth_date?: string;
  death_date?: string;
  obituary?: string;
  obituary_url: string | null;
  life_story?: string;
great_grandparents_names?: string;
grandparents_father_side?: string;
grandparents_mother_side?: string;
parents_names?: string;
siblings_names?: string;
children_names?: string | null;
grandchildren_names?: string | null;
  final_resting_type?: string;
  cemetery_name?: string;
  grave_section?: string;
  grave_row?: string;
  grave_plot?: string;
  ashes_location_description?: string;
is_living_preplan?: boolean;
    places_lived?: string;
  schools_attended?: string | string[];
  awards_won?: string | string[];
  social_link_1?: string;
social_link_2?: string;
social_link_3?: string;
social_link_4?: string;
social_link_5?: string;
  favorite_song_url?: string;
  favorite_song_urls?: string[] | null;
  favorite_song_notes?: string[] | null;
  featured_photo_url?: string;
  headstone_photo_1?: string;
  headstone_photo_2?: string;
  gallery_photos?: string | string[];
  gallery_photo_notes?: string[] | null;
  newspaper_articles?: string | string[];
  video_urls?: string | string[];

  grave_lat?: number | string | null;
  grave_lng?: number | string | null;
  grave_latitude?: number | string | null;
  grave_longitude?: number | string | null;
  grave_directions?: string;
  map_street?: string;
  map_city?: string;
  map_state?: string;
  map_zip?: string;
  map_country?: string;
  is_published?: boolean;
  updated_at?: string | null;
};
type ApprovedSubmission = {
  id: number;
  submitter_name: string | null;
  message: string | null;
  photo_urls: string[] | null;
  video_urls: string[] | string | null;
  created_at: string | null;
};

function getGalleryPhotos(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getVideoUrls(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export default function MemorialDetailClient() {
  const MAX_CONTRIBUTOR_VIDEO_SIZE_BYTES = 1000 * 1000 * 1000; // 1 GB
  const params = useParams();
  const slug =
    typeof params?.slug === "string"
      ? params.slug
      : Array.isArray(params?.slug)
        ? params.slug[0]
        : "";
const [error, setError] = useState("");
  const [data, setData] = useState<Memorial | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
const [showFavoriteSongs, setShowFavoriteSongs] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showMemorialVideos, setShowMemorialVideos] = useState(false);
  const [showHeadstonePhotos, setShowHeadstonePhotos] = useState(false);
  const [showNewspaperArticles, setShowNewspaperArticles] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [showSchoolsAwards, setShowSchoolsAwards] = useState(false);
  const [showPlacesLived, setShowPlacesLived] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wasMusicPlayingBeforeVideo, setWasMusicPlayingBeforeVideo] = useState(false);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const songAudioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const touchStartXRef = useRef<number | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
const [copied, setCopied] = useState(false);
const [submitterName, setSubmitterName] = useState("");
const [submitterEmail, setSubmitterEmail] = useState("");
const [submissionMessage, setSubmissionMessage] = useState("");
const [submissionPhotos, setSubmissionPhotos] = useState<File[]>([]);
const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
const [photoFadeKey, setPhotoFadeKey] = useState(0);
const [submissionVideo, setSubmissionVideo] = useState<File | null>(null);
const [uploadingVideo, setUploadingVideo] = useState(false);
const [uploadingPhotos, setUploadingPhotos] = useState(false);
const [submissionSuccess, setSubmissionSuccess] = useState(false);
const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
const [approvedSubmissions, setApprovedSubmissions] = useState<
  ApprovedSubmission[]
>([]);
const [contributorPhotoViewer, setContributorPhotoViewer] = useState<{
  photos: string[];
  index: number;
} | null>(null);
async function handleShare(platform?: string) {
  const url = `${window.location.origin}/memorial/${data?.slug || slug}`;
  const text = `View this memorial for ${data?.full_name || "a loved one"}`;
if (!platform && navigator.share) {
  try {
    await navigator.share({
      title: data?.full_name || "Memorial",
      text,
      url,
    });

    return;
  } catch {
    return;
  }
}
  if (platform === "copy") {
  await navigator.clipboard.writeText(url);

  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 2000);

  return;
}

  if (platform === "facebook") {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
    return;
  }

  if (platform === "twitter") {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
    return;
  }

  if (platform === "email") {
  const subject = `Memorial for ${data?.full_name || "a loved one"}`;
  const body =
    `I wanted to share this memorial page with you:\n\n` +
    `${data?.full_name || "Memorial"}\n\n` +
    `${url}\n\n` +
    `You can open the link above to view photos, stories, videos, music, and memories.`;

  window.location.href =
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return;
}
if (platform === "sms") {
  window.location.href =
    `sms:?body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  return;
}

if (platform === "whatsapp") {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
    "_blank"
  );
  return;
}
  await navigator.clipboard.writeText(url);
  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 2000);
}
  useEffect(() => {
    async function loadMemorial() {
      if (!slug) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: memorialData, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
        const {
  data: { user },
} = await supabase.auth.getUser();



const isOwnerUser =
  !!user && memorialData?.owner_id === user.id;

setIsOwner(isOwnerUser);

if (memorialData?.is_published === false && !isOwnerUser) {
  setError("This memorial has not yet been published.");
  setLoading(false);
  return;
}

      if (error) {
        console.error("LOAD MEMORIAL ERROR:", error);
        setData(null);
        setLoading(false);
        return;
      }

      setData((memorialData as Memorial) ?? null);
      const description =
  memorialData?.obituary?.slice(0, 155) ||
  memorialData?.life_story?.slice(0, 155) ||
  `View the memorial page for ${memorialData?.full_name || "a loved one"} on MyEMemorial.`;

if (memorialData?.full_name) {
  document.title = `${memorialData.full_name} | MyEMemorial`;

let metaDescription = document.querySelector(
  'meta[name="description"]'
) as HTMLMetaElement | null;

if (!metaDescription) {
  metaDescription = document.createElement("meta");
  metaDescription.name = "description";
  document.head.appendChild(metaDescription);
}

metaDescription.content = description;
}
const ogTags = [
  {
    property: "og:title",
    content: `${memorialData.full_name} | MyEMemorial`,
  },
  {
    property: "og:description",
    content: description,
  },
  {
    property: "og:type",
    content: "website",
  },
  {
    property: "og:url",
    content: `${window.location.origin}/memorial/${memorialData.slug}`,
  },
  {
    property: "og:image",
    content:
      memorialData.featured_photo_url ||
      memorialData.headstone_photo_1 ||
      `${window.location.origin}/gravestone1.jpg`,
  },
];

ogTags.forEach((tag) => {
  let element = document.querySelector(
    `meta[property="${tag.property}"]`
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", tag.property);
    document.head.appendChild(element);
  }

  element.content = tag.content;
});
const existingStructuredData = document.getElementById(
  "memorial-structured-data"
);

if (existingStructuredData) {
  existingStructuredData.remove();
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: memorialData.full_name,
  givenName: memorialData.first_name || undefined,
  additionalName: memorialData.middle_name || undefined,
  familyName: memorialData.last_name || undefined,
  birthDate: memorialData.birth_date || undefined,
  deathDate: memorialData.death_date || undefined,
  description:
    memorialData.obituary ||
    memorialData.life_story ||
    `Memorial page for ${memorialData.full_name}`,
  image:
    memorialData.featured_photo_url ||
    memorialData.headstone_photo_1 ||
    undefined,
  url: `${window.location.origin}/memorial/${memorialData.slug}`,
};

const script = document.createElement("script");
script.id = "memorial-structured-data";
script.type = "application/ld+json";
script.text = JSON.stringify(structuredData);

document.head.appendChild(script);
      if (memorialData?.id) {
  
      const { data: approvedData, error: approvedError } =
    await supabase
      .from("memorial_submissions")
      .select("id, submitter_name, message, photo_urls, video_urls, created_at")
      .eq("memorial_id", memorialData.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

  if (approvedError) {
    console.error(
      "LOAD APPROVED SUBMISSIONS ERROR:",
      approvedError
    );
  } else {
    setApprovedSubmissions(
      (approvedData as ApprovedSubmission[]) || []
    );
    console.log(
  "APPROVED SUBMISSIONS:",
  approvedData,
  "COUNT:",
  approvedData?.length
);
  }
}
      setLoading(false);
    }

    loadMemorial();
  }, [slug]);

  const galleryPhotos = useMemo(
  () => getGalleryPhotos(data?.gallery_photos),
  [data?.gallery_photos]
);



const newspaperArticles = useMemo(
  () => getGalleryPhotos(data?.newspaper_articles),
  [data?.newspaper_articles]
);

const videoUrls = useMemo(
  () => getVideoUrls(data?.video_urls),
  [data?.video_urls]
);
  const contributorGalleryPhotos = useMemo(() => {
  return approvedSubmissions.flatMap((submission) => {
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

    return submittedPhotos.filter(Boolean).map((photoUrl) => ({
      src: photoUrl,
      note: "",
      attribution: submission.submitter_name
        ? `Submitted by ${submission.submitter_name}`
        : "Submitted by Anonymous Visitor",
    }));
  });
}, [approvedSubmissions]);

const combinedGalleryPhotos = useMemo(() => {
  const ownerPhotos = galleryPhotos.map((photoUrl, index) => ({
    src: photoUrl,
    note: data?.gallery_photo_notes?.[index] ?? "",
    attribution: "",
  }));

  return [...ownerPhotos, ...contributorGalleryPhotos];
}, [galleryPhotos, data?.gallery_photo_notes, contributorGalleryPhotos]);

  const graveLat = toNumber(data?.grave_lat ?? data?.grave_latitude ?? null);
  const graveLng = toNumber(data?.grave_lng ?? data?.grave_longitude ?? null);
  const hasGraveMap = graveLat != null && graveLng != null;

const restingPlaceAddress = [
  data?.map_street,
  data?.map_city,
  data?.map_state,
  data?.map_zip,
  data?.map_country,
]
  .filter(Boolean)
  .join(", ");
    const hasMemorialDetails =
    !!data?.places_lived?.trim() ||
    (Array.isArray(data?.schools_attended)
      ? data.schools_attended.length > 0
      : !!data?.schools_attended?.trim()) ||
    (Array.isArray(data?.awards_won)
      ? data.awards_won.length > 0
      : !!data?.awards_won?.trim());

  const isBuried = data?.final_resting_type === "buried";
  const isCremated = data?.final_resting_type === "cremated";

  const hasFinalRestingPlace =
    isBuried ||
    isCremated ||
    !!data?.cemetery_name?.trim() ||
    !!data?.grave_section?.trim() ||
    !!data?.grave_row?.trim() ||
    !!data?.grave_plot?.trim() ||
    !!data?.ashes_location_description?.trim() ||
    !!data?.grave_directions?.trim() ||
    hasGraveMap;

  function pauseBackgroundMusicForVideo() {
    const audio = backgroundAudioRef.current;
    if (!audio) return;

    const wasPlaying = !audio.paused;
    setWasMusicPlayingBeforeVideo(wasPlaying);

    if (wasPlaying) {
      audio.pause();
    }
  }

  function resumeBackgroundMusicAfterVideo() {
    const audio = backgroundAudioRef.current;
    if (!audio) return;

    if (wasMusicPlayingBeforeVideo) {
      audio.play().catch(() => {});
    }
  }

  useEffect(() => {
    return () => {
      backgroundAudioRef.current?.pause();
    };
  }, []);
  useEffect(() => {
  const audio = songAudioRefs.current[currentSongIndex];

  if (audio) {
    audio.play().catch(() => {});
  }
}, [currentSongIndex]);
  useEffect(() => {
  if (selectedPhotoIndex === null) return;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setSelectedPhotoIndex(null);
    }

    if (event.key === "ArrowLeft") {
      setSelectedPhotoIndex((currentIndex) => {
        if (currentIndex === null) return currentIndex;

        return currentIndex === 0
          ? combinedGalleryPhotos.length - 1
          : currentIndex - 1;
      });
    }

    if (event.key === "ArrowRight") {
      setSelectedPhotoIndex((currentIndex) => {
        if (currentIndex === null) return currentIndex;

        return currentIndex === combinedGalleryPhotos.length - 1
          ? 0
          : currentIndex + 1;
      });
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedPhotoIndex, combinedGalleryPhotos.length]);
useEffect(() => {
  if (!isSlideshowPlaying || selectedPhotoIndex === null) return;

  const timer = setInterval(() => {
    setSelectedPhotoIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;

      return currentIndex === combinedGalleryPhotos.length - 1
        ? 0
        : currentIndex + 1;
    });
    

    setPhotoFadeKey((current) => current + 1);
  }, 4000);

  return () => clearInterval(timer);
}, [isSlideshowPlaying, selectedPhotoIndex, combinedGalleryPhotos.length]);
  function getContributorVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        reject(new Error("Could not read video duration."));
        return;
      }

      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration."));
    };

    video.src = url;
    video.load();
  });
}

async function uploadContributorVideo(file: File): Promise<string> {
  if (file.size > MAX_CONTRIBUTOR_VIDEO_SIZE_BYTES) {
    throw new Error("Video is too large. Maximum video size is 1 GB.");
  }

  const duration = await getContributorVideoDuration(file);

  if (duration > 600) {
    throw new Error("Contributor videos must be 10 minutes or less.");
  }

  const uploadRes = await fetch("/api/mux-upload", {
    method: "POST",
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error("MUX UPLOAD API ERROR:", errorText);
    throw new Error("Could not create video upload URL.");
  }

  const uploadText = await uploadRes.text();

  if (!uploadText) {
    throw new Error("Video upload API returned empty response.");
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
    throw new Error("Video upload failed.");
  }

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
      return playbackData.playbackId;
    }
  }

  throw new Error("Video is still processing. Please try again shortly.");
}
  async function handleContributionSubmit() {
  if (!data?.id || !data?.slug) return;

  if (!submissionMessage.trim()) {
    alert("Please enter a message or memory.");
    return;
  }

  try {
    setIsSubmittingContribution(true);
let uploadedPhotoUrls: string[] = [];
let uploadedVideoUrls: string[] = [];

if (submissionPhotos.length > 0) {
  setUploadingPhotos(true);

  for (const photo of submissionPhotos) {
    const fileExt = photo.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `submission-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-media")
      .upload(filePath, photo);

    if (uploadError) {
      console.error(uploadError);
      alert("Photo upload failed.");
      setUploadingPhotos(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("memorial-media")
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      uploadedPhotoUrls.push(publicUrlData.publicUrl);
    }
  }

  setUploadingPhotos(false);
}
if (submissionVideo) {
  try {
    setUploadingVideo(true);

    const playbackId = await uploadContributorVideo(submissionVideo);
    uploadedVideoUrls.push(playbackId);
  } catch (err) {
    console.error(err);
    alert(
      err instanceof Error
        ? err.message
        : "Video upload failed."
    );
    return;
  } finally {
    setUploadingVideo(false);
  }
}

      const res = await fetch("/api/memorial-submission", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  memorialId: data.id,
  memorialSlug: data.slug,
  memorialName: data.full_name,
  submitterName,
  submitterEmail,
  message: submissionMessage,
  photoUrls: uploadedPhotoUrls,
  videoUrls: uploadedVideoUrls,
}),
});

const result = await res.json();

if (!res.ok) {
  throw new Error(result.error || "Could not submit contribution.");
}

    setSubmissionSuccess(true);
    setSubmitterName("");
    setSubmitterEmail("");
    setSubmissionMessage("");
    setSubmissionPhotos([]);
    setSubmissionVideo(null);
  } catch (err) {
    console.error(err);
    alert("There was a problem sending your submission.");
  } finally {
    setIsSubmittingContribution(false);
  }
}
if (error) {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-[28px] font-bold tracking-tight text-stone-900">
          Memorial Not Available
        </h1>
        <p className="mt-3 text-stone-600">{error}</p>
      </div>
    </main>
  );
}
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="text-stone-600">Loading memorial...</p>
      </main>
    );
  }

  if (!data) {
    
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="text-red-600">Memorial not found.</p>
      </main>
    );
  }
const selectedPhoto =
  selectedPhotoIndex !== null
    ? combinedGalleryPhotos[selectedPhotoIndex]?.src
    : null;

const selectedPhotoNote =
  selectedPhotoIndex !== null
    ? combinedGalleryPhotos[selectedPhotoIndex]?.note
    : null;

const selectedPhotoAttribution =
  selectedPhotoIndex !== null
    ? combinedGalleryPhotos[selectedPhotoIndex]?.attribution
    : "";
    const canGoPrevious =
  selectedPhotoIndex !== null && combinedGalleryPhotos.length > 1;

const canGoNext =
  selectedPhotoIndex !== null && combinedGalleryPhotos.length > 1;

function showPreviousPhoto() {
  if (selectedPhotoIndex === null) return;

  setSelectedPhotoIndex(
    selectedPhotoIndex === 0
      ? combinedGalleryPhotos.length- 1
      : selectedPhotoIndex - 1
  );
}

function showNextPhoto() {
  if (selectedPhotoIndex === null) return;

  setSelectedPhotoIndex(
    selectedPhotoIndex === combinedGalleryPhotos.length - 1
      ? 0
      : selectedPhotoIndex + 1
  );setPhotoFadeKey((current) => current + 1);
}
  return (
  <main className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-stone-100 px-2 py-6 sm:px-4 sm:py-10">
  <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-6 px-4 lg:grid-cols-[460px_minmax(0,1fr)]">
    <SideAd
  memorialZip={data.map_zip}
  pageType="memorial"
/>

    <div className="space-y-10">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
{isOwner && (
  <div
    className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
      data.is_published
        ? "border-green-200 bg-green-50 text-green-800"
        : "border-amber-200 bg-amber-50 text-amber-800"
    }`}
  >
    {data.is_published
      ? "This memorial is currently published and publicly visible."
      : "This memorial is currently unpublished and only visible to you and your backup person."}
  </div>
)}
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">

  <div className="min-w-0 flex-1">
    <h1 className="text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-5xl">
      {data.full_name || "Unnamed Memorial"}
    </h1>

    <div className="mt-4 grid gap-3 text-sm text-stone-700 sm:grid-cols-2 md:text-base">
      {data.birth_date && (
        <p>
          <strong>Born:</strong> {formatDate(data.birth_date)}
        </p>
      )}

      {data.death_date && (
        <p>
          <strong>Died:</strong> {formatDate(data.death_date)}
        </p>
      )}

      {data.nickname?.trim() && (
        <p>
          <strong>Nickname:</strong> {data.nickname}
        </p>
      )}

      {data.maiden_name?.trim() && (
        <p>
          <strong>Maiden Name:</strong> {data.maiden_name}
        </p>
      )}
    </div>
  </div>

  <div className="flex flex-col items-center gap-4 lg:items-end">

    {data.featured_photo_url && (
      <img
        src={data.featured_photo_url}
        alt={data.full_name || "Memorial photo"}
        className="h-[190px] w-[190px] rounded-2xl bg-stone-100 object-contain p-2 shadow-lg ring-1 ring-stone-200 sm:h-[220px] sm:w-[220px] md:h-[240px] md:w-[240px]"
      />
   )}

<div className="flex flex-col gap-3">
  <div className="flex flex-wrap gap-3">
   {isOwner && (
  <button
    type="button"
    onClick={() => {
      window.location.href = `/memorial/${data.slug}/edit`;
    }}
    className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
  >
    Edit Memorial
  </button>
)}

    
  </div>

  <div className="flex flex-wrap gap-2">
  <button
    onClick={() => handleShare("copy")}
    className="inline-flex items-center justify-center rounded-full bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-300"
  >
    {copied ? "Memorial Link Copied!" : "Copy Memorial Link"}
  </button>

  <button
    onClick={() => handleShare("email")}
    className="inline-flex items-center justify-center rounded-full bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-300"
  >
    Email Memorial Link
  </button>

    <button
      onClick={() => handleShare("sms")}
      className="inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-500"
    >
      Text
    </button>

    <button
      onClick={() => handleShare("facebook")}
      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
    >
      Facebook
    </button>

    <button
      onClick={() => handleShare("whatsapp")}
      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
    >
      WhatsApp
    </button>

    <button
      onClick={() => handleShare("twitter")}
      className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
    >
      X
    </button>
  </div>

  {!isOwner && data.is_living_preplan && (
  <Link
    href={`/memorial/${data.slug}/edit`}
    className="inline-flex w-fit items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
  >
    Backup person? Manage this memorial
  </Link>
)}
</div>

</div>
</div>
</section>

<div className="lg:hidden">
  <MobileAd memorialZip={data.map_zip} pageType="memorial" />
</div>

{(data.favorite_song_url ||
  (data.favorite_song_urls && data.favorite_song_urls.length > 0)) && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="flex w-full items-center justify-between gap-4 text-left">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
  setTimeout(() => {
              const firstAudio = songAudioRefs.current[0];

              if (firstAudio) {
                setCurrentSongIndex(0);
                firstAudio.currentTime = 0;
                firstAudio.play().catch((err) => {
                  console.error("Audio play failed:", err);
                });
              }
            }, 300);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-lg text-white transition hover:bg-stone-700"
        >
          ▶
        </button>

        <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
          {data.first_name
            ? `${data.first_name}'s Favorite Songs`
            : "Favorite Songs"}
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setShowFavoriteSongs((current) => !current)}
        className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700 hover:bg-stone-200"
      >
        {showFavoriteSongs ? "▲" : "▼"}
      </button>
    </div>
<p className="mt-2 text-xs text-stone-500">
          Tap play to begin. Songs will continue automatically.
        </p>
    <div className={showFavoriteSongs ? "mt-4 space-y-2" : "hidden"}>
          {(data.favorite_song_urls && data.favorite_song_urls.length > 0
            ? data.favorite_song_urls
            : data.favorite_song_url
              ? [data.favorite_song_url]
              : []
          ).map((song, index) => (
            <div
              key={`${song}-${index}`}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
            >
              <audio
                ref={(element) => {
                  songAudioRefs.current[index] = element;

                  if (index === currentSongIndex) {
                    backgroundAudioRef.current = element;
                  }
                }}
                controls
                preload="auto"
                className="w-full"
                src={song}
                onPlay={() => {
                  setCurrentSongIndex(index);
                }}
                onEnded={() => {
                  const nextIndex = index + 1;

                  if (nextIndex < songAudioRefs.current.length) {
                    setCurrentSongIndex(nextIndex);

                    setTimeout(() => {
                      const nextAudio = songAudioRefs.current[nextIndex];

                      if (nextAudio) {
                        nextAudio.currentTime = 0;
                        nextAudio.play().catch((err) =>
                          console.error("Autoplay failed:", err)
                        );
                      }
                    }, 250);
                  }
                }}
              />

              {data.favorite_song_notes?.[index] && (
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-stone-600">
                  {data.favorite_song_notes[index]}
                </p>
              )}
            </div>
          ))}
                </div>
  </section>
)}

<section className="rounded-2xl bg-gradient-to-b from-white to-stone-50 p-5 shadow-sm">
  <h2 className="text-[28px] font-bold tracking-tight text-stone-900">Basic Information</h2>

  <div className="mt-5 grid gap-3 text-stone-700 sm:grid-cols-2">
    {data.first_name?.trim() && (
      <p><strong>First Name:</strong> {data.first_name}</p>
    )}

    {data.middle_name?.trim() && (
      <p><strong>Middle Name:</strong> {data.middle_name}</p>
    )}

    {data.last_name?.trim() && (
      <p><strong>Last Name:</strong> {data.last_name}</p>
    )}

    {data.maiden_name?.trim() && (
      <p><strong>Maiden Name:</strong> {data.maiden_name}</p>
    )}

    {data.nickname?.trim() && (
      <p><strong>Nickname:</strong> {data.nickname}</p>
    )}

    {data.birth_date && (
      <p><strong>Born:</strong> {formatDate(data.birth_date)}</p>
    )}

    {data.death_date && (
      <p><strong>Died:</strong> {formatDate(data.death_date)}</p>
    )}
  </div>
  {(
  data.great_grandparents_names?.trim() ||
  data.grandparents_father_side?.trim() ||
  data.grandparents_mother_side?.trim() ||
  data.parents_names?.trim() ||
  data.siblings_names?.trim()
) && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">Family History</h2>

    <div className="mt-5 space-y-4 text-stone-700">
      {data.great_grandparents_names?.trim() && (
        <p className="whitespace-pre-line">
          <strong>Great Grandparents:</strong><br />
          {data.great_grandparents_names}
        </p>
      )}

      {data.grandparents_father_side?.trim() && (
        <p className="whitespace-pre-line">
          <strong>Grandparents — Father’s Side:</strong><br />
          {data.grandparents_father_side}
        </p>
      )}

      {data.grandparents_mother_side?.trim() && (
        <p className="whitespace-pre-line">
          <strong>Grandparents — Mother’s Side:</strong><br />
          {data.grandparents_mother_side}
        </p>
      )}

      {data.parents_names?.trim() && (
        <p className="whitespace-pre-line">
          <strong>Parents:</strong><br />
          {data.parents_names}
        </p>
      )}

      {data.siblings_names?.trim() && (
        <p className="whitespace-pre-line">
          <strong>Siblings:</strong><br />
          {data.siblings_names}
        </p>
      )}
      {data.children_names && (
  <div>
    <h3 className="font-semibold text-stone-800">
      Children
    </h3>
    <p className="mt-1 whitespace-pre-line text-stone-700">
      {data.children_names}
    </p>
  </div>
)}

{data.grandchildren_names && (
  <div>
    <h3 className="font-semibold text-stone-800">
      Grandchildren
    </h3>
    <p className="mt-1 whitespace-pre-line text-stone-700">
      {data.grandchildren_names}
    </p>
  </div>
)}
    </div>
  </section>
)}
</section>
{data.places_lived?.trim() && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowPlacesLived((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Places Lived
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showPlacesLived ? "▲" : "▼"}
      </span>
    </button>

    {showPlacesLived && (
      <div className="mt-5 whitespace-pre-line text-stone-700">
      {data.places_lived}
      </div>
    )}
  </section>
)}
{(
  data.social_link_1 ||
  data.social_link_2 ||
  data.social_link_3 ||
  data.social_link_4 ||
  data.social_link_5
) && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowSocialMedia((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Social Media
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showSocialMedia ? "▲" : "▼"}
      </span>
    </button>

    {showSocialMedia && (
      <div className="mt-5 flex flex-col gap-3">
      {data.social_link_1 && (
        <a
          href={data.social_link_1.startsWith("http")
            ? data.social_link_1
            : `https://${data.social_link_1}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          Social Media Link 1
        </a>
      )}

      {data.social_link_2 && (
        <a
          href={data.social_link_2.startsWith("http")
            ? data.social_link_2
            : `https://${data.social_link_2}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          Social Media Link 2
        </a>
      )}

      {data.social_link_3 && (
        <a
          href={data.social_link_3.startsWith("http")
            ? data.social_link_3
            : `https://${data.social_link_3}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          Social Media Link 3
        </a>
      )}

      {data.social_link_4 && (
        <a
          href={data.social_link_4.startsWith("http")
            ? data.social_link_4
            : `https://${data.social_link_4}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          Social Media Link 4
        </a>
      )}

      {data.social_link_5 && (
        <a
          href={data.social_link_5.startsWith("http")
            ? data.social_link_5
            : `https://${data.social_link_5}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          Social Media Link 5
        </a>
      )}
      </div>
    )}
  </section>
)}
{(data.schools_attended || data.awards_won) && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowSchoolsAwards((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Schools and Awards
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showSchoolsAwards ? "▲" : "▼"}
      </span>
    </button>

    {showSchoolsAwards && (
      <div className="mt-5 space-y-3 text-stone-700">
      {data.schools_attended && (
        <p><strong>Schools:</strong> {Array.isArray(data.schools_attended) ? data.schools_attended.join(", ") : data.schools_attended}</p>
      )}
      {data.awards_won && (
        <p><strong>Awards:</strong> {Array.isArray(data.awards_won) ? data.awards_won.join(", ") : data.awards_won}</p>
      )}
      </div>
    )}
  </section>
)}

{data.life_story?.trim() && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
  Life Story
</h2>
    <p className="mt-4 whitespace-pre-line text-stone-700">{data.life_story}</p>
  </section>


)}
{combinedGalleryPhotos.length > 0 && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowPhotoGallery((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Photo Gallery
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showPhotoGallery ? "▲" : "▼"}
      </span>
    </button>

    {showPhotoGallery && (
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {combinedGalleryPhotos.map((photo, index) => (
        <div
          key={`${photo}-${index}`}
          className="rounded-3xl border border-stone-200 bg-stone-50 p-3 shadow-sm"
        >
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(index)}
            className="block w-full overflow-hidden rounded-3xl"
          >
            <img
              src={photo.src}
              alt={`Gallery photo ${index + 1}`}
              className="w-full rounded-3xl object-cover shadow-md transition duration-300 hover:scale-[1.02]"
            />
          </button>

          {photo.attribution && (
  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
    {photo.attribution}
  </p>
)}

{photo.note && (
  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
    {photo.note}
  </p>
)}
        </div>
      ))}
          </div>
    )}
  </section>
)}
{newspaperArticles.length > 0 && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowNewspaperArticles((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Newspaper Articles
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showNewspaperArticles ? "▲" : "▼"}
      </span>
    </button>

    {showNewspaperArticles && (
      <div className="mt-5 space-y-3">
      {newspaperArticles.map((article, index) => (
        <a
          key={`${article}-${index}`}
          href={article}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          View Newspaper Article {index + 1}
        </a>
      ))}
      </div>
    )}
  </section>
)}

{videoUrls.length > 0 && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowMemorialVideos((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Memorial Videos
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showMemorialVideos ? "▲" : "▼"}
      </span>
    </button>

    {showMemorialVideos && (
  <div className="mt-5 grid gap-4 md:grid-cols-2">
    {videoUrls.map((videoId, index) => (
      <div
        key={`${videoId}-${index}`}
        className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 p-5 shadow-sm"
      >
        <p className="mb-4 text-sm font-semibold text-stone-700">
          Memorial Video {index + 1}
        </p>

        {showMemorialVideos === true &&
        currentSongIndex === index + 1000 ? (
          <MuxPlayer
            playbackId={videoId}
            streamType="on-demand"
            className="aspect-video w-full rounded-xl bg-black"
            onPlay={(event) => {
              const currentPlayer =
                event.currentTarget as HTMLElement & {
                  pause?: () => void;
                };

              document
                .querySelectorAll("mux-player")
                .forEach((player) => {
                  if (player !== currentPlayer) {
                    try {
                      (
                        player as HTMLElement & {
                          pause?: () => void;
                        }
                      ).pause?.();
                    } catch {}
                  }
                });

              pauseBackgroundMusicForVideo();
            }}
            onPause={resumeBackgroundMusicAfterVideo}
            onEnded={resumeBackgroundMusicAfterVideo}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCurrentSongIndex(index + 1000)}
            className="flex aspect-video w-full items-center justify-center rounded-xl bg-stone-200 text-sm font-semibold text-stone-700 transition hover:bg-stone-300"
          >
            ▶ Load & Play Video
          </button>
        )}
      </div>
    ))}
  </div>
)}
  </section>
)}



{(data.headstone_photo_1 || data.headstone_photo_2) && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <button
      type="button"
      onClick={() => setShowHeadstonePhotos((current) => !current)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        Headstone Photos
      </h2>

      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
        {showHeadstonePhotos ? "▲" : "▼"}
      </span>
    </button>

    {showHeadstonePhotos && (
      <div className="mt-5 grid gap-4 md:grid-cols-2">
      {data.headstone_photo_1 && <img src={data.headstone_photo_1} alt="Headstone photo 1" className="w-full rounded-2xl object-cover shadow-sm" />}
      {data.headstone_photo_2 && <img src={data.headstone_photo_2} alt="Headstone photo 2" className="w-full rounded-2xl object-cover shadow-sm" />}
      </div>
    )}
  </section>
)}

{approvedSubmissions.length > 0 && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <div>
  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
    Shared By Family & Friends
  </p>

  <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
    Memories, Stories & Contributions
  </h2>

  <p className="mt-3 text-sm leading-6 text-stone-600">
    These memories were submitted by visitors and approved by the memorial owner.
  </p>
</div>

    <div className="mt-5 space-y-4">
      {approvedSubmissions.map((submission) => (
        <div
  key={submission.id}
  className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4 shadow-sm"
>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
  <div>
    <p className="text-base font-semibold text-stone-900">
      {submission.submitter_name || "Anonymous Visitor"}
    </p>

    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">
      Shared Memory
    </p>
  </div>

  {submission.created_at && (
    <p className="text-xs text-stone-500">
      {new Date(submission.created_at).toLocaleDateString()}
    </p>
  )}
</div>

           
          

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700">
            {submission.message}
          </p>
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

  submittedVideos = submittedVideos.filter(Boolean);

  if (submittedVideos.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {submittedVideos.map((playbackId, index) => (
        <div
          key={`${playbackId}-${index}`}
          className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 p-5 shadow-sm"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-stone-700">
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
    
        </div>
      ))}
    </div>
    <p className="mt-8 border-t border-stone-200 pt-5 text-center text-sm italic text-stone-500">
  Every shared memory helps preserve this life for future generations.
</p>
  </section>
)}
  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
    Help Preserve This Memory
  </p>

  <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
    Share a Story, Photo, or Remembrance
  </h2>

  <p className="mt-3 text-sm leading-6 text-stone-700">
    Did you know this person? Your memories, stories, corrections, or photos can help preserve their life for family, friends, and future generations.
  </p>

  <p className="mt-1 text-xs text-stone-600">
    Contributions are reviewed by the memorial owner before appearing publicly.
  </p>

  {submissionSuccess ? (
    <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
      Thank you. Your contribution has been submitted for review.
    </div>
  ) : (
    <div className="mt-5 space-y-3">
      <input
        type="text"
        placeholder="Your Name (optional)"
        value={submitterName}
        onChange={(e) => setSubmitterName(e.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
      />

      <input
        type="email"
        placeholder="Your Email (optional)"
        value={submitterEmail}
        onChange={(e) => setSubmitterEmail(e.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
      />

     <textarea
  placeholder="Share a memory, story, correction, or information..."
  value={submissionMessage}
  onChange={(e) => setSubmissionMessage(e.target.value)}
  rows={5}
  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
/>
<div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3">
  <label className="block text-sm font-semibold text-stone-800">
    Add Photos (optional)
  </label>

  <p className="mt-1 text-xs text-stone-500">
    You may upload photos for the memorial owner to review before they appear publicly.
  </p>

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files || []);
      setSubmissionPhotos(files);
    }}
    className="mt-4 block w-full text-sm text-stone-700"
  />

  {submissionPhotos.length > 0 && (
    <p className="mt-3 text-xs text-stone-600">
      {submissionPhotos.length} photo{submissionPhotos.length === 1 ? "" : "s"} selected
    </p>
  )}
</div>
<div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
  <label className="block text-sm font-semibold text-stone-800">
    Add a Video (optional)
  </label>

  <p className="mt-1 text-xs text-stone-500">
    You may submit one video for the memorial owner to review before it appears publicly.
  </p>

  <input
    type="file"
    accept="video/*"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;
      setSubmissionVideo(file);
    }}
    className="mt-3 block w-full text-sm text-stone-700"
  />

  {submissionVideo && (
    <p className="mt-3 text-xs text-stone-600">
      Selected video: {submissionVideo.name}
    </p>
  )}
</div>
      <button
        onClick={handleContributionSubmit}
        disabled={isSubmittingContribution || uploadingPhotos || uploadingVideo}
        className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {isSubmittingContribution || uploadingPhotos || uploadingVideo
  ? "Submitting..."
  : "Submit Contribution"}
      </button>
    </div>
  )}
  
</section>   
{(data.obituary || data.obituary_url) && (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">Obituary</h2>
    {data.obituary && <p className="mt-4 whitespace-pre-line text-stone-700">{data.obituary}</p>}
    {data.obituary_url && (
      <a href={data.obituary_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700">
        View Full Obituary
      </a>
    )}
  </section>
)}     
        {hasFinalRestingPlace ? (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Final Resting Place
    </h2>

    <div className="mt-5 space-y-4 text-stone-700">
      {isBuried && (
        <p><strong>Disposition:</strong> Buried</p>
      )}
      {isCremated && (
        <p><strong>Disposition:</strong> Cremated</p>
      )}
      {data.cemetery_name?.trim() && (
  <div>
    <p>
      <strong>Cemetery Name:</strong> {data.cemetery_name}
    </p>

    {restingPlaceAddress && (
      <p className="mt-1 text-sm text-stone-600">
        {restingPlaceAddress}
      </p>
    )}
  </div>
)}

{data.grave_section?.trim() && (
  <p>
    <strong>Section:</strong> {data.grave_section}
  </p>
)}

{data.grave_row?.trim() && (
  <p>
    <strong>Row:</strong> {data.grave_row}
  </p>
)}

{data.grave_plot?.trim() && (
  <p>
    <strong>Plot:</strong> {data.grave_plot}
  </p>
)}
    </div>
{data.updated_at && (
  <div className="pb-4 pt-2 text-center text-xs text-stone-500">
    Last updated{" "}
    {new Date(data.updated_at).toLocaleDateString()}
  </div>
)}
<div className="mt-6 border-t border-stone-200 pt-5 text-center">
  <button
    type="button"
    onClick={() => {
      window.location.href =
        "mailto:help@myememorial.com?subject=" +
        encodeURIComponent(
          `Report Memorial: ${data.full_name || "Unknown Memorial"}`
        ) +
        "&body=" +
        encodeURIComponent(
          `Please describe the issue with this memorial page:\n\n${window.location.href}`
        );
    }}
    className="text-xs font-medium text-stone-500 underline hover:text-stone-700"
  >
    Report this memorial
  </button>
</div>
    

    {hasGraveMap && (
      <div className="mt-6 overflow-hidden rounded-2xl">
        <GraveLocationMap
          lat={graveLat}
          lng={graveLng}
          readOnly={true}
          height="420px"
        />
      </div>
    )}
  </section>
) : (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Final Resting Place
    </h2>
{data.updated_at && (
  <div className="mt-4 text-center text-xs text-stone-500">
    Last updated{" "}
    {new Date(data.updated_at).toLocaleDateString()}
  </div>
)}
    
  </section>
  
)}
          

        
          </div>

     
  </div>
  {contributorPhotoViewer && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
    onClick={() => setContributorPhotoViewer(null)}
  >
    <button
      type="button"
      onClick={() => setContributorPhotoViewer(null)}
      className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow"
    >
      Close
    </button>

    <div
      className="max-h-[92vh] max-w-[95vw] overflow-auto rounded-3xl bg-white p-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={contributorPhotoViewer.photos[contributorPhotoViewer.index]}
        alt="Contributor photo"
        className="max-h-[75vh] max-w-full rounded-2xl object-contain"
      />

      {contributorPhotoViewer.photos.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setContributorPhotoViewer((prev) =>
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
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 sm:text-sm"
          >
            ← Previous
          </button>

          <p className="text-sm text-stone-500">
            {contributorPhotoViewer.index + 1} of{" "}
            {contributorPhotoViewer.photos.length}
          </p>

          <button
            type="button"
            onClick={() =>
              setContributorPhotoViewer((prev) =>
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
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 sm:text-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  </div>
)}
  {selectedPhoto && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
    onClick={() => setSelectedPhotoIndex(null)}
  >
    <button
      type="button"
      onClick={() => setSelectedPhotoIndex(null)}
      className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow"
    >
      Close
    </button>

    <div
  className="max-h-[92vh] max-w-[95vw] overflow-auto rounded-3xl bg-white p-4 shadow-2xl"
  onClick={(e) => e.stopPropagation()}
  onTouchStart={(e) => {
    touchStartXRef.current = e.touches[0].clientX;
  }}
  onTouchEnd={(e) => {
    if (touchStartXRef.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const difference = touchStartXRef.current - touchEndX;

    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        showNextPhoto();
      } else {
        showPreviousPhoto();
      }
    }

    touchStartXRef.current = null;
  }}
>
    
      <img
  key={photoFadeKey}
  src={selectedPhoto}
  alt="Enlarged memorial photo"
  className="max-h-[75vh] max-w-full rounded-2xl object-contain opacity-100 transition-opacity duration-500"
/>
{selectedPhotoAttribution && (
  <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
    {selectedPhotoAttribution}
  </p>
)}
{canGoPrevious && canGoNext && (
  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-between">
    <button
      type="button"
      onClick={showPreviousPhoto}
      className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 sm:text-sm"
    >
      ← Previous
    </button>

    <p className="text-sm text-stone-500">
      {(selectedPhotoIndex ?? 0) + 1} of {galleryPhotos.length}
    </p>

    <button
      type="button"
      onClick={showNextPhoto}
      className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 sm:text-sm"
    >
      Next →
    </button>
    <div className="mt-4 text-center">
  <button
    type="button"
    onClick={() => setIsSlideshowPlaying((current) => !current)}
   className="rounded-full bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-300 sm:text-sm"
  >
    {isSlideshowPlaying ? "Pause Slideshow" : "Start Slideshow"}
  </button>
</div>
  </div>
)}
{isOwner && selectedPhoto && (
  <div className="mt-4 text-center">
    <button
      type="button"
      onClick={async () => {
        const { error } = await supabase
          .from("memorials")
          .update({ featured_photo_url: selectedPhoto })
          .eq("id", data.id);

        if (error) {
          console.error(error);
          alert("Could not set featured photo.");
          return;
        }

        setData({
          ...data,
          featured_photo_url: selectedPhoto,
        });

        alert("Featured photo updated.");
      }}
      className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-300"
    >
      ⭐ Make Featured Photo
    </button>
  </div>
)}
      {selectedPhotoNote && (
        <p className="mt-4 whitespace-pre-line text-center text-sm leading-6 text-stone-700">
          {selectedPhotoNote}
        </p>
      )}
    </div>
  </div>
)}
</main>
);
}