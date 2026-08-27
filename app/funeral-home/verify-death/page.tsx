import type { Metadata } from "next";
import VerifyDeathClient from "./VerifyDeathClient";

export const metadata: Metadata = {
  title: {
    absolute: "Death Verification | MyEMemorial",
  },
  description:
    "Secure MyEMemorial funeral home death-verification page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function VerifyDeathPage() {
  return <VerifyDeathClient />;
}
