"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Advertiser = {
  id: number;
  business_name: string;
  business_type: string | null;
  ad_image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  service_zip: string | null;
  is_active: boolean | null;
  expires_at: string | null;
};

export default function SideAd({
  memorialZip,
  pageType,
  forcedCategory,
  categorySlot,
}: {
  memorialZip?: string | null;
  pageType?: "memorial" | "create" | "home" | "search" | "personal" | "edit";
  forcedCategory?: string;
  categorySlot?: string;
}) {
  const [ad, setAd] = useState<Advertiser | null>(null);
  const displayCategory = categorySlot || forcedCategory;

  useEffect(() => {
    async function fetchAd() {
      

      const today = new Date().toISOString();
      if ((pageType === "home" || pageType === "search") && !memorialZip) {
  setAd(null);
  return;
}
      let allowedCategories: string[] = [];

if (pageType === "memorial") {
  allowedCategories = ["flower_shop"];
}

if (pageType === "create") {
  allowedCategories = [
    "funeral_home",
    "attorney",
    "cemetery",
    "monument_company",
  ];
}

if (pageType === "personal" || pageType === "edit") {
  allowedCategories = [
    "estate_planner",
    "attorney",
    "funeral_home",
    "cemetery",
    "monument_company",
  ];
}

if (pageType === "home" || pageType === "search") {
  allowedCategories = displayCategory
    ? [displayCategory]
    : [
        "estate_planner",
        "attorney",
        "funeral_home",
        "monument_company",
      ];
}
if (categorySlot) {
  allowedCategories = [categorySlot];
}
      let query = supabase
  .from("advertisers")
  .select(
    "id, business_name, business_type, ad_image_url, cta_label, cta_url, service_zip, is_active, expires_at"
  )
  .eq("is_active", true)
  .gt("expires_at", today)
  .limit(20);

if (pageType === "memorial") {
  if (!memorialZip) {
    setAd(null);
    return;
  }

  query = query
    .eq("service_zip", memorialZip)
    .eq("business_type", "flower_shop");
} else {
  if (memorialZip) {
    query = query.eq("service_zip", memorialZip);
  }

  if (allowedCategories.length > 0) {
    query = query.in("business_type", allowedCategories);
  }
}

const { data, error } = await query;

if (error) {
  console.error("AD FETCH ERROR:", error);
  return;
}

const ads = (data as Advertiser[]) || [];

if (ads.length === 0) {
  setAd(null);
  return;
}

if (forcedCategory) {
  
  setAd(ads[0] || null);
  return;
}

setAd(ads[0] || null);
    }

    fetchAd();
  }, [memorialZip, pageType, forcedCategory, categorySlot]);

  if (!ad) {
    return (
      <div
  className={`hidden lg:flex flex-col items-center ${
    pageType === "home"
  ? "w-full"
  : pageType === "memorial"
  ? "w-[460px]"
  : "w-[200px]"
  }`}
>
        <div className="sticky top-24 w-full">
          <a
  href={
  displayCategory
    ? `/advertise?category=${displayCategory}`
    : "/advertise"
}
  className="flex h-[600px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-stone-400 bg-white px-3 text-center text-sm text-stone-600 transition hover:border-amber-500 hover:bg-amber-50"
>
  <span className="text-base font-bold text-stone-900">
    Advertise Here
  </span>

  {pageType === "memorial" && (
    <span className="mt-3 leading-5">
      Flower Shops<br />
      Reach visitors ordering flowers for this gravesite.
    </span>
  )}

  {pageType === "create" && (
    <span className="mt-3 leading-5">
      Funeral Homes, Attorneys, Cemeteries, Monument Companies
      <br />
      Exclusive local placement available.
    </span>
  )}

  {pageType === "personal" && (
    <span className="mt-3 leading-5">
      Estate Planners, Attorneys, Funeral Homes, Cemeteries, Monument Companies
      <br />
      Reach families planning ahead.
    </span>
  )}

  {(pageType === "home" || pageType === "search") && (
  <span className="mt-3 leading-5">
    {displayCategory === "attorney" && (
      <>
        Attorneys
        <br />
        Exclusive local placement available.
      </>
    )}

    {displayCategory === "estate_planner" && (
      <>
        Estate Planners
        <br />
        Reach families planning ahead.
      </>
    )}

    {displayCategory === "funeral_home" && (
      <>
        Funeral Homes
        <br />
        Reach local families in need.
      </>
    )}

    {displayCategory === "monument_company" && (
      <>
        Monument Companies
        <br />
        Promote memorial and headstone services.
      </>
    )}

    {!displayCategory && (
      <>
        Local memorial-related businesses
        <br />
        Exclusive ZIP-code ad placement available.
      </>
    )}
  </span>
)}

  <span className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white">
    Create Your Ad
  </span>
</a>
        </div>
      </div>
    );
  }

  return (
  <div
    className={`hidden lg:flex flex-col items-center ${
      pageType === "home"
        ? "w-full"
        : pageType === "memorial"
        ? "w-[360px]"
        : "w-[200px]"
    }`}
  >
    <div className="sticky top-24 w-full">
        <a
          href={`/api/ad-click?id=${ad.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[600px] flex-col justify-between rounded-xl border border-stone-300 bg-white p-3 text-center shadow-sm transition hover:shadow-md"
        >
          <p className="mb-2 text-xs text-stone-500">Sponsored</p>

          {ad.ad_image_url ? (
            <img
              src={ad.ad_image_url}
              alt={ad.business_name}
              className="h-[360px] w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-lg bg-stone-100 p-3 text-sm font-semibold text-stone-700">
              {ad.business_name}
            </div>
          )}

          {pageType === "memorial" && (
  <p className="mt-3 text-xs font-semibold leading-5 text-stone-700">
    Click here to deliver flowers to gravesite
  </p>
)}



<p className="mt-3 text-sm font-semibold text-stone-900">
  {ad.cta_label || "Learn More"}
</p>
            
        </a>
      </div>
    </div>
  );
}