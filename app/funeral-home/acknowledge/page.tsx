import type { Metadata } from "next";
import FuneralHomeAcknowledgeClient from "./FuneralHomeAcknowledgeClient";

export const metadata: Metadata = {
  title: {
    absolute: "Funeral Home Acknowledgement | MyEMemorial",
  },
  description:
    "Secure MyEMemorial funeral home acknowledgement page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function FuneralHomeAcknowledgePage() {
  return <FuneralHomeAcknowledgeClient />;
}
