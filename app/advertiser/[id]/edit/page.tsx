"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EditAdvertiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
  business_name: "",
  business_type: "",
  service_zip: "",
  ad_image_url: "",
  cta_label: "",
  cta_url: "",
  billing_plan: "",
  expires_at: "",
  active: false,
});

  useEffect(() => {
    async function loadAdvertiser() {
      if (!token) {
        setError("Missing access token.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/get-advertiser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          token,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError("Unauthorized or advertiser not found.");
        setLoading(false);
        return;
      }

      setForm({
  business_name: data.advertiser.business_name || "",
  business_type: data.advertiser.business_type || "",
  service_zip: data.advertiser.service_zip || "",
  ad_image_url: data.advertiser.ad_image_url || "",
  cta_label: data.advertiser.cta_label || "",
  cta_url: data.advertiser.cta_url || "",
  billing_plan: data.advertiser.billing_plan || "",
  expires_at: data.advertiser.expires_at || "",
  active: data.advertiser.is_active || false,
});

      setLoading(false);
    }

    loadAdvertiser();
  }, [id, token]);

  const handleSave = async () => {
    const res = await fetch("/api/update-advertiser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        token,
        ...form,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Ad updated successfully");
    } else {
      alert("Update failed");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-stone-50 flex justify-center p-6">
      <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">
          Edit Your Advertisement
        </h1>
<div className="mb-6 rounded-xl bg-stone-100 p-4 text-sm text-stone-700">
  <p>
    <strong>Status:</strong>{" "}
    {form.active ? (
      <span className="text-green-600">Active</span>
    ) : (
      <span className="text-red-600">Inactive</span>
    )}
  </p>

  <p className="mt-2">
    <strong>ZIP Code:</strong> {form.service_zip}
  </p>

  <p className="mt-2">
    <strong>Billing Plan:</strong>{" "}
    {form.billing_plan
      ? form.billing_plan.charAt(0).toUpperCase() +
        form.billing_plan.slice(1)
      : "N/A"}
  </p>

  <p className="mt-2">
    <strong>Advertising Expires:</strong>{" "}
    {form.expires_at
      ? new Date(form.expires_at).toLocaleDateString()
      : "N/A"}
  </p>
</div>
        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="Business Name"
          value={form.business_name}
          onChange={(e) =>
            setForm({ ...form, business_name: e.target.value })
          }
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="Ad Image URL"
          value={form.ad_image_url}
          onChange={(e) =>
            setForm({ ...form, ad_image_url: e.target.value })
          }
        />

        

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="CTA Label"
          value={form.cta_label}
          onChange={(e) =>
            setForm({ ...form, cta_label: e.target.value })
          }
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="https://yourwebsite.com"
          value={form.cta_url}
          onChange={(e) =>
            setForm({ ...form, cta_url: e.target.value })
          }
        />
<div className="mb-4">
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Billing Plan
  </label>

  <select
    value={form.billing_plan}
    onChange={(e) =>
      setForm({ ...form, billing_plan: e.target.value })
    }
    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
  >
    <option value="monthly">Monthly — $99/month</option>
    <option value="quarterly">Quarterly — $279/quarter</option>
    <option value="yearly">Yearly — $999/year</option>
  </select>
</div>

<button
  onClick={async () => {
    const amount =
      form.billing_plan === "yearly"
        ? 99900
        : form.billing_plan === "quarterly"
          ? 27900
          : 9900;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: "advertiser",
        amount,
        advertiserId: id,
        billingPlan: form.billing_plan,
        isRenewal: true,
        returnUrl: `${window.location.origin}/advertise/success`,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Could not start renewal checkout.");
    }
  }}
  className="mb-4 w-full rounded-md bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600"
>
  Renew / Change Billing Plan
</button>
{form.ad_image_url && (
  <div className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
    <p className="mb-3 text-sm font-semibold text-stone-700">
      Live Ad Preview
    </p>

    <div className="rounded-xl border border-stone-300 bg-white p-3 text-center shadow-sm">
      <p className="mb-2 text-xs text-stone-500">
        Sponsored
      </p>

      <img
        src={form.ad_image_url}
        alt="Ad Preview"
        className="mx-auto rounded-lg"
      />

      <p className="mt-3 text-sm font-semibold text-stone-900">
        {form.cta_label || "Learn More"}
      </p>
    </div>
  </div>
)}
        <button
          onClick={handleSave}
          className="w-full bg-black text-white py-3 rounded-md"
        >
          Save Advertisement Changes
        </button>
      </div>
    </div>
  );
}