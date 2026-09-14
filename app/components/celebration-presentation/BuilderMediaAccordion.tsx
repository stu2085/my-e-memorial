"use client";

import { ReactNode } from "react";

type BuilderMediaAccordionProps = {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  icon: "photo" | "video" | "music";
  children: ReactNode;
};

function SectionIcon({
  icon,
}: {
  icon: "photo" | "video" | "music";
}) {
  if (icon === "photo") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m5 17 4.5-4.5 3 3 2-2L19 18" />
      </svg>
    );
  }

  if (icon === "video") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="5" width="13" height="14" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18V5l10-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  );
}

export default function BuilderMediaAccordion({
  title,
  count,
  open,
  onToggle,
  icon,
  children,
}: BuilderMediaAccordionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#d8d3c7] bg-white/95 shadow-[0_6px_18px_rgba(64,50,30,0.10)] backdrop-blur-[2px]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[68px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#faf8f1] sm:px-6"
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#244f40] text-white shadow-sm">
            <SectionIcon icon={icon} />
          </span>

          <span className="font-serif text-[24px] font-bold leading-none text-[#173a31]">
            {title} ({count})
          </span>
        </span>

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-7 w-7 shrink-0 text-[#244f40] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[#e2ddd2] bg-white/80 p-5 sm:p-6">
          {children}
        </div>
      )}
    </section>
  );
}
