import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = {
  title: { absolute: "Create Your Celebration of Life Presentation | MyEMemorial" },
  description: "Begin creating a Celebration of Life Presentation with photographs, video memories, and music to honor someone you love.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) { return children; }
