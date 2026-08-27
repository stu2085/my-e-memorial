import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Memorial Test | MyEMemorial",
  },
  description: "Internal MyEMemorial test page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function MemorialTestPage() {
  return (
    <main style={{ padding: "40px", background: "yellow" }}>
      <h1>TEST PAGE WORKING</h1>
    </main>
  );
}