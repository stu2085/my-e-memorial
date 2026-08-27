import type { Metadata } from "next";
import RenewClient from "./RenewClient";

export const metadata: Metadata = {
  title: {
    absolute: "Renew Advertising | MyEMemorial",
  },
  description:
    "Secure MyEMemorial advertising renewal page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RenewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RenewClient params={params} />;
}
