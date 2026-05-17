"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdvertisePage() {
  const [mounted, setMounted] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("flower_shop");
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");

  if (category) {
    setBusinessType(category);
  }

  setMounted(true);
}, []);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [serviceZip, setServiceZip] = useState("");
  const [billingPlan, setBillingPlan] = useState("monthly");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    try {
      const zip = serviceZip.trim();
      if (!/^\d{5}$/.test(zip)) {
  setMessage("Please enter a valid 5-digit ZIP code.");
  setIsSubmitting(false);
  return;
}

      const { data: existingAdvertiser, error: checkError } = await supabase
        .from("advertisers")
        .select("id")
        .eq("service_zip", zip)
.eq("business_type", businessType)
.eq("active", true)
.gt("expires_at", new Date().toISOString())
.maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      if (existingAdvertiser) {
        setMessage(
  `Sorry, this ZIP code already has an active ${businessType
    .replaceAll("_", " ")
    .toLowerCase()} advertiser.`
);
        setIsSubmitting(false);
        return;
      }
let fixedUrl = ctaUrl.trim().toLowerCase();

if (fixedUrl && !fixedUrl.startsWith("http://") && !fixedUrl.startsWith("https://")) {
  fixedUrl = "https://" + fixedUrl;
}

      const advertiserRes = await fetch("/api/create-advertiser", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    business_name: businessName,
    business_type: businessType,
    contact_name: contactName,
    advertiser_email: email,
    phone,
    cta_url: fixedUrl,
    cta_label: getCtaLabel(businessType),
    service_zip: zip,
    billing_plan: billingPlan,
    active: false,
  }),
});

const advertiserData = await advertiserRes.json();

if (!advertiserRes.ok) {
  throw new Error(
    advertiserData.error || "Could not create advertiser."
  );
}
function getBillingAmount(plan: string) {
  switch (plan) {
    case "quarterly":
      return 27900;
    case "yearly":
      return 99900;
    default:
      return 9900;
  }
}
const checkoutRes = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  plan: "advertiser",
  amount: getBillingAmount(billingPlan),
  billingPlan,
  returnUrl: `${
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  }/advertise/success`,
  advertiserId: advertiserData.advertiserId,
  isRenewal: false,
}),
});

const checkoutData = await checkoutRes.json();

if (checkoutData.url) {
  window.location.href = checkoutData.url;
  return;
}

throw new Error("Could not start payment checkout.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }
function getCtaLabel(type: string) {
  switch (type) {
    case "flower_shop":
      return "Order Flowers";
    case "funeral_home":
      return "Pre-Plan Funeral";
    case "attorney":
  return "Contact Attorney";
    case "estate_planner":
      return "Plan Your Estate";
    case "cemetery":
      return "Buy Burial Plot";
    case "monument_company":
      return "Order Headstone";
    default:
      return "Learn More";
  }
}
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
  Advertise on MyEMemorial
</h1>

        <p className="mt-3 text-stone-600">
  Own exclusive ZIP-code advertising placement on MyEMemorial and
  connect with local families in your community.
</p>

        <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Local advertising starting at
          ZIP code.
        </p>
<form onSubmit={handleSubmit} className="mt-8 space-y-5">
  <div>
    <label className="mb-2 block text-sm font-semibold text-stone-800">
      Type of Business
    </label>

    <select
      value={businessType}
      onChange={(e) => setBusinessType(e.target.value)}
      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
    >
      <option value="flower_shop">Flower Shop</option>
      <option value="funeral_home">Funeral Home</option>
      <option value="attorney">Attorney</option>
      <option value="estate_planner">Estate Planner</option>
      <option value="cemetery">Cemetery Plot Sales</option>
      <option value="monument_company">Monument Company</option>
    </select>
    <div className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
  {businessType === "flower_shop" && (
    <p>
      Flower Shop ads appear on public memorial pages only and are matched to
      the memorial’s final resting place ZIP code.
    </p>
  )}

  {businessType === "attorney" && (
    <p>
      Attorney ads appear on homepage, search, create memorial, and personal
      memorial planning pages matched by visiter's ZIP code.
    </p>
  )}

  {businessType === "estate_planner" && (
    <p>
      Estate Planner ads appear on homepage, search, create memorial, and
      personal memorial planning pages matched by visiter's ZIP code.
    </p>
  )}

  {businessType === "funeral_home" && (
    <p>
      Funeral Home ads appear on homepage, search, create memorial, and
      personal memorial planning pages matched by visiter's ZIP code.
    </p>
  )}

  {businessType === "cemetery" && (
    <p>
      Cemetery ads appear on create memorial and personal memorial planning
      pages matched by visiter's ZIP code.
    </p>
  )}

  {businessType === "monument_company" && (
    <p>
      Monument Company ads appear on homepage, search, create memorial, and
      personal memorial planning pages matched by visiter's ZIP code.
    </p>
  )}
</div>
    
  </div>
<div>
  <label className="mb-3 block text-sm font-semibold text-stone-800">
    Choose Your Billing Plan
  </label>

  <div className="grid gap-4 md:grid-cols-3">
    {[
      {
        value: "monthly",
        title: "Monthly",
        price: "$99",
        note: "per month",
        badge: "Lowest Cost",
      },
      {
        
        value: "quarterly",
        title: "Quarterly",
        price: "$279",
        note: "per quarter",
        badge: "Most Popular",
      },
      {
        value: "yearly",
        title: "Yearly",
        price: "$999",
        note: "per year",
        badge: "Save $189",
      },
    ].map((plan) => (
     <button
  key={plan.value}
  type="button"
  onClick={() => setBillingPlan(plan.value)}
  className={`relative rounded-2xl border p-4 text-left transition ${
          billingPlan === plan.value
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-300 bg-white text-stone-900 hover:border-stone-500"
        }`}
      >
        {plan.badge === "Most Popular" && (
  <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-stone-900 shadow">
    Most Popular
  </span>
)}
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {plan.badge}
        </p>
        <p className="mt-2 text-lg font-bold">{plan.title}</p>
        <p className="mt-2 text-3xl font-bold">{plan.price}</p>
        <p className="text-sm opacity-80">{plan.note}</p>
      </button>
    ))}
  </div>

  <p className="mt-3 text-sm text-stone-600">
    Start with monthly for only $99. Upgrade to quarterly or yearly anytime.
  </p>
</div>
  <Input
    label="Business Name"
    value={businessName}
    onChange={setBusinessName}
    required
  />

  <Input
    label="Contact Name"
    value={contactName}
    onChange={setContactName}
  />

  <Input
    label="Email"
    type="email"
    value={email}
    onChange={setEmail}
    required
  />

  <Input
    label="Phone"
    value={phone}
    onChange={setPhone}
  />

  <Input
  label="Website / Action Link"
  type="text"
  value={ctaUrl}
  onChange={setCtaUrl}
  required
/>
<p className="-mt-3 text-xs text-stone-500">
  Enter your website, for example: flowershop.com
</p>
  <Input
    label="ZIP Code to Advertise In"
    value={serviceZip}
    onChange={setServiceZip}
    required
  />

  {message && (
    <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
      {message}
    </p>
  )}

  <button
    type="submit"
    disabled={isSubmitting}
    className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isSubmitting ? "Opening payment..." : "Reserve ZIP Code and Continue to Payment"}
  </button>
</form>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
      />
    </div>
  );
}