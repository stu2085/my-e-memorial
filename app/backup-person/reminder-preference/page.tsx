import type { Metadata } from "next";
import BackupPersonReminderPreferenceClient from "./BackupPersonReminderPreferenceClient";

export const metadata: Metadata = {
  title: {
    absolute: "Backup Person Status | MyEMemorial",
  },
  description:
    "Secure MyEMemorial page for managing a Backup Person reminder preference and role status.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function BackupPersonReminderPreferencePage() {
  return <BackupPersonReminderPreferenceClient />;
}
