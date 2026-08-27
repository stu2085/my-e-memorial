import type { Metadata } from "next";
import MemorialEditClient from "./MemorialEditClient";

export const metadata: Metadata = {
  title: {
    absolute: "Edit MyEMemorial | MyEMemorial",
  },
  description:
    "Private MyEMemorial editing workspace for an authorized memorial owner or Backup Person.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function EditMemorialPage() {
  return <MemorialEditClient />;
}
