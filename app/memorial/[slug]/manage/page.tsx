import type { Metadata } from "next";
import ManageMemorialClient from "./ManageMemorialClient";

export const metadata: Metadata = {
  title: {
    absolute: "Manage MyEMemorial | MyEMemorial",
  },
  description:
    "Manage a MyEMemorial, review permitted contributions, plan features, and authorized memorial controls.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ManageMemorialPage() {
  return <ManageMemorialClient />;
}
