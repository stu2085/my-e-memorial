import type { Metadata } from "next";
import MyMemorialsClient from "./MyMemorialsClient";

export const metadata: Metadata = {
  title: {
    absolute: "MyEMemorials | MyEMemorial",
  },
  description:
    "View and manage the MyEMemorials associated with your account.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function MyMemorialsPage() {
  return <MyMemorialsClient />;
}
