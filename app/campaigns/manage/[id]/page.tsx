"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import MuxPlayer from "@mux/mux-player-react";
import { MediaEngine } from "../../../../lib/memorial-engine/MediaEngine";

type CampaignPage = {
  id: number;
  campaign_name: string;
  slug: string;
  caption: string | null;
  headline: string | null;
  story: string | null;
  media_type: "photo" | "video" | null;
  media_url: string | null;
  preview_image_url: string | null;
  primary_cta: "gift" | "sample" | "create" | "learn" | null;
  is_published: boolean;
};

export default function CampaignEditorPage() {
  const params = useParams();
  const id = Number(params.id);

  const [campaign, setCampaign] = useState<CampaignPage | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewImageFile, setPreviewImageFile] =
    useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setMessage("Invalid campaign ID.");
      setIsLoading(false);
      return;
    }

    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    setIsLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in to edit this campaign.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("campaign_pages")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("CAMPAIGN LOAD ERROR:", error);
      setMessage("Could not load this campaign.");
      setIsLoading(false);
      return;
    }

    if (!data) {
      setMessage("Campaign not found.");
      setIsLoading(false);
      return;
    }

    setCampaign(data as CampaignPage);
    setIsLoading(false);
  }

  function updateField<K extends keyof CampaignPage>(
    field: K,
    value: CampaignPage[K]
  ) {
    if (!campaign) return;

    setCampaign({
      ...campaign,
      [field]: value,
    });
  }

  async function uploadFile({
    file,
    userId,
    campaignId,
    prefix,
  }: {
    file: File;
    userId: string;
    campaignId: number;
    prefix: string;
  }) {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "bin";

    const filePath =
      `${userId}/${campaignId}/${prefix}-${Date.now()}.${extension}`;

    const { error: uploadError } =
  await supabase.storage
    .from("campaign-media")
    .upload(filePath, file, {
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } =
      supabase.storage
        .from("campaign-media")
        .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveCampaign(nextPublishedState?: boolean) {
    if (!campaign) return;

    if (!campaign.campaign_name.trim()) {
      alert("Please enter a campaign name.");
      return;
    }

    if (
      campaign.media_type === "photo" &&
      mediaFile &&
      !mediaFile.type.startsWith("image/")
    ) {
      alert("Please choose an image file for a photo campaign.");
      return;
    }

    if (
      campaign.media_type === "video" &&
      mediaFile &&
      !mediaFile.type.startsWith("video/")
    ) {
      alert("Please choose a video file for a video campaign.");
      return;
    }

    if (
      previewImageFile &&
      !previewImageFile.type.startsWith("image/")
    ) {
      alert("The social preview must be an image file.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again.");
      }

      const publishedState =
        typeof nextPublishedState === "boolean"
          ? nextPublishedState
          : campaign.is_published;

      let mediaUrl = campaign.media_url;
      let previewImageUrl = campaign.preview_image_url;

      if (mediaFile) {
  if (campaign.media_type === "video") {
    const uploadedVideos =
      await MediaEngine.uploadVideos({
        videoFiles: [mediaFile],
        videoNotes: [""],
      });

    if (!uploadedVideos[0]?.playbackId) {
      throw new Error(
        "The campaign video could not be uploaded."
      );
    }

    mediaUrl = uploadedVideos[0].playbackId;
  } else {
    mediaUrl = await uploadFile({
      file: mediaFile,
      userId: user.id,
      campaignId: campaign.id,
      prefix: "campaign-photo",
    });
  }
}

      if (campaign.media_type === "photo") {
        if (mediaFile) {
          previewImageUrl = mediaUrl;
        }
      }

      if (
        campaign.media_type === "video" &&
        previewImageFile
      ) {
        previewImageUrl = await uploadFile({
          file: previewImageFile,
          userId: user.id,
          campaignId: campaign.id,
          prefix: "campaign-preview",
        });
      }

      if (
        publishedState &&
        campaign.media_type &&
        !mediaUrl
      ) {
        throw new Error(
          "Please upload campaign media before publishing."
        );
      }

      if (
        publishedState &&
        campaign.media_type === "video" &&
        !previewImageUrl
      ) {
        throw new Error(
          "Please upload a Social Preview Image before publishing a video campaign."
        );
      }

      const { error } = await supabase
        .from("campaign_pages")
        .update({
          campaign_name: campaign.campaign_name.trim(),
          caption: null,
headline: null,
story: campaign.story?.trim() || null,
          media_type: campaign.media_type || null,
          media_url: mediaUrl || null,
          preview_image_url: previewImageUrl || null,
primary_cta: campaign.primary_cta || "gift",
is_published: publishedState,
updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("owner_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setCampaign({
        ...campaign,
        media_url: mediaUrl || null,
        preview_image_url: previewImageUrl || null,
        is_published: publishedState,
      });

      setMediaFile(null);
      setPreviewImageFile(null);

      setMessage(
        publishedState
          ? "Campaign saved and published."
          : "Campaign saved."
      );
    } catch (error) {
      console.error("CAMPAIGN SAVE ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save campaign."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-stone-600">
            Loading campaign...
          </p>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-red-700">
            {message || "Campaign not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Campaign Editor
              </p>

              <h1 className="mt-3 text-3xl font-bold text-stone-900">
                {campaign.campaign_name}
              </h1>

              <p className="mt-2 text-sm text-stone-500">
                Permanent URL: /campaign/{campaign.slug}
              </p>
            </div>

            <a
              href="/campaigns/manage"
              className="w-fit rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Back to Campaigns
            </a>
          </div>
        </section>

        {message && (
          <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-700">
              {message}
            </p>
          </section>
        )}

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">
            Campaign Content
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-800">
                Campaign Name
              </label>

              <input
                type="text"
                value={campaign.campaign_name}
                onChange={(e) =>
                  updateField(
                    "campaign_name",
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
            </div>

           

           

            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-800">
                Continuation Text (Optional)
              </label>

              <textarea
                value={campaign.story || ""}
                onChange={(e) =>
                  updateField(
                    "story",
                    e.target.value
                  )
                }
                rows={6}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                placeholder="Enter only the text that continues from the social media post. Leave blank if the video or photos continue the message."
              />
            </div>
            <div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Primary Campaign Action
  </label>

  <select
    value={campaign.primary_cta || "gift"}
    onChange={(e) =>
      updateField(
        "primary_cta",
        e.target.value as
          | "gift"
          | "sample"
          | "create"
          | "learn"
      )
    }
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
  >
    <option value="gift">
      Gift a MyEMemorial
    </option>

    <option value="sample">
      Experience a Sample MyEMemorial
    </option>

    <option value="create">
      Create a MyEMemorial
    </option>

    <option value="learn">
      Learn More About MyEMemorial
    </option>
  </select>

  <p className="mt-2 text-sm text-stone-500">
    This action will appear first and be highlighted on the campaign page.
  </p>
</div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">
            Media
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Choose one photo or one video for this campaign.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-800">
                Media Type
              </label>

              <select
                value={campaign.media_type || ""}
                onChange={(e) => {
                  const nextType =
                    (e.target.value || null) as
                      | "photo"
                      | "video"
                      | null;

                  updateField(
                    "media_type",
                    nextType
                  );

                  setMediaFile(null);
                  setPreviewImageFile(null);
                }}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none"
              >
                <option value="">
                  No media
                </option>
                <option value="photo">
                  Photo
                </option>
                <option value="video">
                  Video
                </option>
              </select>
            </div>

            {campaign.media_type && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-800">
                  {campaign.media_type === "video"
                    ? "Upload Video"
                    : "Upload Photo"}
                </label>

                <input
                  type="file"
                  accept={
                    campaign.media_type === "video"
                      ? "video/*"
                      : "image/*"
                  }
                  onChange={(e) =>
                    setMediaFile(
                      e.target.files?.[0] || null
                    )
                  }
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"
                />

                {mediaFile && (
                  <p className="mt-2 text-sm text-stone-600">
                    Selected: {mediaFile.name}
                  </p>
                )}

                {campaign.media_url &&
                  !mediaFile && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-green-700">
                        Current media
                      </p>

                      {campaign.media_type === "video" ? (
                        <MuxPlayer
  playbackId={campaign.media_url}
  streamType="on-demand"
  className="mt-3 w-full overflow-hidden rounded-2xl bg-black"
/>
                      ) : (
                        <img
                          src={campaign.media_url}
                          alt="Current campaign media"
                          className="mt-3 max-h-80 w-full rounded-2xl object-contain"
                        />
                      )}
                    </div>
                  )}
              </div>
            )}

            {campaign.media_type === "photo" && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-sm font-semibold text-stone-800">
                  Social Preview Image
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  The campaign photo will automatically be used as the social preview image when this link is shared.
                </p>

                {campaign.preview_image_url && (
                  <img
                    src={campaign.preview_image_url}
                    alt="Social preview"
                    className="mt-4 max-h-56 rounded-xl object-contain"
                  />
                )}
              </div>
            )}

            {campaign.media_type === "video" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-800">
                  Social Preview Image
                </label>

                <p className="mb-3 text-sm leading-6 text-stone-600">
                  Choose the image Facebook or Instagram should show when the campaign link is shared.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPreviewImageFile(
                      e.target.files?.[0] || null
                    )
                  }
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"
                />

                {previewImageFile && (
                  <p className="mt-2 text-sm text-stone-600">
                    Selected: {previewImageFile.name}
                  </p>
                )}

                {campaign.preview_image_url &&
                  !previewImageFile && (
                    <img
                      src={campaign.preview_image_url}
                      alt="Current social preview"
                      className="mt-4 max-h-56 rounded-xl object-contain"
                    />
                  )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">
            Save & Publish
          </h2>

          <p className="mt-2 text-sm text-stone-600">
            Saving changes does not change the campaign's permanent URL.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => saveCampaign()}
              className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>

            {!campaign.is_published ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  saveCampaign(true)
                }
                className="rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Publishing..."
                  : "Publish Campaign"}
              </button>
            ) : (
              <>
                <a
                  href={`/campaign/${campaign.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  View Live Page
                </a>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    saveCampaign(false)
                  }
                  className="rounded-full border border-red-300 bg-white px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Unpublish
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}