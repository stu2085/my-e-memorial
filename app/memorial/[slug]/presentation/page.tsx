import type { Metadata } from "next";
import CelebrationOfLifePresentationClient from "./CelebrationOfLifePresentationClient";

export const metadata: Metadata = {
  title: {
    absolute: "Celebration of Life Presentation | MyEMemorial",
  },
  description:
    "View an authorized MyEMemorial Celebration of Life Presentation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PresentationPage() {
  return <CelebrationOfLifePresentationClient />;
}
