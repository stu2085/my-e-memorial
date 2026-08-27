import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: {
    absolute: "Log In | MyEMemorial",
  },
  description:
    "Log in to MyEMemorial to access your memorials or use authorized Backup Person access.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
