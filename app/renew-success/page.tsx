import type { Metadata } from "next";
import RenewSuccessClient from "./RenewSuccessClient";

export const metadata: Metadata = {
  title: {
    absolute: "Advertising Renewal Status | MyEMemorial",
  },
  description:
    "MyEMemorial advertising renewal payment status.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RenewSuccessPage() {
  return <RenewSuccessClient />;
}
