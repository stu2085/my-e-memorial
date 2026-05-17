"use client";

import SideAd from "./SideAd";

export default function MobileAd({
  memorialZip,
  pageType,
}: {
  memorialZip?: string | null;
  pageType?: "memorial" | "create" | "home" | "search" | "personal";
}) {
  return (
  <div className="lg:hidden">
   <div className="[&>div]:!flex [&>div]:!w-full [&>div]:!items-stretch [&>div>div]:!static [&>div>div]:!w-full [&_a]:!h-[200px] [&_img]:!h-[110px]">
      <SideAd memorialZip={memorialZip} pageType={pageType} />
    </div>
  </div>
);
}