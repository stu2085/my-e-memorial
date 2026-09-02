import type { Metadata } from "next";
import ReviewSubmissionClient from "./ReviewSubmissionClient";

export const metadata: Metadata = {
  title: {
    absolute:
      "Review Submitted Memory | MyEMemorial",
  },
  description:
    "Private MyEMemorial owner review page for a submitted memory.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ReviewSubmissionPage() {
  return <ReviewSubmissionClient />;
}
