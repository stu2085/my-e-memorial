import type { ReactNode } from "react";

type GuidedLayoutProps = {
  children: ReactNode;
};

export default function GuidedLayout({
  children,
}: GuidedLayoutProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm md:p-10">
      <div className="mx-auto max-w-4xl">
        {children}
      </div>
    </section>
  );
}