import type { Metadata } from "next";
import CampaignManagerClient from "./CampaignManagerClient";

export const metadata: Metadata = {
  title: {
    absolute: "Manage Campaigns | MyEMemorial",
  },
  description:
    "Private MyEMemorial workspace for creating and managing social campaign landing pages.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CampaignManagerPage() {
  return <CampaignManagerClient />;
}
