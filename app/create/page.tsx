import type { Metadata } from "next";
import CreateClient from "./CreateClient";

export const metadata: Metadata = {
  title: {
    absolute: "Create or Edit a MyEMemorial | MyEMemorial",
  },
  description:
    "Create, continue, or edit a MyEMemorial using the Guided Memory Builder.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CreatePage() {
  return <CreateClient />;
}
