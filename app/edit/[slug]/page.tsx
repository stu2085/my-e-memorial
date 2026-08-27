import type { Metadata } from "next";
import EditMemorialClient from "./EditMemorialClient";

export const metadata: Metadata = {
  title: {
    absolute: "Edit MyEMemorial | MyEMemorial",
  },
  description:
    "Private MyEMemorial editing workspace.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function EditMemorialPage() {
  return <EditMemorialClient />;
}
