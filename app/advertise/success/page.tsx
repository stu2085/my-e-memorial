import type { Metadata } from "next";
import AdvertiserSuccessClient from "./AdvertiserSuccessClient";

export const metadata: Metadata = {
  title: {
    absolute: "Advertising Payment Status | MyEMemorial",
  },
  description:
    "View the status of a MyEMemorial advertising payment.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdvertiserSuccessPage() {
  return <AdvertiserSuccessClient />;
}
