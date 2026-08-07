"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  is_published: boolean;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CampaignManagerPage() {
  const [campaigns, setCampaigns] = useState<CampaignPage[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
  setIsLoading(true);
  setErrorMessage("");

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    if (sessionError || !user) {
      setErrorMessage(
        "Please sign in to manage campaign pages."
      );
      return;
    }

    const { data, error } = await supabase
      .from("campaign_pages")
      .select(
        `
          id,
          campaign_name,
          slug,
          caption,
          headline,
          story,
          media_type,
          media_url,
          preview_image_url,
          is_published
        `
      )
      .eq("owner_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "CAMPAIGN LOAD ERROR:",
        error
      );

      setErrorMessage(
        `Could not load campaign pages: ${error.message}`
      );

      return;
    }

    setCampaigns((data || []) as CampaignPage[]);
  } catch (error) {
    console.error(
      "CAMPAIGN LOAD ERROR:",
      error
    );

    setErrorMessage(
      error instanceof Error
        ? `Could not load campaign pages: ${error.message}`
        : "Could not load campaign pages."
    );
  } finally {
    setIsLoading(false);
  }
}

  async function handleCreateCampaign() {
    const trimmedName = campaignName.trim();

    if (!trimmedName) {
      alert("Please enter a campaign name.");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Please sign in to create a campaign."
        );
      }

      const baseSlug =
        createSlug(trimmedName) ||
        `campaign-${Date.now()}`;

      let finalSlug = baseSlug;

      const { data: existingSlug } =
        await supabase
          .from("campaign_pages")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle();

      if (existingSlug) {
        finalSlug =
          `${baseSlug}-${Date.now()}`;
      }

      const { data, error } = await supabase
        .from("campaign_pages")
        .insert({
          owner_id: user.id,
          campaign_name: trimmedName,
          slug: finalSlug,
          headline:
            "Preserve your life story or someone else’s.",
          is_published: false,
        })
        .select("id, slug")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "The campaign could not be created."
        );
      }

      window.location.assign(
        `/campaigns/manage/${data.id}`
      );
    } catch (error) {
      console.error(
        "CAMPAIGN CREATE ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not create campaign."
      );

      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            MyEMemorial Campaigns
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-900 md:text-4xl">
            Social Campaign Landing Pages
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
            Create a separate landing page for each Facebook or Instagram campaign.
            Each campaign keeps its own permanent URL, and you can return here later
            to update the story, media, or message without changing that link.
          </p>
        </section>

        {errorMessage && (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm text-red-700">
              {errorMessage}
            </p>
          </section>
        )}

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">
            Create a New Campaign
          </h2>

          <p className="mt-2 text-sm text-stone-600">
            Give the campaign a private working name so you can identify it later.
          </p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={campaignName}
              onChange={(event) =>
                setCampaignName(event.target.value)
              }
              placeholder="Example: Do You Know Your Father's Whole Story?"
              className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            />

            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreateCampaign}
              className="rounded-full bg-stone-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating
                ? "Creating..."
                : "Create Campaign"}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                Your Campaigns
              </h2>

              <p className="mt-2 text-sm text-stone-600">
                Open any campaign to edit or publish it.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCampaigns}
              className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-stone-500">
              Loading campaigns...
            </p>
          ) : campaigns.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
              <p className="text-stone-600">
                No campaigns have been created yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 p-5 md:flex-row md:items-center"
                >
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">
                      {campaign.campaign_name}
                    </h3>

                    <p className="mt-1 text-sm text-stone-500">
                      /campaign/{campaign.slug}
                    </p>

                    <p
                      className={`mt-2 text-sm font-semibold ${
                        campaign.is_published
                          ? "text-green-700"
                          : "text-amber-700"
                      }`}
                    >
                      {campaign.is_published
                        ? "Published"
                        : "Draft"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {campaign.is_published && (
                      <a
                        href={`/campaign/${campaign.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                      >
                        View Page
                      </a>
                    )}

                    <a
                      href={`/campaigns/manage/${campaign.id}`}
                      className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                    >
                      Edit Campaign
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}