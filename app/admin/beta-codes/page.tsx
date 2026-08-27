import type { Metadata } from "next";
import BetaCodesAdminClient from "./BetaCodesAdminClient";

export const metadata: Metadata = {
  title: {
    absolute: "Promo Code Admin | MyEMemorial",
  },
  description:
    "Private MyEMemorial administration page for promotional access codes.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function BetaCodesAdminPage() {
  return <BetaCodesAdminClient />;
}
