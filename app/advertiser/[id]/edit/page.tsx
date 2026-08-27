import type { Metadata } from "next";
import EditAdvertiserClient from "./EditAdvertiserClient";

export const metadata: Metadata = {
  title: {
    absolute: "Edit Advertisement | MyEMemorial",
  },
  description:
    "Manage an authorized MyEMemorial advertisement.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function EditAdvertiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditAdvertiserClient params={params} />;
}
