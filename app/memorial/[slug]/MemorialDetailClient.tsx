"use client";
import { optimizeImage } from "../../lib/optimizeImage";
import MuxPlayer from "@mux/mux-player-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import dynamic from "next/dynamic";
import SideAd from "../../components/SideAd";
import PublicMemorialNav from "../../components/memorial-builder/PublicMemorialNav";
import MobileAd from "../../components/MobileAd";
import { QRCodeSVG } from "qrcode.react";
const GraveLocationMap = dynamic(
  () => import("../../components/GraveLocationMap"),
  { ssr: false }
);
type MemorialVideo = {
  id: number;
 memorial_id: number;
  playback_id: string;
  duration_seconds: number;
  note: string | null;
  sort_order: number;
  original_filename: string | null;
  file_size: number | null;
  processing_status: string | null;
  
  created_at: string;
};
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
  obituary_image_url?: string | null;
  life_story?: string;
great_grandparents_names?: string;
grandparents_father_side?: string;
grandparents_mother_side?: string;
parents_names?: string;
siblings_names?: string;
spouse_names?: string | null;
children_names?: string | null;
grandchildren_names?: string | null;
great_grandchildren_names?: string | null;
  final_resting_type?: string;
  cemetery_name?: string;
  grave_section?: string;
  grave_row?: string;
  grave_plot?: string;
  ashes_location_description?: string;
is_living_preplan?: boolean;
    places_lived?: string;
    places_worked?: string;
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
  banner_photo_url?: string | null;
  banner_position_x?: number | string | null;
  banner_position_y?: number | string | null;
  headstone_photo_1?: string;
  headstone_photo_2?: string;
  gallery_photos?: string | string[];
gallery_photo_captions?: string[] | null;
  video_link_urls?: string[] | null;
video_link_notes?: string[] | null;
video_link_thumbnail_urls?: string[] | null;
  newspaper_articles?: string | string[];
  video_urls?: string | string[];
video_notes?: string[] | null;
memorial_videos?: MemorialVideo[];
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
  photo_urls: string[] | string | null;
  video_urls?: string | string[];
video_notes?: string[] | null;
memorial_videos?: MemorialVideo[];
  
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

function parseUrlList(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || trimmed === "null" || trimmed === "[]") return [];

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) return parsed.filter(Boolean);

      if (typeof parsed === "string" && parsed.trim()) {
        return [parsed.trim()];
      }

      return [];
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getVideoUrls(value: string | string[] | null | undefined): string[] {
  return parseUrlList(value).filter((videoId) => videoId.length > 15);
}
function getFacebookEmbedUrl(url: string) {
  if (!url.includes("facebook.com") && !url.includes("fb.watch")) {
    return "";
  }

  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    url
  )}&show_text=false&width=734`;
}
function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url.trim());
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (hostname === "youtu.be") {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    ) {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v") ?? "";
      } else {
        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

        if (
          pathParts[0] === "shorts" ||
          pathParts[0] === "embed" ||
          pathParts[0] === "live"
        ) {
          videoId = pathParts[1] ?? "";
        }
      }
    }

    return videoId;
  } catch {
    return "";
  }
}

function getYouTubeEmbedUrl(url: string) {
  const videoId = getYouTubeVideoId(url);

  return videoId
    ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
    : "";
}

let youtubeIframeApiPromise: Promise<any> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube player requires a browser."));
  }

  const existingYouTubeApi = (window as any).YT;

  if (existingYouTubeApi?.Player) {
    return Promise.resolve(existingYouTubeApi);
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise;
  }

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const existingReadyHandler = (window as any).onYouTubeIframeAPIReady;

    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof existingReadyHandler === "function") {
        existingReadyHandler();
      }

      const youtubeApi = (window as any).YT;

      if (youtubeApi?.Player) {
        resolve(youtubeApi);
      } else {
        reject(new Error("YouTube player API did not initialize."));
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        youtubeIframeApiPromise = null;
        reject(new Error("Could not load the YouTube player API."));
      };
      document.head.appendChild(script);
    }
  });

  return youtubeIframeApiPromise;
}
function VideoLinkPreview({
  url,
  index,
}: {
  url: string;
  index: number;
}) {
  const [previewImage, setPreviewImage] = useState("");
  const [previewChecked, setPreviewChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const response = await fetch(
          `/api/video-link-preview?url=${encodeURIComponent(url)}`
        );

        const result = await response.json();

        if (!cancelled && result?.imageUrl) {
          setPreviewImage(result.imageUrl);
        }
      } catch (error) {
        console.error("VIDEO LINK PREVIEW LOAD ERROR:", error);
      } finally {
        if (!cancelled) {
          setPreviewChecked(true);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (previewImage) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-stone-200"
        aria-label={`Open video link ${index + 1}`}
      >
        <img
          src={previewImage}
          alt={`Video link ${index + 1} preview`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
          <div className="rounded-full bg-black/70 px-5 py-4 text-2xl text-white shadow-lg">
            ▶
          </div>
        </div>
      </a>
    );
  }

  if (!previewChecked) {
    return (
      <div className="aspect-video w-full animate-pulse rounded-xl bg-stone-200" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
    >
      Watch Video
    </a>
  );
}
function formatDate(value?: string) {
  if (!value) return "-";

  const parts = value.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  }

  return value;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
function FamilyTreeCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-amber-300 bg-amber-50"
          : "border-stone-200 bg-stone-50"
      }`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h3>
      <p className="mt-2 whitespace-pre-line text-base text-stone-800">
        {value}
      </p>
    </div>
  );
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

const SAMPLE_MEMORIAL_ID = 149;

const [error, setError] = useState("");
  const [data, setData] = useState<Memorial | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
const [showFavoriteSongs, setShowFavoriteSongs] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showMemorialVideos, setShowMemorialVideos] = useState(false);
  const [showSharedMemories, setShowSharedMemories] = useState(false);
  const [showHeadstonePhotos, setShowHeadstonePhotos] = useState(false);
  const [showNewspaperArticles, setShowNewspaperArticles] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [showSchoolsAwards, setShowSchoolsAwards] = useState(false);
  const [showPlacesLived, setShowPlacesLived] = useState(false);
  const [showPlacesWorked, setShowPlacesWorked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wasMusicPlayingBeforeVideo, setWasMusicPlayingBeforeVideo] = useState(false);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const songAudioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const youtubePlayerRef = useRef<any>(null);
  const youtubePlayerHostRef = useRef<HTMLDivElement | null>(null);
  const favoriteSongsRef = useRef<string[]>([]);
  const isSlideshowPlayingRef = useRef(false);
  const presentationHasStartedRef = useRef(false);
  const currentSongIndexRef = useRef(0);
  const wasMusicPlayingBeforeVideoRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [slideshowMusicVolume, setSlideshowMusicVolume] = useState(0.7);
const [isSlideshowMusicMuted, setIsSlideshowMusicMuted] = useState(false);
const [presentationHasStarted, setPresentationHasStarted] = useState(false);
const [copied, setCopied] = useState(false);
const [submitterName, setSubmitterName] = useState("");
const [submitterEmail, setSubmitterEmail] = useState("");
const [submissionMessage, setSubmissionMessage] = useState("");
const [submissionPhotos, setSubmissionPhotos] = useState<File[]>([]);
const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
const [photoFadeKey, setPhotoFadeKey] = useState(0);
const [displayedPhoto, setDisplayedPhoto] = useState<string | null>(null);
const [previousDisplayedPhoto, setPreviousDisplayedPhoto] =
  useState<string | null>(null);

const displayedPhotoRef = useRef<string | null>(null);
const crossFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
  null
);
const [submissionVideo, setSubmissionVideo] = useState<File | null>(null);
const [uploadingVideo, setUploadingVideo] = useState(false);
const [uploadingPhotos, setUploadingPhotos] = useState(false);
const [submissionSuccess, setSubmissionSuccess] = useState(false);
const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
const [showQrCode, setShowQrCode] = useState(false);
const [approvedSubmissions, setApprovedSubmissions] = useState<
  ApprovedSubmission[]
>([]);
const [contributorPhotoViewer, setContributorPhotoViewer] = useState<{
  photos: string[];
  index: number;
} | null>(null);
const [mainNavHeight, setMainNavHeight] = useState(0);
const [publicNavHeight, setPublicNavHeight] = useState(0);
const [activePublicSection, setActivePublicSection] = useState<string | null>(null);

useEffect(() => {
  const mainNav = document.querySelector<HTMLElement>("header.sticky");

  if (!mainNav) {
    setMainNavHeight(0);
    return;
  }

  const updateMainNavHeight = () => {
    setMainNavHeight(Math.ceil(mainNav.getBoundingClientRect().height));
  };

  updateMainNavHeight();

  const resizeObserver = new ResizeObserver(updateMainNavHeight);
  resizeObserver.observe(mainNav);
  window.addEventListener("resize", updateMainNavHeight);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener("resize", updateMainNavHeight);
  };
}, []);

useEffect(() => {
  if (!data?.id) {
    setPublicNavHeight(0);
    return;
  }

  const navHost = document.getElementById("public-memorial-nav");

  if (!navHost) {
    setPublicNavHeight(0);
    return;
  }

  const updatePublicNavHeight = () => {
    setPublicNavHeight(Math.ceil(navHost.getBoundingClientRect().height));
  };

  updatePublicNavHeight();

  const resizeObserver = new ResizeObserver(updatePublicNavHeight);
  resizeObserver.observe(navHost);
  window.addEventListener("resize", updatePublicNavHeight);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener("resize", updatePublicNavHeight);
  };
}, [data?.id]);

function handlePublicSectionSelect(sectionId: string) {
  // Public icon navigation should be a one-click action: if a destination
  // section is collapsed, open it before scrolling the visitor to it.
  switch (sectionId) {
    case "newspaper-articles":
      setShowNewspaperArticles(true);
      break;
    case "favorite-songs":
      setShowFavoriteSongs(true);
      break;
    case "social-media":
      setShowSocialMedia(true);
      break;
    case "photo-gallery":
      setShowPhotoGallery(true);
      break;
    case "video-memories":
      setShowMemorialVideos(true);
      break;
    case "family-and-friends":
      setShowSharedMemories(true);
      break;
    default:
      break;
  }

  setActivePublicSection(sectionId);

  window.setTimeout(() => {
    const target = document.getElementById(`public-${sectionId}`);

    if (!target) {
      return;
    }

    const navHost = document.getElementById("public-memorial-nav");
    const measuredPublicNavHeight =
      navHost?.getBoundingClientRect().height ?? publicNavHeight;
    const stickyOffset =
      mainNavHeight + measuredPublicNavHeight + 12;
    const targetTop =
      window.scrollY + target.getBoundingClientRect().top - stickyOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }, 0);
}
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
        console.log(
  "PUBLIC MEMORIAL RAW DATA:",
  JSON.stringify(
    {
      slug,
      id: memorialData?.id,
      full_name: memorialData?.full_name,
      newspaper_articles: memorialData?.newspaper_articles,
      error,
    },
    null,
    2
  )
);
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
      if (!memorialData) {
  setError("Memorial not found.");
  setData(null);
  setLoading(false);
  return;
}

      let memorialVideosData: MemorialVideo[] = [];

if (memorialData?.id) {
  const { data: videosData, error: videosError } = await supabase
    .from("memorial_videos")
    .select(
      "id, memorial_id, playback_id, duration_seconds, note, sort_order, original_filename, file_size, processing_status, created_at"
    )
    .eq("memorial_id", memorialData.id)
    .order("sort_order", { ascending: true });

  if (videosError) {
    console.error("LOAD MEMORIAL VIDEOS ERROR:", videosError);
  } else {
    memorialVideosData = (videosData as MemorialVideo[]) || [];
  }
}

setData({
  ...(memorialData as Memorial),
  memorial_videos: memorialVideosData,
});
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

const memorialVideos = useMemo(
  () =>
    Array.isArray(data?.memorial_videos)
      ? [...data.memorial_videos].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
      : [],
  [data?.memorial_videos]
);

const legacyVideoUrls = useMemo(
  () => getVideoUrls(data?.video_urls),
  [data?.video_urls]
);

// Guided Builder saves persist Mux playback IDs on memorials.video_urls,
// while completed/older flows can also have structured rows in memorial_videos.
// Merge both sources and de-duplicate by playback ID so every saved owner video
// is available on the public memorial regardless of which save path created it.
const publicMemorialVideos = useMemo<MemorialVideo[]>(() => {
  const structuredVideos = memorialVideos;
  const seenPlaybackIds = new Set(
    structuredVideos.map((video) => video.playback_id).filter(Boolean)
  );

  const legacyVideos = legacyVideoUrls
    .map((playbackId, originalIndex) => ({ playbackId, originalIndex }))
    .filter(({ playbackId }) => !seenPlaybackIds.has(playbackId))
    .map(({ playbackId, originalIndex }, publicIndex) => ({
      id: -(publicIndex + 1),
      memorial_id: data?.id ?? 0,
      playback_id: playbackId,
      duration_seconds: 0,
      note: data?.video_notes?.[originalIndex] ?? null,
      sort_order: structuredVideos.length + publicIndex,
      original_filename: null,
      file_size: null,
      processing_status: "ready",
      created_at: data?.updated_at ?? "",
    }));

  return [...structuredVideos, ...legacyVideos];
}, [
  memorialVideos,
  legacyVideoUrls,
  data?.id,
  data?.video_notes,
  data?.updated_at,
]);

const videoLinkUrls = useMemo(
  () =>
    Array.isArray(data?.video_link_urls)
      ? data.video_link_urls.filter(Boolean)
      : [],
  [data?.video_link_urls]
);

const videoLinkNotes = useMemo(
  () =>
    Array.isArray(data?.video_link_notes)
      ? data.video_link_notes
      : [],
  [data?.video_link_notes]
);

const videoLinkThumbnailUrls = useMemo(
  () =>
    Array.isArray(data?.video_link_thumbnail_urls)
      ? data.video_link_thumbnail_urls
      : [],
  [data?.video_link_thumbnail_urls]
);

const favoriteSongs = useMemo(() => {
  const urls =
    Array.isArray(data?.favorite_song_urls) &&
    data.favorite_song_urls.length > 0
      ? data.favorite_song_urls
      : data?.favorite_song_url
        ? [data.favorite_song_url]
        : [];

  return urls
    .map((song) => song?.trim())
    .filter((song): song is string => Boolean(song));
}, [data?.favorite_song_urls, data?.favorite_song_url]);

useEffect(() => {
  favoriteSongsRef.current = favoriteSongs;
}, [favoriteSongs]);

useEffect(() => {
  isSlideshowPlayingRef.current = isSlideshowPlaying;
}, [isSlideshowPlaying]);

useEffect(() => {
  presentationHasStartedRef.current = presentationHasStarted;
}, [presentationHasStarted]);

useEffect(() => {
  currentSongIndexRef.current = currentSongIndex;
}, [currentSongIndex]);

const currentFavoriteSong = favoriteSongs[currentSongIndex] ?? "";
const currentYouTubeVideoId = getYouTubeVideoId(currentFavoriteSong);
const combinedGalleryPhotos = useMemo(() => {
  return galleryPhotos.map((photoUrl, index) => ({
    src: photoUrl,
    note: data?.gallery_photo_captions?.[index] ?? "",
    attribution: "",
  }));
}, [galleryPhotos, data?.gallery_photo_captions]);

useEffect(() => {
  const nextPhoto =
    selectedPhotoIndex !== null
      ? combinedGalleryPhotos[selectedPhotoIndex]?.src ?? null
      : null;

  if (!nextPhoto) {
    displayedPhotoRef.current = null;
    setDisplayedPhoto(null);
    setPreviousDisplayedPhoto(null);
    return;
  }

  const currentPhoto = displayedPhotoRef.current;

  if (!currentPhoto) {
    displayedPhotoRef.current = nextPhoto;
    setDisplayedPhoto(nextPhoto);
    return;
  }

  if (currentPhoto === nextPhoto) {
    return;
  }

  setPreviousDisplayedPhoto(currentPhoto);
  setDisplayedPhoto(nextPhoto);
  displayedPhotoRef.current = nextPhoto;

  if (crossFadeTimeoutRef.current) {
    clearTimeout(crossFadeTimeoutRef.current);
  }

  crossFadeTimeoutRef.current = setTimeout(() => {
    setPreviousDisplayedPhoto(null);
  }, 1000);
}, [selectedPhotoIndex, combinedGalleryPhotos]);

useEffect(() => {
  return () => {
    if (crossFadeTimeoutRef.current) {
      clearTimeout(crossFadeTimeoutRef.current);
    }
  };
}, []);

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

  function applyYouTubePlayerSound(player: any) {
    if (!player) return;

    try {
      player.setVolume?.(Math.round(slideshowMusicVolume * 100));

      if (isSlideshowMusicMuted) {
        player.mute?.();
      } else {
        player.unMute?.();
      }
    } catch (error) {
      console.error("Could not update YouTube slideshow sound:", error);
    }
  }

  function pauseUploadedFavoriteSongs(reset = false) {
    songAudioRefs.current.forEach((audio) => {
      if (!audio) return;

      audio.pause();

      if (reset) {
        audio.currentTime = 0;
      }
    });
  }

  function pauseYouTubeFavoriteSong(reset = false) {
    const player = youtubePlayerRef.current;

    if (!player) return;

    try {
      if (reset) {
        player.stopVideo?.();
      } else {
        player.pauseVideo?.();
      }
    } catch (error) {
      console.error("Could not pause YouTube favorite song:", error);
    }
  }

  function advanceFavoriteSong() {
    const songs = favoriteSongsRef.current;

    if (songs.length === 0) {
      return;
    }

    setCurrentSongIndex((currentIndex) => {
      const nextIndex =
        currentIndex >= songs.length - 1 ? 0 : currentIndex + 1;

      currentSongIndexRef.current = nextIndex;
      return nextIndex;
    });
  }

  function playUploadedFavoriteSong(index: number, restart = false) {
    const audio = songAudioRefs.current[index];

    if (!audio) {
      return;
    }

    pauseYouTubeFavoriteSong(false);

    songAudioRefs.current.forEach((candidateAudio, candidateIndex) => {
      if (!candidateAudio || candidateIndex === index) return;
      candidateAudio.pause();
    });

    backgroundAudioRef.current = audio;
    audio.volume = slideshowMusicVolume;
    audio.muted = isSlideshowMusicMuted;

    if (restart) {
      audio.currentTime = 0;
    }

    audio.play().catch((error) => {
      console.error("Could not play favorite song:", error);
    });
  }

  function stopFavoriteSongPlayback(reset = false) {
    pauseUploadedFavoriteSongs(reset);
    pauseYouTubeFavoriteSong(reset);
  }

  function pauseBackgroundMusicForVideo() {
    const currentSong =
      favoriteSongsRef.current[currentSongIndexRef.current] ?? "";
    const currentYouTubeId = getYouTubeVideoId(currentSong);
    let wasPlaying = false;

    if (currentYouTubeId && youtubePlayerRef.current) {
      try {
        const playerState = youtubePlayerRef.current.getPlayerState?.();
        wasPlaying = playerState === 1;

        if (wasPlaying) {
          youtubePlayerRef.current.pauseVideo?.();
        }
      } catch (error) {
        console.error("Could not pause YouTube song for memorial video:", error);
      }
    } else {
      const audio =
        songAudioRefs.current[currentSongIndexRef.current] ??
        backgroundAudioRef.current;

      if (audio) {
        wasPlaying = !audio.paused;

        if (wasPlaying) {
          audio.pause();
        }
      }
    }

    wasMusicPlayingBeforeVideoRef.current = wasPlaying;
    setWasMusicPlayingBeforeVideo(wasPlaying);
  }

  function resumeBackgroundMusicAfterVideo() {
    if (
      !wasMusicPlayingBeforeVideoRef.current &&
      !wasMusicPlayingBeforeVideo
    ) {
      return;
    }

    const currentSong =
      favoriteSongsRef.current[currentSongIndexRef.current] ?? "";
    const currentYouTubeId = getYouTubeVideoId(currentSong);

    if (currentYouTubeId && youtubePlayerRef.current) {
      try {
        applyYouTubePlayerSound(youtubePlayerRef.current);
        youtubePlayerRef.current.playVideo?.();
      } catch (error) {
        console.error("Could not resume YouTube favorite song:", error);
      }
    } else {
      playUploadedFavoriteSong(currentSongIndexRef.current, false);
    }

    wasMusicPlayingBeforeVideoRef.current = false;
    setWasMusicPlayingBeforeVideo(false);
  }

  useEffect(() => {
    return () => {
      stopFavoriteSongPlayback(true);

      try {
        youtubePlayerRef.current?.destroy?.();
      } catch {
        // The YouTube player may already have been removed by React.
      }

      youtubePlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selectedPhotoIndex !== null) return;

    if (presentationHasStartedRef.current) {
      setPresentationHasStarted(false);
      presentationHasStartedRef.current = false;
      setIsSlideshowPlaying(false);
      isSlideshowPlayingRef.current = false;
      stopFavoriteSongPlayback(true);
      setCurrentSongIndex(0);
      currentSongIndexRef.current = 0;
    }
  }, [selectedPhotoIndex]);

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

  useEffect(() => {
    songAudioRefs.current.forEach((audio) => {
      if (!audio) return;

      audio.volume = slideshowMusicVolume;
      audio.muted = isSlideshowMusicMuted;
    });

    applyYouTubePlayerSound(youtubePlayerRef.current);
  }, [slideshowMusicVolume, isSlideshowMusicMuted, currentSongIndex]);

  useEffect(() => {
    if (!presentationHasStarted || !currentYouTubeVideoId) {
      return;
    }

    const host = youtubePlayerHostRef.current;

    if (!host) {
      return;
    }

    let cancelled = false;
    let createdPlayer: any = null;

    loadYouTubeIframeApi()
      .then((youtubeApi) => {
        if (cancelled || !youtubePlayerHostRef.current) {
          return;
        }

        createdPlayer = new youtubeApi.Player(youtubePlayerHostRef.current, {
          width: "100%",
          height: "100%",
          videoId: currentYouTubeVideoId,
          playerVars: {
            autoplay: isSlideshowPlayingRef.current ? 1 : 0,
            controls: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;

              youtubePlayerRef.current = event.target;
              applyYouTubePlayerSound(event.target);

              if (isSlideshowPlayingRef.current) {
                event.target.playVideo?.();
              }
            },
            onStateChange: (event: any) => {
              if (
                event.data === youtubeApi.PlayerState?.ENDED &&
                isSlideshowPlayingRef.current
              ) {
                advanceFavoriteSong();
              }
            },
            onError: (event: any) => {
              console.error("YouTube favorite song playback error:", event.data);
            },
          },
        });

        youtubePlayerRef.current = createdPlayer;
      })
      .catch((error) => {
        console.error("Could not initialize YouTube favorite song:", error);
      });

    return () => {
      cancelled = true;

      try {
        createdPlayer?.destroy?.();
      } catch {
        // The player may already have been removed during a song change.
      }

      if (youtubePlayerRef.current === createdPlayer) {
        youtubePlayerRef.current = null;
      }
    };
  }, [presentationHasStarted, currentYouTubeVideoId]);

  useEffect(() => {
    if (!presentationHasStarted) {
      return;
    }

    const song = favoriteSongs[currentSongIndex] ?? "";

    if (!song) {
      stopFavoriteSongPlayback(false);
      return;
    }

    const youtubeVideoId = getYouTubeVideoId(song);

    if (!isSlideshowPlaying) {
      if (youtubeVideoId) {
        pauseYouTubeFavoriteSong(false);
      } else {
        songAudioRefs.current[currentSongIndex]?.pause();
      }

      return;
    }

    if (youtubeVideoId) {
      pauseUploadedFavoriteSongs(false);
      applyYouTubePlayerSound(youtubePlayerRef.current);
      youtubePlayerRef.current?.playVideo?.();
      return;
    }

    pauseYouTubeFavoriteSong(false);
    playUploadedFavoriteSong(currentSongIndex, false);
  }, [
    presentationHasStarted,
    isSlideshowPlaying,
    currentSongIndex,
    favoriteSongs,
  ]);

  function toggleSlideshowWithMusic() {
    if (isSlideshowPlaying) {
      setIsSlideshowPlaying(false);
      isSlideshowPlayingRef.current = false;
      stopFavoriteSongPlayback(false);
      return;
    }

    if (!presentationHasStarted) {
      setPresentationHasStarted(true);
      presentationHasStartedRef.current = true;
    }

    setIsSlideshowPlaying(true);
    isSlideshowPlayingRef.current = true;

    if (favoriteSongs.length === 0) {
      return;
    }

    const safeIndex =
      currentSongIndex >= 0 && currentSongIndex < favoriteSongs.length
        ? currentSongIndex
        : 0;

    if (safeIndex !== currentSongIndex) {
      setCurrentSongIndex(safeIndex);
      currentSongIndexRef.current = safeIndex;
    }

    const song = favoriteSongs[safeIndex];
    const youtubeVideoId = getYouTubeVideoId(song);

    if (!youtubeVideoId) {
      playUploadedFavoriteSong(safeIndex, false);
    } else if (youtubePlayerRef.current) {
      applyYouTubePlayerSound(youtubePlayerRef.current);
      youtubePlayerRef.current.playVideo?.();
    }
  }

  function handleExperienceTheirLife() {
    // The public CTA should immediately reveal the photo experience,
    // open the first photo, start/resume the presentation, and move the visitor to it.
    setShowPhotoGallery(true);
    setActivePublicSection("photo-gallery");

    // The slideshow timer only advances while a gallery photo is selected.
    // Starting from the top CTA therefore needs to open the first photo too.
    if (combinedGalleryPhotos.length > 0 && selectedPhotoIndex === null) {
      setSelectedPhotoIndex(0);
      setPhotoFadeKey((current) => current + 1);
    }

    if (!isSlideshowPlaying) {
      toggleSlideshowWithMusic();
    }

    window.setTimeout(() => {
      const target = document.getElementById("public-photo-gallery");

      if (!target) {
        return;
      }

      const navHost = document.getElementById("public-memorial-nav");
      const measuredPublicNavHeight =
        navHost?.getBoundingClientRect().height ?? publicNavHeight;
      const stickyOffset =
        mainNavHeight + measuredPublicNavHeight + 12;
      const targetTop =
        window.scrollY + target.getBoundingClientRect().top - stickyOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }, 0);
  }

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

  if (duration > 300) {
    throw new Error("Contributor videos must be 5 minutes or less.");
  }

  if (!data?.id) {
    throw new Error("Memorial information is unavailable. Please refresh and try again.");
  }

  const uploadRes = await fetch("/api/mux-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memorialId: data.id,
      uploadPurpose: "visitor_submission",
    }),
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

  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const playbackRes = await fetch("/api/mux-playback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadId,
        memorialId: data.id,
        uploadPurpose: "visitor_submission",
      }),
    });

    const playbackData = await playbackRes.json();

    if (playbackRes.ok && playbackData.playbackId) {
      return playbackData.playbackId;
    }

    if (playbackRes.status !== 202) {
      console.error("MUX PLAYBACK API ERROR:", playbackData);
      throw new Error(
        playbackData?.error ||
          "Could not finish preparing the video for playback."
      );
    }
  }

  throw new Error("Video processing is taking longer than expected. Please try again in a few minutes.");
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
  let optimizedPhoto: File;

  try {
    optimizedPhoto = await optimizeImage(photo);
  } catch (err) {
    console.error("PHOTO OPTIMIZATION FAILED", err);

    alert(
      err instanceof Error
        ? err.message
        : `"${photo.name}" could not be processed. Please try another photo.`
    );

    setUploadingPhotos(false);
    return;
  }

  if (optimizedPhoto.type !== "image/jpeg") {
    alert(
      `"${photo.name}" could not be converted to JPG. Please try saving it as a JPG or PNG and upload it again.`
    );

    setUploadingPhotos(false);
    return;
  }

const fileName = `${Date.now()}-${Math.random()
  .toString(36)
  .substring(2)}.jpg`;

const filePath = `submission-photos/${fileName}`;

const { error: uploadError } = await supabase.storage
  .from("memorial-media")
  .upload(filePath, optimizedPhoto, {
    contentType: "image/jpeg",
  });

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
  throw new Error(result.error || "Could not submit your memory.");
}

    setSubmissionSuccess(true);
    setSubmitterName("");
    setSubmitterEmail("");
    setSubmissionMessage("");
    setSubmissionPhotos([]);
    setSubmissionVideo(null);

    // After the long form collapses into the short success message,
    // return the visitor to this section so the confirmation stays visible.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById("help-preserve-this-memory");

        if (!target) return;

        const navHost = document.getElementById("public-memorial-nav");
        const measuredPublicNavHeight =
          navHost?.getBoundingClientRect().height ?? publicNavHeight;
        const stickyOffset = mainNavHeight + measuredPublicNavHeight + 12;
        const targetTop =
          window.scrollY + target.getBoundingClientRect().top - stickyOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth",
        });
      });
    });
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
  const isSampleMemorial =
  data.id === SAMPLE_MEMORIAL_ID;
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

const bannerUrl =
  data.banner_photo_url?.trim() || "/memorial-banners/stock/sunset-lake.png";
const bannerPositionX = Number.isFinite(Number(data.banner_position_x))
  ? Number(data.banner_position_x)
  : 50;
const bannerPositionY = Number.isFinite(Number(data.banner_position_y))
  ? Number(data.banner_position_y)
  : 50;

const hasFamilyHistory = Boolean(
  data.great_grandparents_names?.trim() ||
    data.grandparents_father_side?.trim() ||
    data.grandparents_mother_side?.trim() ||
    data.parents_names?.trim() ||
    data.siblings_names?.trim() ||
    data.spouse_names?.trim() ||
    data.children_names?.trim() ||
    data.grandchildren_names?.trim() ||
    data.great_grandchildren_names?.trim()
);

const hasSchoolsAndAwards = Boolean(
  (Array.isArray(data.schools_attended)
    ? data.schools_attended.length > 0
    : data.schools_attended?.trim()) ||
    (Array.isArray(data.awards_won)
      ? data.awards_won.length > 0
      : data.awards_won?.trim())
);

const hasSocialMedia = Boolean(
  data.social_link_1 ||
    data.social_link_2 ||
    data.social_link_3 ||
    data.social_link_4 ||
    data.social_link_5
);

const hasObituary = Boolean(
  data.obituary?.trim() || data.obituary_image_url || data.obituary_url
);

const publicNavChapters = [
  { id: "basic-information", title: "Basic Information", show: true },
  { id: "life-story", title: "Life Story", show: Boolean(data.life_story?.trim()) },
  { id: "family-history", title: "Family History", show: hasFamilyHistory },
  { id: "places-lived", title: "Places Lived", show: Boolean(data.places_lived?.trim()) },
  { id: "places-worked", title: "Places Worked", show: Boolean(data.places_worked?.trim()) },
  { id: "schools-and-awards", title: "Schools & Awards", show: hasSchoolsAndAwards },
  { id: "social-media", title: "Social Media", show: hasSocialMedia },
  { id: "newspaper-articles", title: "Newspaper Articles", show: newspaperArticles.length > 0 },
  { id: "favorite-songs", title: "Favorite Songs", show: favoriteSongs.length > 0 },
  { id: "photo-gallery", title: "Photo Gallery", show: combinedGalleryPhotos.length > 0 },
  { id: "video-memories", title: "Video Memories", show: publicMemorialVideos.length > 0 || videoLinkUrls.length > 0 },
  { id: "family-and-friends", title: "Family & Friends", show: approvedSubmissions.length > 0 },
  { id: "obituary", title: "Obituary", show: hasObituary },
  { id: "final-resting-place", title: "Final Resting Place", show: hasFinalRestingPlace },
]
  .filter((chapter) => chapter.show)
  .map(({ id, title }) => ({ id, title }));

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
    <main className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-stone-100">
      <section
        id="public-basic-information"
        className="relative isolate w-full overflow-hidden bg-blue-950"
      >
        <img
          src={bannerUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${bannerPositionX}% ${bannerPositionY}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />

        <div className="relative mx-auto flex min-h-[460px] w-full max-w-[1800px] flex-col items-center justify-end gap-7 pl-4 pr-7 py-8 sm:pl-8 sm:pr-11 xl:min-h-[500px] xl:flex-row xl:items-end xl:justify-start xl:gap-10 xl:py-10 xl:px-12">
          {data.featured_photo_url && (
            <div className="flex w-full justify-center xl:w-auto xl:justify-start">
              <div className="shrink-0 rounded-[24px] border-[3px] border-white/95 bg-black/15 p-1.5 shadow-2xl">
                <img
                  src={data.featured_photo_url}
                  alt={data.full_name || "Memorial photo"}
                  className="h-[260px] w-[220px] rounded-[18px] bg-black/10 object-contain sm:h-[300px] sm:w-[250px] xl:h-[340px] xl:w-[285px]"
                />
              </div>
            </div>
          )}

          <div className="w-full min-w-0 pb-2 text-center text-white xl:w-auto xl:text-left">
            {isSampleMemorial && (
              <p className="mb-4 inline-flex rounded-full border border-amber-200 bg-amber-100/95 px-4 py-2 text-base font-extrabold uppercase tracking-[0.14em] text-amber-950 shadow-lg">
                Sample Memorial
              </p>
            )}

            <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
              {data.full_name || "Unnamed Memorial"}
            </h1>

            {(data.birth_date || data.death_date) && (
              <p className="mt-4 text-xl font-semibold leading-8 text-white/95 drop-shadow sm:text-2xl">
                {data.birth_date ? formatDate(data.birth_date) : ""}
                {data.birth_date && data.death_date ? " — " : ""}
                {data.death_date ? formatDate(data.death_date) : ""}
              </p>
            )}

            {data.nickname?.trim() && (
              <p className="mt-3 text-lg font-semibold text-white/90">
                Known as “{data.nickname.trim()}”
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                const target = document.getElementById("help-preserve-this-memory");

                if (!target) return;

                const navHost = document.getElementById("public-memorial-nav");
                const measuredPublicNavHeight =
                  navHost?.getBoundingClientRect().height ?? publicNavHeight;
                const stickyOffset =
                  mainNavHeight + measuredPublicNavHeight + 12;
                const targetTop =
                  window.scrollY + target.getBoundingClientRect().top - stickyOffset;

                window.scrollTo({
                  top: Math.max(0, targetTop),
                  behavior: "smooth",
                });
              }}
              className="mx-auto mt-6 flex w-fit max-w-full items-center justify-center rounded-full border-2 border-amber-200 bg-amber-400 px-6 py-3 text-base font-bold text-blue-950 shadow-lg transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200/60 xl:mx-0"
            >
              Upload your Memory, Photo or Video
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-[1800px] pl-4 pr-7 py-5 sm:pl-6 sm:pr-9 lg:px-8">
          {isOwner && !data.is_published && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-base font-semibold text-amber-800">
              This memorial is currently unpublished and only visible to you and your backup person.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExperienceTheirLife}
              className="inline-flex items-center justify-center rounded-full bg-blue-950 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-900 hover:shadow-md"
            >
              ▶ Experience Their Life
            </button>

            <button
              type="button"
              onClick={() => handleShare("copy")}
              className="inline-flex items-center justify-center rounded-full bg-stone-200 px-4 py-3 text-base font-semibold text-stone-800 hover:bg-stone-300"
            >
              {copied ? "Memorial Link Copied!" : "Copy Memorial Link"}
            </button>

            <button
              type="button"
              onClick={() => handleShare("email")}
              className="inline-flex items-center justify-center rounded-full bg-stone-200 px-4 py-3 text-base font-semibold text-stone-800 hover:bg-stone-300"
            >
              Email Memorial Link
            </button>

            <button
              type="button"
              onClick={() => handleShare("sms")}
              className="inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-500"
            >
              Text
            </button>

            <button
              type="button"
              onClick={() => handleShare("facebook")}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-500"
            >
              Facebook
            </button>

            <button
              type="button"
              onClick={() => handleShare("whatsapp")}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-500"
            >
              WhatsApp
            </button>

            <button
              type="button"
              onClick={() => handleShare("twitter")}
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-3 text-base font-semibold text-white hover:bg-stone-800"
            >
              X
            </button>

            <button
              type="button"
              onClick={() => setShowQrCode((current) => !current)}
              className="inline-flex items-center justify-center rounded-full bg-blue-950 px-4 py-3 text-base font-semibold text-white hover:bg-blue-900"
            >
              QR Code
            </button>
          </div>

          {showQrCode && (
            <div className="mt-4 inline-block rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm">
              <QRCodeSVG
                id="memorial-qr-code"
                value={`https://www.myememorial.com/memorial/${data.slug}`}
                size={180}
                level="H"
                includeMargin
              />

              <p className="mt-3 max-w-[220px] text-center text-base leading-6 text-stone-600">
                Scan this QR code to open this memorial page.
              </p>

              <button
                type="button"
                onClick={() => {
                  const svg = document.getElementById("memorial-qr-code");

                  if (!svg) return;

                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  const img = new Image();

                  canvas.width = 600;
                  canvas.height = 600;

                  img.onload = () => {
                    if (!ctx) return;

                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.href = pngFile;
                    downloadLink.download = `${data.slug}-myememorial-qr-code.png`;
                    downloadLink.click();
                  };

                  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
                }}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-950 px-4 py-3 text-base font-semibold text-white hover:bg-blue-900"
              >
                Download QR Code
              </button>
            </div>
          )}

          {!isOwner && data.is_living_preplan && (
            <Link
              href={`/memorial/${data.slug || slug}/manage`}
              className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-3 text-base font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
            >
              Backup person? Manage this memorial
            </Link>
          )}
        </div>
      </section>

      <div
        id="public-memorial-nav"
        className="sticky z-40 w-full bg-white"
        style={{ top: `${mainNavHeight}px` }}
      >
        <PublicMemorialNav
          chapters={publicNavChapters}
          currentChapterId={activePublicSection}
          onChapterSelect={handlePublicSectionSelect}
        />
      </div>

      <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-6 pl-4 pr-7 py-6 sm:pl-6 sm:pr-9 lg:grid-cols-[345px_minmax(0,1fr)] lg:px-6">
        <aside className="hidden lg:block">
          <div
            className="sticky"
            style={{ top: `${mainNavHeight + publicNavHeight + 16}px` }}
          >
            <SideAd
              memorialZip={data.map_zip}
              pageType="memorial"
              sticky={false}
              compact
            />
          </div>
        </aside>

        <div className="space-y-10">
<div className="lg:hidden">
  <MobileAd memorialZip={data.map_zip} pageType="memorial" />
</div>

{data.life_story?.trim() && (
  <section id="public-life-story" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Life Story
    </h2>

        <p className="mt-4 whitespace-pre-line text-stone-700">
      {data.life_story}
    </p>
  </section>
)}

{(
  data.great_grandparents_names?.trim() ||
  data.grandparents_father_side?.trim() ||
  data.grandparents_mother_side?.trim() ||
  data.parents_names?.trim() ||
  data.siblings_names?.trim() ||
  data.spouse_names?.trim() ||
  data.children_names?.trim() ||
  data.grandchildren_names?.trim() ||
  data.great_grandchildren_names?.trim()
) && (
  <section id="public-family-history" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Family Tree
    </h2>

    <div className="mt-6 flex flex-col items-center space-y-4">
      {data.great_grandparents_names?.trim() && (
        <FamilyTreeCard
          title="Great Grandparents"
          value={data.great_grandparents_names}
        />
      )}

      {(data.grandparents_father_side?.trim() ||
        data.grandparents_mother_side?.trim()) && (
        <>
          <div className="h-6 w-px bg-stone-300" />

          <div className="grid w-full gap-4 md:grid-cols-2">
            {data.grandparents_father_side?.trim() && (
              <FamilyTreeCard
                title="Grandparents — Father’s Side"
                value={data.grandparents_father_side}
              />
            )}

            {data.grandparents_mother_side?.trim() && (
              <FamilyTreeCard
                title="Grandparents — Mother’s Side"
                value={data.grandparents_mother_side}
              />
            )}
          </div>
        </>
      )}

      {data.parents_names?.trim() && (
        <>
          <div className="h-6 w-px bg-stone-300" />

          <FamilyTreeCard
            title="Parents"
            value={data.parents_names}
            highlight
          />
        </>
      )}

    {(
  data.siblings_names?.trim() ||
  data.spouse_names?.trim() ||
  data.children_names?.trim()
) && (
  <>
    <div className="h-6 w-px bg-stone-300" />

    <div className="grid w-full gap-4 md:grid-cols-2">
      {data.siblings_names?.trim() && (
        <FamilyTreeCard
          title="Siblings"
          value={data.siblings_names}
        />
      )}

      {data.spouse_names?.trim() && (
        <FamilyTreeCard
          title="Spouse and/or Partner"
          value={data.spouse_names}
        />
      )}
            {data.children_names?.trim() && (
              <FamilyTreeCard
                title="Children"
                value={data.children_names}
              />
            )}
          </div>
        </>
      )}

      {data.grandchildren_names?.trim() && (
        <>
          <div className="h-6 w-px bg-stone-300" />

          <FamilyTreeCard
            title="Grandchildren"
            value={data.grandchildren_names}
          />
        </>
      )}

      {data.great_grandchildren_names?.trim() && (
        <>
          <div className="h-6 w-px bg-stone-300" />

          <FamilyTreeCard
            title="Great Grandchildren"
            value={data.great_grandchildren_names}
          />
        </>
      )}
    </div>
  </section>
)}
{data.places_lived?.trim() && (
  <section id="public-places-lived" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Places Lived
    </h2>

    <div className="mt-5 whitespace-pre-line text-stone-700">
      {data.places_lived}
    </div>
  </section>
)}

{data.places_worked?.trim() && (
  <section id="public-places-worked" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Places Worked
    </h2>

    <div className="mt-5 whitespace-pre-line text-stone-700">
      {data.places_worked}
    </div>
  </section>
)}

{(data.schools_attended || data.awards_won) && (
  <section id="public-schools-and-awards" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
      Schools and Awards
    </h2>

    <div className="mt-5 space-y-3 text-stone-700">
      {data.schools_attended && (
        <p>
          <strong>Schools:</strong>{" "}
          {Array.isArray(data.schools_attended)
            ? data.schools_attended.join(", ")
            : data.schools_attended}
        </p>
      )}

      {data.awards_won && (
        <p>
          <strong>Awards:</strong>{" "}
          {Array.isArray(data.awards_won)
            ? data.awards_won.join(", ")
            : data.awards_won}
        </p>
      )}
    </div>
  </section>
)}

{newspaperArticles.length > 0 && (
  <section id="public-newspaper-articles" className="rounded-2xl bg-white p-5 shadow-sm">
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
{favoriteSongs.length > 0 && (
  <section id="public-favorite-songs" className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="flex w-full items-center justify-between gap-4 text-left">
      <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
        {data.nickname?.trim()
          ? `${data.nickname.trim()}'s Favorite Songs`
          : data.first_name
            ? `${data.first_name}'s Favorite Songs`
            : "Favorite Songs"}
      </h2>

      <button
        type="button"
        onClick={() => setShowFavoriteSongs((current) => !current)}
        className="rounded-full bg-stone-100 px-3 py-1 text-base font-semibold text-stone-700 hover:bg-stone-200"
      >
        {showFavoriteSongs ? "▲" : "▼"}
      </button>
    </div>

    <p className="mt-2 text-base leading-6 text-stone-500">
      Uploaded songs use the audio controls below. YouTube favorites stay compact
      here and join the same music playlist during Experience Their Life.
    </p>

    <div className={showFavoriteSongs ? "mt-4 space-y-3" : "hidden"}>
      {favoriteSongs.map((song, index) => {
        const youtubeVideoId = getYouTubeVideoId(song);

        return (
          <div
            key={`${song}-${index}`}
            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-stone-800">
                Favorite Song {index + 1}
              </p>

              {youtubeVideoId && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-base font-semibold text-red-700">
                  YouTube
                </span>
              )}
            </div>

            {youtubeVideoId ? (
              <div className="rounded-xl border border-red-200 bg-white p-4">
                <a
                  href={song}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block w-full max-w-[320px] overflow-hidden rounded-xl bg-black shadow-sm"
                  aria-label={`Open YouTube favorite song ${index + 1}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${encodeURIComponent(youtubeVideoId)}/hqdefault.jpg`}
                    alt={`YouTube favorite song ${index + 1} thumbnail`}
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg">
                      ▶
                    </span>
                  </span>
                </a>

                <p className="mt-3 max-w-[320px] text-base leading-6 text-stone-600">
                  This song joins uploaded music during Experience Their Life.
                </p>
              </div>
            ) : (
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
                  currentSongIndexRef.current = index;

                  songAudioRefs.current.forEach(
                    (candidateAudio, candidateIndex) => {
                      if (
                        !candidateAudio ||
                        candidateIndex === index
                      ) {
                        return;
                      }

                      candidateAudio.pause();
                    }
                  );
                }}
                onEnded={() => {
                  if (
                    presentationHasStartedRef.current &&
                    isSlideshowPlayingRef.current
                  ) {
                    advanceFavoriteSong();
                  }
                }}
              />
            )}

            {data.favorite_song_notes?.[index] && (
              <p className="mt-2 whitespace-pre-line text-base leading-6 text-stone-600">
                {data.favorite_song_notes[index]}
              </p>
            )}
          </div>
        );
      })}
      </div>
  </section>
)}






{(
  data.social_link_1 ||
  data.social_link_2 ||
  data.social_link_3 ||
  data.social_link_4 ||
  data.social_link_5
) && (
  <section id="public-social-media" className="rounded-2xl bg-white p-5 shadow-sm">
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



{combinedGalleryPhotos.length > 0 && (
  <section id="public-photo-gallery" className="rounded-2xl bg-white p-5 shadow-sm">
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
      <>
      <p className="mt-5 text-center text-sm italic text-stone-600">
  💡 Click any photo to enlarge it and discover more memories.
</p>
  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
    {combinedGalleryPhotos.map((photo, index) => (
      <button
        key={`${photo.src}-${index}`}
        type="button"
        onClick={() => setSelectedPhotoIndex(index)}
        className="group aspect-square w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm"
        aria-label={`Open gallery photo ${index + 1}`}
      >
        <img
          src={photo.src}
          alt={`Gallery photo ${index + 1}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </button>
    ))}
      </div>
  </>
)}
  </section>
)}


{(publicMemorialVideos.length > 0 || videoLinkUrls.length > 0) && (
  <section id="public-video-memories" className="rounded-2xl bg-white p-5 shadow-sm">
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
  {publicMemorialVideos.map((video, index) => (
    <div
      key={video.id}
      className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 p-5 shadow-sm"
    >
      <p className="mb-4 text-sm font-semibold text-stone-700">
        Memorial Video {index + 1}
      </p>

      {showMemorialVideos === true &&
      currentSongIndex === index + 1000 ? (
        <MuxPlayer
          playbackId={video.playback_id}
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
          className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-stone-200"
        >
          <img
            src={`https://image.mux.com/${video.playback_id}/thumbnail.jpg?time=5`}
            alt={`Memorial video ${index + 1} thumbnail`}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="rounded-full bg-black/65 px-5 py-4 text-2xl text-white shadow-lg">
              ▶
            </div>
          </div>
        </button>
      )}

      {video.note && (
        <p className="mt-3 text-sm italic text-stone-600">
          {video.note}
        </p>
      )}
    </div>
  ))}
  {videoLinkUrls.map((url, index) => {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(url);

  return (
    <div
      key={`${url}-${index}`}
      className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 p-5 shadow-sm"
    >
      <p className="mb-4 text-sm font-semibold text-stone-700">
        Video Link {index + 1}
      </p>

      {youtubeEmbedUrl ? (
  <iframe
    src={youtubeEmbedUrl}
    title={`YouTube video ${index + 1}`}
    className="aspect-video w-full rounded-xl bg-black"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
) : videoLinkThumbnailUrls[index] ? (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-stone-200"
    aria-label={`Open video link ${index + 1}`}
  >
    <img
      src={videoLinkThumbnailUrls[index]}
      alt={`Video link ${index + 1} preview`}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />

    <div className="absolute inset-0 flex items-center justify-center bg-black/15">
      <div className="rounded-full bg-black/70 px-5 py-4 text-2xl text-white shadow-lg">
        ▶
      </div>
    </div>
  </a>
) : (
  <VideoLinkPreview
    url={url}
    index={index}
  />
)}

      {videoLinkNotes[index] && (
        <p className="mt-3 whitespace-pre-line text-sm italic text-stone-600">
          {videoLinkNotes[index]}
        </p>
      )}
    </div>
  );
})}
</div>
)}
  </section>
)}





{approvedSubmissions.length > 0 && (
  <section
    id="public-family-and-friends"
    className="rounded-2xl bg-white p-5 shadow-sm"
  >
    <button
      type="button"
      onClick={() => setShowSharedMemories((current) => !current)}
      className="flex w-full items-start justify-between gap-4 text-left"
    >
      <div>
        <p className="text-base font-semibold uppercase tracking-[0.18em] text-amber-700">
          Shared By Family & Friends
        </p>

        <h2 className="mt-1 text-[28px] font-bold tracking-tight text-stone-900">
          Photos, Videos & Written Stories
        </h2>

        <p className="mt-3 text-base leading-7 text-stone-600">
          These photos, videos, and written stories were shared by family and friends and approved by the memorial owner.
        </p>
      </div>

      <span className="mt-1 shrink-0 rounded-full bg-stone-100 px-3 py-1 text-base font-semibold text-stone-700">
        {showSharedMemories ? "▲" : "▼"}
      </span>
    </button>

    {showSharedMemories && (
      <div className="mt-5 space-y-4">
        {approvedSubmissions
          .filter((submission) => {
            const submittedPhotos = parseUrlList(submission.photo_urls);
            const submittedVideos = parseUrlList(submission.video_urls).filter(
              (videoId) => videoId.length > 15
            );
            const hasMessage = Boolean(submission.message?.trim());

            return (
              submittedPhotos.length > 0 ||
              submittedVideos.length > 0 ||
              hasMessage
            );
          })
          .map((submission) => {
            const submittedPhotos = parseUrlList(submission.photo_urls);
            const submittedVideos = parseUrlList(submission.video_urls).filter(
              (videoId) => videoId.length > 15
            );

            return (
              <div
                key={submission.id}
                className="rounded-2xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  <div>
                    <p className="text-base font-semibold text-stone-900">
                      {submission.submitter_name || "Anonymous Visitor"}
                    </p>

                    <p className="mt-1 text-base font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Shared Memory
                    </p>
                  </div>

                  {submission.created_at && (
                    <p className="text-base text-stone-500">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {submission.message?.trim() && (
                  <p className="mt-4 whitespace-pre-line text-base leading-7 text-stone-700">
                    {submission.message}
                  </p>
                )}

                {submittedPhotos.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-3 text-base font-semibold text-stone-800">
                      Shared Photo{submittedPhotos.length === 1 ? "" : "s"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {submittedPhotos.map((photoUrl, index) => (
                        <button
                          key={`${submission.id}-photo-${index}`}
                          type="button"
                          onClick={() =>
                            setContributorPhotoViewer({
                              photos: submittedPhotos,
                              index,
                            })
                          }
                          className="group aspect-square w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm"
                          aria-label={`Open shared photo ${index + 1}`}
                        >
                          <img
                            src={photoUrl}
                            alt={`Shared photo ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {submittedVideos.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {submittedVideos.map((playbackId, index) => (
                      <div
                        key={`${submission.id}-video-${index}`}
                        className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                      >
                        <p className="mb-3 text-base font-semibold text-stone-700">
                          Shared Video {index + 1}
                        </p>

                        <MuxPlayer
                          playbackId={playbackId}
                          streamType="on-demand"
                          className="aspect-video w-full rounded-xl bg-black"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        <p className="mt-8 border-t border-stone-200 pt-5 text-center text-base italic text-stone-500">
          Every shared memory helps preserve this life for future generations.
        </p>
      </div>
    )}
  </section>
)}
  <section
    id="help-preserve-this-memory"
    className="scroll-mt-40 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
  >
  <p className="text-base font-semibold uppercase tracking-[0.18em] text-amber-800">
    Help Preserve This Memory
  </p>

  <h2 className="text-[28px] font-bold tracking-tight text-stone-900">
    Share a Memory, Photo or Video
  </h2>

  <p className="mt-3 text-base leading-7 text-stone-700">
    Did you know this person? Your memories, stories, corrections, or photos can help preserve their life for family, friends, and future generations.
  </p>

  <p className="mt-1 text-base leading-7 text-stone-600">
    Memories, photos, and videos are reviewed before appearing publicly.
  </p>

  {submissionSuccess ? (
    <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
      Thank you. Your memory has been submitted for review.
    </div>
  ) : (
    <div className="mt-5 space-y-3">
      <input
        type="text"
        placeholder="Your Name (optional)"
        value={submitterName}
        onChange={(e) => setSubmitterName(e.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900"
      />

      <input
        type="email"
        placeholder="Your Email (optional)"
        value={submitterEmail}
        onChange={(e) => setSubmitterEmail(e.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900"
      />

     <textarea
  placeholder="Share a memory, story, correction, or information..."
  value={submissionMessage}
  onChange={(e) => setSubmissionMessage(e.target.value)}
  rows={5}
  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900"
/>
<div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3">
  <label className="block text-base font-semibold text-stone-800">
    Add Photos (optional)
  </label>

  <p className="mt-1 text-base leading-7 text-stone-500">
    You may upload photos for review before they appear publicly.
  </p>

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files || []);
      setSubmissionPhotos(files);
    }}
    className="mt-4 block w-full text-base text-stone-700"
  />

  {submissionPhotos.length > 0 && (
    <p className="mt-3 text-base text-stone-600">
      {submissionPhotos.length} photo{submissionPhotos.length === 1 ? "" : "s"} selected
    </p>
  )}
</div>
<div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
  <label className="block text-base font-semibold text-stone-800">
    Add a Video (optional)
  </label>

  <p className="mt-1 text-base leading-7 text-stone-500">
    You may submit one video for review before it appears publicly.
  </p>

  <input
    type="file"
    accept="video/*"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;
      setSubmissionVideo(file);
    }}
    className="mt-3 block w-full text-base text-stone-700"
  />

  {submissionVideo && (
    <p className="mt-3 text-base text-stone-600">
      Selected video: {submissionVideo.name}
    </p>
  )}
</div>
      <button
        onClick={handleContributionSubmit}
        disabled={isSubmittingContribution || uploadingPhotos || uploadingVideo}
        className="rounded-full bg-stone-900 px-5 py-2 text-base font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {uploadingVideo
  ? "Uploading / Processing Video..."
  : isSubmittingContribution || uploadingPhotos
    ? "Submitting..."
    : "Submit Memory"}
      </button>
    </div>
  )}
  
</section>
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
{(data.obituary || data.obituary_image_url || data.obituary_url) && (
  <section id="public-obituary" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-[28px] font-bold tracking-tight text-stone-900">Obituary</h2>
    {data.obituary && <p className="mt-4 whitespace-pre-line text-stone-700">{data.obituary}</p>}
    {data.obituary_image_url && (
  <img
    src={data.obituary_image_url}
    alt="Obituary"
    className="mt-4 w-full rounded-2xl border border-stone-200"
  />
)}
    {data.obituary_url && (
      <a
  href={
    /^https?:\/\//i.test(data.obituary_url)
      ? data.obituary_url
      : `https://${data.obituary_url}`
  }
  target="_blank"
  rel="noopener noreferrer"
  className="mt-4 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
>
  View Full Obituary
</a>
    )}
  </section>
)}     
        {hasFinalRestingPlace && (
  <section id="public-final-resting-place" className="rounded-2xl bg-white p-5 shadow-sm">
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
{data.grave_directions?.trim() && (
  <div>
    <p className="font-semibold text-stone-900">Directions:</p>
    <p className="mt-1 whitespace-pre-line text-stone-700">
      {data.grave_directions}
    </p>
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
    
     <div className="relative grid w-full place-items-center overflow-hidden rounded-2xl">
  {previousDisplayedPhoto && (
    <img
      src={previousDisplayedPhoto}
      alt=""
      aria-hidden="true"
      className="memorial-photo-crossfade-out absolute inset-0 h-full w-full object-contain"
    />
  )}

  {displayedPhoto && (
    <img
      key={displayedPhoto}
      src={displayedPhoto}
      alt="Enlarged memorial photo"
      className="memorial-photo-crossfade-in max-h-[65vh] w-full object-contain"
    />
  )}
</div>

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
    <div className="mt-4 flex flex-col items-center gap-3">
  <button
    type="button"
    onClick={toggleSlideshowWithMusic}
   className="rounded-full bg-blue-600 px-8 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
  >
    {isSlideshowPlaying
      ? "Pause Presentation"
      : presentationHasStarted
        ? "▶ Resume Presentation"
        : "▶ Experience Their Life"}
  </button>

  {presentationHasStarted && favoriteSongs.length > 0 && (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-full bg-stone-100 px-4 py-2">
      <button
        type="button"
        onClick={() => {
          setIsSlideshowMusicMuted((current) => !current);
        }}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm hover:bg-stone-200"
        aria-label={
          isSlideshowMusicMuted
            ? "Unmute slideshow music"
            : "Mute slideshow music"
        }
      >
        {isSlideshowMusicMuted ? "🔇 Unmute" : "🔊 Mute"}
      </button>

      <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
        Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={slideshowMusicVolume}
          onChange={(event) => {
            const nextVolume = Number(event.target.value);

            setSlideshowMusicVolume(nextVolume);

            if (nextVolume > 0 && isSlideshowMusicMuted) {
              setIsSlideshowMusicMuted(false);
            }
          }}
          className="w-28 sm:w-36"
          aria-label="Slideshow music volume"
        />
      </label>

      <span className="text-base font-semibold text-stone-700">
        Song {Math.min(currentSongIndex + 1, favoriteSongs.length)} of {favoriteSongs.length}
      </span>

      {favoriteSongs.length > 1 && (
        <button
          type="button"
          onClick={advanceFavoriteSong}
          className="rounded-full bg-white px-3 py-1.5 text-base font-semibold text-stone-800 shadow-sm hover:bg-stone-200"
        >
          Next Song →
        </button>
      )}
    </div>
  )}
</div>

{presentationHasStarted && currentYouTubeVideoId && (
  <div className="mt-4 w-full rounded-2xl border border-stone-300 bg-white p-3 shadow-lg sm:fixed sm:bottom-5 sm:right-5 sm:z-[60] sm:mt-0 sm:w-[320px] sm:shadow-2xl">
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-base font-semibold text-stone-900">
        Now Playing — YouTube Favorite Song {currentSongIndex + 1}
      </p>
      <span className="rounded-full bg-red-50 px-3 py-1 text-base font-semibold text-red-700">
        YouTube
      </span>
    </div>

    <div className="mx-auto aspect-video w-full max-w-[220px] overflow-hidden rounded-xl bg-black sm:max-w-none">
      <div ref={youtubePlayerHostRef} className="h-full w-full" />
    </div>

    <p className="mt-2 hidden text-base leading-6 text-stone-600 sm:block">
      This player stays visible while the YouTube song is active in the slideshow.
    </p>
  </div>
)}
  </div>
)}

     {selectedPhotoNote && (
  <p className="mt-4 whitespace-pre-line text-center text-lg font-medium leading-7 text-stone-800">
    {selectedPhotoNote}
  </p>
)}
    </div>
  </div>
)}
</main>
);
}