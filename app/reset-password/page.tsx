import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: {
    absolute: "Reset Password | MyEMemorial",
  },
  description: "Reset your MyEMemorial account password.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
