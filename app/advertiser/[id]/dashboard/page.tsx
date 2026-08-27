import type { Metadata } from "next";
import AdvertiserDashboardClient from "./AdvertiserDashboardClient";

export const metadata: Metadata = {
  title: {
    absolute: "Advertiser Dashboard | MyEMemorial",
  },
  description:
    "View and manage an authorized MyEMemorial advertiser account.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdvertiserDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AdvertiserDashboardClient params={params} />;
}
