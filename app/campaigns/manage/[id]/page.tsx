import type { Metadata } from "next";
import CampaignEditorClient from "./CampaignEditorClient";

export const metadata: Metadata = {
  title: {
    absolute: "Edit Campaign | MyEMemorial",
  },
  description:
    "Private MyEMemorial workspace for editing and publishing a social campaign landing page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CampaignEditorPage() {
  return <CampaignEditorClient />;
}
