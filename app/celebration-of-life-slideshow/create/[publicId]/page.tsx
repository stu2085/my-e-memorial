"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { supabase } from "../../../lib/supabase";
import CameraPhotoCapture from "../../../components/celebration-presentation/CameraPhotoCapture";
import CelebrationVideoRecorder from "../../../components/celebration-presentation/CelebrationVideoRecorder";
import ArrangePresentationSection from "../../../components/celebration-presentation/ArrangePresentationSection";
import BuilderMediaAccordion from "../../../components/celebration-presentation/BuilderMediaAccordion";

type Presentation = {
  publicId: string;
  personName: string;
  customerEmail: string;
  birthDate: string | null;
  deathDate: string | null;
  featuredPhotoUrl: string | null;
  theme: string;
  status: string;
  paymentStatus: string;
};

type PresentationMusic = {
  id: number;
  source_type: "uploaded" | "youtube" | "library";
  source_url: string;
  storage_path?: string | null;
  title?: string | null;
  artist?: string | null;
  sort_order: number;
};

type PresentationItem = {
  id: number;
  item_type: "photo" | "video";
  photo_url: string | null;
  mux_asset_id?: string | null;
  mux_playback_id: string | null;
  caption: string;
  attribution: string;
  source: "creator" | "contributor";
  approval_status:
    | "pending"
    | "approved"
    | "rejected";
  sort_order: number;
  duration_seconds?: number | null;
};

const MAX_VIDEO_SIZE_BYTES =
  1000 * 1000 * 1000;

const MAX_VIDEO_SECONDS = 300;

export default function CelebrationPresentationBuilderPage() {
  const params =
    useParams<{
      publicId: string;
    }>();

  const publicId =
    params?.publicId || "";

  const photoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const videoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const musicInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    presentation,
    setPresentation,
  ] =
    useState<Presentation | null>(
      null
    );

  const [items, setItems] =
    useState<PresentationItem[]>(
      []
    );

  const [music, setMusic] =
    useState<PresentationMusic[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [uploadingVideo, setUploadingVideo] =
    useState(false);

  const [uploadingMusic, setUploadingMusic] =
    useState(false);

  const [movingItemId, setMovingItemId] =
    useState<number | null>(null);

  const [photosOpen, setPhotosOpen] =
    useState(false);

  const [videosOpen, setVideosOpen] =
    useState(false);

  const [musicOpen, setMusicOpen] =
    useState(false);

  const accordionInitializedRef =
    useRef(false);

  const [
    cameraOpen,
    setCameraOpen,
  ] =
    useState(false);

  const [
    videoRecorderOpen,
    setVideoRecorderOpen,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    statusMessage,
    setStatusMessage,
  ] =
    useState("");

  const loadPresentation =
    useCallback(async () => {
      if (!publicId) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await fetch(
            `/api/celebration-presentations/${encodeURIComponent(
              publicId
            )}`,
            {
              method: "GET",
              credentials:
                "include",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result?.presentation
        ) {
          throw new Error(
            result?.error ||
              "Your presentation could not be loaded."
          );
        }

        setPresentation(
          result.presentation as Presentation
        );

        const loadedItems =
          (
            (result.items ||
              []) as PresentationItem[]
          )
            .filter(
              (item) =>
                item.approval_status ===
                "approved"
            )
            .sort(
              (a, b) =>
                (a.sort_order ?? 0) -
                (b.sort_order ?? 0)
            );

        const loadedMusic =
          (
            (result.music ||
              []) as PresentationMusic[]
          ).sort(
            (a, b) =>
              (a.sort_order ?? 0) -
              (b.sort_order ?? 0)
          );

        setItems(loadedItems);
        setMusic(loadedMusic);

        if (
          !accordionInitializedRef.current
        ) {
          const hasExistingMedia =
            loadedItems.length > 0 ||
            loadedMusic.length > 0;

          setPhotosOpen(
            !hasExistingMedia
          );
          setVideosOpen(false);
          setMusicOpen(false);

          accordionInitializedRef.current =
            true;
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Your presentation could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, [publicId]);

  useEffect(() => {
    void loadPresentation();
  }, [loadPresentation]);

  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get("payment");
    if (payment === "cancelled") setStatusMessage("Payment was cancelled. You can continue editing your presentation.");
    if (payment !== "success") return;
    setStatusMessage("Your payment is being confirmed. Your presentation will become active shortly.");
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/celebration-presentations/${encodeURIComponent(publicId)}`, { credentials: "include", cache: "no-store" });
        const result = await response.json();
        if (response.ok && result?.presentation?.paymentStatus === "paid") {
          setPresentation(result.presentation as Presentation);
          setStatusMessage("Payment confirmed. Your presentation is active. Your private edit link is being emailed to you.");
          window.clearInterval(timer);
        }
      } catch { /* Stripe webhook may still be processing. */ }
      if (attempts >= 15) window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [publicId]);

  async function startCheckout() {
    try {
      setStartingCheckout(true);
      setErrorMessage("");
      const response = await fetch(`/api/celebration-presentations/${encodeURIComponent(publicId)}/checkout`, {
        method: "POST", credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result?.url) throw new Error(result?.error || "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Checkout could not be started.");
      setStartingCheckout(false);
    }
  }

  async function copyViewingLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/celebration-of-life-slideshow/${encodeURIComponent(publicId)}`
      );
      setStatusMessage("Viewing link copied. You can share it with family or the event venue.");
    } catch {
      setErrorMessage("Could not copy the link. Open the presentation and copy its address instead.");
    }
  }

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(`/api/celebration-presentations/${encodeURIComponent(publicId)}/access-request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const result = await response.json();
      setRecoveryMessage(result?.message || "If this is the purchaser email, a private access link will arrive shortly.");
    } catch {
      setRecoveryMessage("The access request could not be sent. Please try again.");
    }
  }

  const photoItems = items.filter(
    (item) =>
      item.item_type === "photo"
  );

  const videoItems = items.filter(
    (item) =>
      item.item_type === "video"
  );

  async function uploadOnePhoto(
    file: File
  ): Promise<string> {
    const ticketResponse =
      await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/photo-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "include",
          body: JSON.stringify({
            fileName: file.name,
            contentType:
              file.type ||
              "image/jpeg",
            fileSize:
              file.size,
          }),
        }
      );

    const ticket =
      await ticketResponse.json();

    if (
      !ticketResponse.ok ||
      !ticket?.path ||
      !ticket?.token
    ) {
      throw new Error(
        ticket?.error ||
          "This photo could not be uploaded."
      );
    }

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          ticket.bucket ||
            "memorial-photos"
        )
        .uploadToSignedUrl(
          ticket.path,
          ticket.token,
          file,
          {
            contentType:
              file.type ||
              "image/jpeg",
            cacheControl:
              "3600",
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const itemResponse =
      await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "include",
          body: JSON.stringify({
            storagePath:
              ticket.path,
          }),
        }
      );

    const itemResult =
      await itemResponse.json();

    if (!itemResponse.ok) {
      throw new Error(
        itemResult?.error ||
          "The photo could not be added."
      );
    }

    const photoUrl = String(
      itemResult?.item?.photo_url || ""
    ).trim();

    if (!photoUrl) {
      throw new Error(
        "The uploaded photo could not be prepared for the presentation."
      );
    }

    return photoUrl;
  }

  async function saveFeaturedPhoto(
    featuredPhotoUrl: string
  ) {
    const response = await fetch(
      `/api/celebration-presentations/${encodeURIComponent(
        publicId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          featuredPhotoUrl,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "The featured photo could not be saved."
      );
    }

    setPresentation((current) =>
      current
        ? {
            ...current,
            featuredPhotoUrl:
              featuredPhotoUrl || null,
          }
        : current
    );
  }

  async function selectFeaturedPhoto(
    featuredPhotoUrl: string
  ) {
    try {
      setErrorMessage("");
      setStatusMessage("");

      await saveFeaturedPhoto(
        featuredPhotoUrl
      );

      setStatusMessage(
        "Featured photo selected."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The featured photo could not be saved."
      );
    }
  }

  async function handlePhotos(
    files: File[]
  ) {
    if (
      !publicId ||
      files.length === 0
    ) {
      return;
    }

    try {
      setUploadingPhoto(true);
      setErrorMessage("");
      setStatusMessage("");

      let firstUploadedPhotoUrl = "";

      for (const file of files) {
        const photoUrl = await uploadOnePhoto(file);

        if (!firstUploadedPhotoUrl) {
          firstUploadedPhotoUrl = photoUrl;
        }
      }

      if (
        !presentation?.featuredPhotoUrl &&
        firstUploadedPhotoUrl
      ) {
        await saveFeaturedPhoto(
          firstUploadedPhotoUrl
        );
      }

      setStatusMessage(
        files.length === 1
          ? "Photo added."
          : `${files.length} photos added.`
      );

      await loadPresentation();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The photo could not be uploaded."
      );

      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files || []
      );

    event.target.value = "";

    void handlePhotos(
      selected
    ).catch(() => {
      // Error is already displayed.
    });
  }

  async function getVideoDuration(
    file: File
  ) {
    return await new Promise<number>(
      (resolve, reject) => {
        const video =
          document.createElement(
            "video"
          );

        const url =
          URL.createObjectURL(file);

        video.preload = "metadata";

        video.onloadedmetadata =
          () => {
            URL.revokeObjectURL(
              url
            );

            if (
              !Number.isFinite(
                video.duration
              ) ||
              video.duration <= 0
            ) {
              reject(
                new Error(
                  "Could not read the video length."
                )
              );
              return;
            }

            resolve(video.duration);
          };

        video.onerror = () => {
          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "Could not read the video."
            )
          );
        };

        video.src = url;
        video.load();
      }
    );
  }

  async function uploadVideo(
    file: File,
    knownDuration?: number
  ) {
    if (
      file.size >
      MAX_VIDEO_SIZE_BYTES
    ) {
      throw new Error(
        "Videos must be 1 GB or smaller."
      );
    }

    const durationSeconds =
      knownDuration &&
      knownDuration > 0
        ? knownDuration
        : await getVideoDuration(
            file
          );

    if (
      durationSeconds >
      MAX_VIDEO_SECONDS
    ) {
      throw new Error(
        "Videos must be 5 minutes or less."
      );
    }

    const uploadResponse =
      await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/video-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "include",
          body: JSON.stringify({
            fileName: file.name,
            contentType:
              file.type ||
              "video/mp4",
            fileSize:
              file.size,
            durationSeconds,
          }),
        }
      );

    const uploadResult =
      await uploadResponse.json();

    if (
      !uploadResponse.ok ||
      !uploadResult?.uploadUrl ||
      !uploadResult?.uploadId
    ) {
      throw new Error(
        uploadResult?.error ||
          "The video upload could not be started."
      );
    }

    const muxResponse =
      await fetch(
        uploadResult.uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              file.type ||
              "application/octet-stream",
          },
          body: file,
        }
      );

    if (!muxResponse.ok) {
      throw new Error(
        "The video upload failed."
      );
    }

    for (
      let attempt = 0;
      attempt < 60;
      attempt += 1
    ) {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            2000
          )
      );

      const playbackResponse =
        await fetch(
          `/api/celebration-presentations/${encodeURIComponent(
            publicId
          )}/video-playback`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body:
              JSON.stringify({
                uploadId:
                  uploadResult.uploadId,
              }),
          }
        );

      const playbackResult =
        await playbackResponse.json();

      if (
        playbackResponse.ok &&
        playbackResult?.item
      ) {
        return;
      }

      if (
        playbackResponse.status !==
        202
      ) {
        throw new Error(
          playbackResult?.error ||
            "The video could not be prepared for playback."
        );
      }
    }

    throw new Error(
      "Video processing is taking longer than expected. Please try again in a few minutes."
    );
  }

  async function handleVideo(
    file: File,
    knownDuration?: number
  ) {
    try {
      setUploadingVideo(true);
      setErrorMessage("");
      setStatusMessage("");

      await uploadVideo(
        file,
        knownDuration
      );

      setStatusMessage(
        "Video added."
      );

      await loadPresentation();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The video could not be uploaded."
      );

      throw error;
    } finally {
      setUploadingVideo(false);
    }
  }

  function handleVideoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    void handleVideo(
      file
    ).catch(() => {
      // Error is already displayed.
    });
  }

  async function uploadMusic(
    file: File
  ) {
    const allowedExtensions =
      ["mp3", "m4a", "aac", "wav"];

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "";

    if (
      !file.type.startsWith("audio/") &&
      !allowedExtensions.includes(
        extension
      )
    ) {
      throw new Error(
        "Please choose an MP3, M4A, AAC, or WAV audio file."
      );
    }

    const ticketResponse =
      await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/music-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "include",
          body: JSON.stringify({
            fileName: file.name,
            contentType:
              file.type ||
              "audio/mpeg",
            fileSize:
              file.size,
          }),
        }
      );

    const ticket =
      await ticketResponse.json();

    if (
      !ticketResponse.ok ||
      !ticket?.path ||
      !ticket?.token
    ) {
      throw new Error(
        ticket?.error ||
          "The music upload could not be started."
      );
    }

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          ticket.bucket ||
            "memorial-audio"
        )
        .uploadToSignedUrl(
          ticket.path,
          ticket.token,
          file,
          {
            contentType:
              file.type ||
              "audio/mpeg",
            cacheControl:
              "3600",
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const title =
      file.name.replace(
        /\.[^.]+$/,
        ""
      );

    const finalizeResponse =
      await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/music`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "include",
          body: JSON.stringify({
            storagePath:
              ticket.path,
            title,
          }),
        }
      );

    const finalizeResult =
      await finalizeResponse.json();

    if (!finalizeResponse.ok) {
      throw new Error(
        finalizeResult?.error ||
          "The music could not be added."
      );
    }
  }

  function handleMusicChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files || []
      );

    event.target.value = "";

    if (selected.length === 0) {
      return;
    }

    void (async () => {
      try {
        setUploadingMusic(true);
        setErrorMessage("");
        setStatusMessage("");

        for (const file of selected) {
          await uploadMusic(file);
        }

        setStatusMessage(
          selected.length === 1
            ? "Music added."
            : `${selected.length} music files added.`
        );

        await loadPresentation();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The music could not be uploaded."
        );
      } finally {
        setUploadingMusic(false);
      }
    })();
  }

  async function removeMusic(
    musicId: number
  ) {
    const confirmed =
      window.confirm(
        "Remove this music from the presentation?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setStatusMessage("");

      const response =
        await fetch(
          `/api/celebration-presentations/${encodeURIComponent(
            publicId
          )}/music`,
          {
            method:
              "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body:
              JSON.stringify({
                musicId,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The music could not be removed."
        );
      }

      setMusic(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              musicId
          )
      );

      setStatusMessage(
        "Music removed."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The music could not be removed."
      );
    }
  }

  async function saveCaption(
    itemId: number,
    caption: string
  ) {
    try {
      setErrorMessage("");

      const response =
        await fetch(
          `/api/celebration-presentations/${encodeURIComponent(
            publicId
          )}/items`,
          {
            method:
              "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body:
              JSON.stringify({
                itemId,
                caption,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The caption could not be saved."
        );
      }

      setItems((previous) =>
        previous.map((item) =>
          item.id === itemId
            ? {
                ...item,
                caption: String(caption).trim().slice(0, 500),
              }
            : item
        )
      );

      setStatusMessage(
        "Caption saved."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The caption could not be saved."
      );
    }
  }

  async function moveItem(
    itemId: number,
    direction: "earlier" | "later"
  ) {
    if (movingItemId !== null) {
      return;
    }

    try {
      setMovingItemId(itemId);
      setErrorMessage("");
      setStatusMessage("");

      const response =
        await fetch(
          `/api/celebration-presentations/${encodeURIComponent(
            publicId
          )}/items`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body:
              JSON.stringify({
                action: "move",
                itemId,
                direction,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The presentation order could not be saved."
        );
      }

      const orderedItemIds =
        Array.isArray(
          result?.orderedItemIds
        )
          ? result.orderedItemIds.map(
              (value: unknown) =>
                Number(value)
            )
          : [];

      if (
        orderedItemIds.length ===
        items.length
      ) {
        const positionMap =
          new Map<number, number>(
            orderedItemIds.map(
              (
                id: number,
                index: number
              ) => [
                id,
                index,
              ] as const
            )
          );

        setItems((previous) =>
          [...previous]
            .sort(
              (a, b) =>
                (positionMap.get(
                  a.id
                ) ?? 0) -
                (positionMap.get(
                  b.id
                ) ?? 0)
            )
            .map(
              (
                item,
                index
              ) => ({
                ...item,
                sort_order:
                  index,
              })
            )
        );
      } else {
        await loadPresentation();
      }

      setStatusMessage(
        "Presentation order saved."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The presentation order could not be saved."
      );
    } finally {
      setMovingItemId(null);
    }
  }

  async function removeItem(
    itemId: number,
    itemType: "photo" | "video"
  ) {
    const confirmed =
      window.confirm(
        `Remove this ${itemType} from the presentation?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      setStatusMessage("");

      const response =
        await fetch(
          `/api/celebration-presentations/${encodeURIComponent(
            publicId
          )}/items`,
          {
            method:
              "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body:
              JSON.stringify({
                itemId,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `The ${itemType} could not be removed.`
        );
      }

      setItems(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              itemId
          )
      );

      setStatusMessage(
        `${
          itemType === "photo"
            ? "Photo"
            : "Video"
        } removed.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The item could not be removed."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-10">
        <p className="text-center text-base font-semibold text-stone-700">
          Loading...
        </p>
      </main>
    );
  }

  if (
    errorMessage &&
    !presentation
  ) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-7 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">
            Celebration of Life Presentation
          </h1>

          <p className="mt-4 text-base text-red-700">
            {errorMessage}
          </p>
          <form onSubmit={(event) => void requestAccess(event)} className="mt-6 text-left">
            <label htmlFor="recovery-email" className="block text-base font-semibold text-stone-900">Purchased this presentation? Request a private edit link</label>
            <input id="recovery-email" type="email" required value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="Purchaser email"
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-base" />
            <button type="submit" className="mt-3 min-h-12 rounded-full bg-[#244f40] px-5 py-2 text-base font-bold text-white">Email My Edit Link</button>
            {recoveryMessage && <p role="status" className="mt-3 text-base text-stone-700">{recoveryMessage}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        className="min-h-screen px-4 py-8 sm:py-12"
        style={{
          backgroundImage:
            "linear-gradient(rgba(250,247,238,0.22), rgba(250,247,238,0.30)), url('/Images/celebration-builder-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center">
            <p className="text-base font-semibold uppercase tracking-[0.22em] text-[#294b3f]">
              Celebration of Life Presentation
            </p>

            <div
              aria-hidden="true"
              className="mx-auto mt-3 flex w-40 items-center justify-center gap-3 text-[#9b7943]"
            >
              <span className="h-px flex-1 bg-[#b99a68]" />
              <span className="text-lg">♥</span>
              <span className="h-px flex-1 bg-[#b99a68]" />
            </div>

            <h1 className="mt-3 font-serif text-4xl font-bold text-[#173a31] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] sm:text-5xl">
              {presentation?.personName}
            </h1>

            <p className="mt-2 font-serif text-xl italic text-[#8d6c3f] sm:text-2xl">
              A Life Well Remembered
            </p>
          </div>

          {presentation?.paymentStatus !== "paid" ? (
            <div className="mt-7 rounded-2xl border border-[#d6c29b] bg-white/90 p-5 text-center shadow-sm">
              <p className="text-base font-semibold text-[#173a31]">One-time purchase: $19.95 · Hosted for 60 days</p>
              <p className="mt-2 text-base text-stone-700">You can create and preview your presentation now. Purchase to activate the shareable presentation.</p>
              <p className="mt-2 text-base text-stone-700">You will receive a single-use $19.95 code to credit this purchase toward a new paid MyEMemorial.</p>
              <button type="button" onClick={() => void startCheckout()} disabled={startingCheckout}
                className="mt-4 min-h-14 rounded-full bg-[#244f40] px-7 py-3 text-lg font-bold text-white disabled:opacity-60">
                {startingCheckout ? "Opening checkout..." : "Purchase Presentation"}
              </button>
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-[#b5ccba] bg-[#f4faf2] px-5 py-5 text-center">
              <p className="text-base font-semibold text-[#173a31]">Purchased · Your shareable presentation is active for 60 days.</p>
              <p className="mt-2 text-base text-[#344f43]">Your viewing link was emailed to you. You can also open or copy it here.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <a href={`/celebration-of-life-slideshow/${encodeURIComponent(publicId)}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full bg-[#244f40] px-5 py-2 text-base font-bold text-white hover:bg-[#193b30]">
                  Open Viewing Link
                </a>
                <button type="button" onClick={() => void copyViewingLink()}
                  className="min-h-12 rounded-full border-2 border-[#244f40] bg-white px-5 py-2 text-base font-bold text-[#173a31] hover:bg-[#e9f0e8]">
                  Copy Viewing Link
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <BuilderMediaAccordion
              title="Photos"
              icon="photo"
              count={photoItems.length}
              open={photosOpen}
              onToggle={() =>
                setPhotosOpen(
                  (current) => !current
                )
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    photoInputRef.current?.click()
                  }
                  disabled={
                    uploadingPhoto ||
                    uploadingVideo ||
                    uploadingMusic
                  }
                  className="min-h-16 rounded-2xl bg-[#244f40] px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add Photos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCameraOpen(true)
                  }
                  disabled={
                    uploadingPhoto ||
                    uploadingVideo ||
                    uploadingMusic
                  }
                  className="min-h-16 rounded-2xl border-2 border-[#cfc9bd] bg-white px-5 py-4 text-lg font-bold text-[#173a31] transition hover:bg-[#f8f6ef] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Take a Photo
                </button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />

              {photoItems.length === 0 ? (
                <p className="mt-6 text-center text-base text-stone-500">
                  No photos yet.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {photoItems.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-[#dfdad0] bg-white shadow-sm"
                      >
                        {item.photo_url && (
                          <div className="relative">
                            <img
                              src={item.photo_url}
                              alt={`Photo ${
                                index + 1
                              }`}
                              className="aspect-square w-full object-cover"
                            />

                            {presentation?.featuredPhotoUrl ===
                              item.photo_url && (
                              <span className="absolute left-2 top-2 rounded-full bg-[#244f40] px-3 py-1 text-sm font-bold text-white shadow-md">
                                Featured Photo
                              </span>
                            )}
                          </div>
                        )}

                        <div className="p-3">
                          {item.photo_url &&
                            presentation?.featuredPhotoUrl !==
                              item.photo_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  void selectFeaturedPhoto(
                                    item.photo_url || ""
                                  )
                                }
                                className="mb-3 min-h-11 w-full rounded-xl border-2 border-[#587667] bg-[#eef4f0] px-3 py-2 text-base font-bold text-[#173a31] transition hover:bg-[#dfe8e2]"
                              >
                                Make Featured Photo
                              </button>
                            )}

                          <label className="block text-base font-semibold text-stone-800">
                            Caption{" "}
                            <span className="font-normal text-stone-500">
                              (optional)
                            </span>
                          </label>

                          <input
                            type="text"
                            maxLength={500}
                            defaultValue={
                              item.caption || ""
                            }
                            onBlur={(event) => {
                              void saveCaption(
                                item.id,
                                event.target.value
                              );
                            }}
                            className="mt-2 w-full rounded-xl border border-[#d2ccc1] bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-[#587667] focus:ring-2 focus:ring-[#dfe8e2]"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              void removeItem(
                                item.id,
                                "photo"
                              )
                            }
                            className="mt-3 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base font-bold text-red-700 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </BuilderMediaAccordion>

            <BuilderMediaAccordion
              title="Videos"
              icon="video"
              count={videoItems.length}
              open={videosOpen}
              onToggle={() =>
                setVideosOpen(
                  (current) => !current
                )
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    videoInputRef.current?.click()
                  }
                  disabled={
                    uploadingPhoto ||
                    uploadingVideo ||
                    uploadingMusic
                  }
                  className="min-h-16 rounded-2xl bg-[#244f40] px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload a Video
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVideoRecorderOpen(true)
                  }
                  disabled={
                    uploadingPhoto ||
                    uploadingVideo ||
                    uploadingMusic
                  }
                  className="min-h-16 rounded-2xl border-2 border-[#cfc9bd] bg-white px-5 py-4 text-lg font-bold text-[#173a31] transition hover:bg-[#f8f6ef] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Record a Video
                </button>
              </div>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />

              {videoItems.length === 0 ? (
                <p className="mt-6 text-center text-base text-stone-500">
                  No videos yet.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  {videoItems.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-[#dfdad0] bg-white shadow-sm"
                      >
                        {item.mux_playback_id && (
                          <div className="aspect-video bg-black">
                            <MuxPlayer
                              playbackId={
                                item.mux_playback_id
                              }
                              metadata={{
                                video_title: `Video ${
                                  index + 1
                                }`,
                              }}
                              className="h-full w-full"
                            />
                          </div>
                        )}

                        <div className="p-4">
                          <label className="block text-base font-semibold text-stone-800">
                            Caption{" "}
                            <span className="font-normal text-stone-500">
                              (optional)
                            </span>
                          </label>

                          <input
                            type="text"
                            maxLength={500}
                            defaultValue={
                              item.caption || ""
                            }
                            onBlur={(event) => {
                              void saveCaption(
                                item.id,
                                event.target.value
                              );
                            }}
                            className="mt-2 w-full rounded-xl border border-[#d2ccc1] bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-[#587667] focus:ring-2 focus:ring-[#dfe8e2]"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              void removeItem(
                                item.id,
                                "video"
                              )
                            }
                            className="mt-3 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base font-bold text-red-700 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </BuilderMediaAccordion>

            <BuilderMediaAccordion
              title="Music"
              icon="music"
              count={music.length}
              open={musicOpen}
              onToggle={() =>
                setMusicOpen(
                  (current) => !current
                )
              }
            >
              <button
                type="button"
                onClick={() =>
                  musicInputRef.current?.click()
                }
                disabled={
                  uploadingPhoto ||
                  uploadingVideo ||
                  uploadingMusic ||
                  music.length >= 5
                }
                className="min-h-16 w-full rounded-2xl bg-[#244f40] px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Music
              </button>

              <input
                ref={musicInputRef}
                type="file"
                accept=".mp3,.m4a,.aac,.wav,audio/*"
                multiple
                onChange={handleMusicChange}
                className="hidden"
              />

              {music.length === 0 ? (
                <p className="mt-6 text-center text-base text-stone-500">
                  No music yet.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {music.map(
                    (track, index) => (
                      <div
                        key={track.id}
                        className="rounded-2xl border border-[#dfdad0] bg-white p-4 shadow-sm"
                      >
                        <p className="text-base font-bold text-stone-900">
                          {track.title?.trim() ||
                            `Music ${
                              index + 1
                            }`}
                        </p>

                        <audio
                          controls
                          preload="metadata"
                          src={track.source_url}
                          className="mt-3 w-full"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void removeMusic(
                              track.id
                            )
                          }
                          className="mt-3 min-h-11 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base font-bold text-red-700 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </BuilderMediaAccordion>
          </div>

          <ArrangePresentationSection
            items={items}
            movingItemId={movingItemId}
            onMove={moveItem}
          />

          {(uploadingPhoto ||
            uploadingVideo ||
            uploadingMusic) && (
            <p className="mt-5 text-center text-base font-semibold text-stone-700">
              {uploadingMusic
                ? "Adding music..."
                : uploadingVideo
                  ? "Adding video..."
                  : "Adding photo..."}
            </p>
          )}

          {errorMessage && (
            <p
              className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-center text-base font-semibold text-red-700"
              role="alert"
            >
              {
                errorMessage
              }
            </p>
          )}

          {statusMessage && (
            <p
              className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-center text-base font-semibold text-green-800"
              aria-live="polite"
            >
              {
                statusMessage
              }
            </p>
          )}
        </div>
      </main>

      <CameraPhotoCapture
        open={cameraOpen}
        onClose={() =>
          setCameraOpen(false)
        }
        onUsePhoto={async (
          file
        ) => {
          await handlePhotos([
            file,
          ]);
        }}
      />

      <CelebrationVideoRecorder
        open={
          videoRecorderOpen
        }
        onClose={() =>
          setVideoRecorderOpen(
            false
          )
        }
        onUseVideo={async (
          file,
          durationSeconds
        ) => {
          await handleVideo(
            file,
            durationSeconds
          );
        }}
      />
    </>
  );
}
