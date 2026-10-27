import type { Metadata } from "next";
import OwnerAnnouncementsClient from "./OwnerAnnouncementsClient";
export const metadata: Metadata = { title: "Email Memorial Owners | MyEMemorial", robots: { index: false, follow: false } };
export default function Page() { return <OwnerAnnouncementsClient />; }
