"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Advertiser = {
  id: number;
  business_name: string | null;
  advertiser_email: string | null;
  business_type: string | null;
  service_zip: string | null;
  ad_image_url: string | null;
  expires_at: string | null;
  is_active: boolean | null;
clicks: number | null;
};

export default function AdvertiserDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function markRenewed(ad: Advertiser) {
    const currentExpiration = ad.expires_at
      ? new Date(ad.expires_at)
      : new Date();

    const today = new Date();
    const startDate = currentExpiration > today ? currentExpiration : today;

    const newExpiration = new Date(startDate);
    newExpiration.setFullYear(newExpiration.getFullYear() + 1);

    const { error } = await supabase
      .from("advertisers")
      .update({
        expires_at: newExpiration.toISOString(),
        is_active: true,
      })
      .eq("id", ad.id);

    if (error) {
      console.error("Renewal update error:", error);
      alert("Payment worked, but expiration date was not updated.");
      return;
    }

const emailRes = await fetch("/api/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: ad.advertiser_email,
    subject: "Your MyEMemorial Advertising Has Been Renewed",
    html: `
      <p>Hello,</p>
      <p>Your advertising has been successfully renewed.</p>
      <p>Your new expiration date is: <strong>${newExpiration.toDateString()}</strong></p>
      <p>Thank you for continuing to advertise with MyEMemorial.</p>
    `,
  }),
});

const emailResult = await emailRes.json();

    setAdvertiser({
      ...ad,
      expires_at: newExpiration.toISOString(),
      is_active: true,
    });
  }

  useEffect(() => {
    async function loadAdvertiser() {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (error) {
        console.error("Advertiser dashboard error:", error);
        setErrorMessage("Could not load advertiser.");
        setLoading(false);
        return;
      }

      setAdvertiser(data);
      setLoading(false);

      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.get("renewed") === "true") {
        await markRenewed(data);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    loadAdvertiser();
  }, [id]);

  async function handleRenew() {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "advertiser_renewal",
          amount: 9900,
          returnUrl: `${window.location.origin}${window.location.pathname}?renewed=true`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting checkout.");
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (errorMessage) return <p className="p-6 text-red-600">{errorMessage}</p>;
  if (!advertiser) return <p className="p-6">No advertiser found.</p>;

  return (
    <main className="min-h-screen bg-stone-100 p-6">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Advertiser Dashboard</h1>

        <h2 className="text-xl font-semibold">
          {advertiser.business_name || "Unnamed Business"}
        </h2>

        <p className="mt-2">
          Category: {advertiser.business_type || "Not set"}
        </p>

        <p>Zip: {advertiser.service_zip || "Not set"}</p>
<p>
  Status:{" "}
  <strong className={advertiser.is_active ? "text-green-700" : "text-red-700"}>
    {advertiser.is_active ? "Active" : "Inactive"}
  </strong>
</p>

<p>
  Total Clicks: <strong>{advertiser.clicks ?? 0}</strong>
</p>
        <p>
          Expires:{" "}
          {advertiser.expires_at
            ? new Date(advertiser.expires_at).toLocaleDateString()
            : "Not set"}
        </p>

        {advertiser.ad_image_url && (
          <img
            src={advertiser.ad_image_url}
            alt={advertiser.business_name || "Advertiser ad"}
            className="mt-4 h-32 w-52 rounded-lg border object-cover"
          />
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleRenew}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Renew
          </button>

          <a
            href={`/advertiser-edit?id=${advertiser.id}`}
            className="rounded border px-4 py-2"
          >
            Edit
          </a>
        </div>
      </div>
    </main>
  );
}