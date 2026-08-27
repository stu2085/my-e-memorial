import type { Metadata } from "next";
import GiftClaimClient from "./GiftClaimClient";

export const metadata: Metadata = {
  title: {
    absolute: "Claim Your MyEMemorial Gift | MyEMemorial",
  },
  description:
    "Securely accept and continue a MyEMemorial gift invitation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function GiftClaimPage() {
  return <GiftClaimClient />;
}
