"use client";

import { useEffect, useRef, useState } from "react";

type ChapterNavItem = {
  id: string;
  title: string;
  disabled?: boolean;
  hidden?: boolean;
};

type MemorialChapterNavProps = {
  chapters: ChapterNavItem[];
  currentChapterId?: string | null;
  onChapterSelect: (chapterId: string) => void;
};

const CHAPTER_LABELS: Record<string, string> = {
  "basic-information": "Basic Information",
  "family-history": "Family History",
  "life-story": "Life Story",
  "places-lived": "Places Lived",
  "places-worked": "Places Worked",
  "schools-and-awards": "Schools & Awards",
  "social-media": "Social Media",
  "newspaper-articles": "Newspaper Articles",
  "favorite-songs": "Favorite Songs",
  "photo-gallery": "Photo Gallery",
  "video-memories": "Video Memories",
  obituary: "Obituary",
  "final-resting-place": "Final Resting Place",
  "backup-person": "Backup Person",
  review: "Review",
};

function ChapterIcon({ chapterId }: { chapterId: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (chapterId) {
    case "basic-information":
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="3" />
          <path d="M5.5 20c.7-4.4 3-6.5 6.5-6.5s5.8 2.1 6.5 6.5" />
        </svg>
      );
    case "family-history":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="16" cy="8" r="2.5" />
          <circle cx="12" cy="6" r="2.8" />
          <path d="M3.5 19c.4-3.4 2-5.1 4.5-5.1" />
          <path d="M20.5 19c-.4-3.4-2-5.1-4.5-5.1" />
          <path d="M6 20c.7-4.2 2.7-6.2 6-6.2s5.3 2 6 6.2" />
        </svg>
      );
    case "life-story":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
          <path d="M8 15.5 15.5 8" />
          <path d="m14.5 7 2.5 2.5" />
          <path d="M8 16.5h3" />
        </svg>
      );
    case "places-lived":
      return (
        <svg {...common}>
          <path d="M12 21s6-5.8 6-11a6 6 0 1 0-12 0c0 5.2 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      );
    case "places-worked":
      return (
        <svg {...common}>
          <rect x="3.5" y="7" width="17" height="12" rx="1.5" />
          <path d="M8.5 7V4.5h7V7" />
          <path d="M3.5 12h17" />
          <path d="M10 12v2h4v-2" />
        </svg>
      );
    case "schools-and-awards":
      return (
        <svg {...common}>
          <path d="m3 9 9-5 9 5-9 5-9-5Z" />
          <path d="M7 11.5v4.2c3.4 2.2 6.6 2.2 10 0v-4.2" />
          <path d="M21 9v6" />
        </svg>
      );
    case "social-media":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="2.3" />
          <circle cx="18" cy="6" r="2.3" />
          <circle cx="18" cy="18" r="2.3" />
          <path d="m8 11 7.8-4" />
          <path d="m8 13 7.8 4" />
        </svg>
      );
    case "newspaper-articles":
      return (
        <svg {...common}>
          <path d="M6 3.5h12v17H6z" />
          <path d="M9 7h6" />
          <path d="M9 10h6" />
          <path d="M9 13h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "favorite-songs":
      return (
        <svg {...common}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      );
    case "photo-gallery":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m5.5 17 4.2-4 3 2.7 2.4-2.2 3.4 3.5" />
        </svg>
      );
    case "video-memories":
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="m10 9 5 3-5 3V9Z" />
        </svg>
      );
    case "obituary":
      return (
        <svg {...common}>
          <path d="M6 3.5h10l2 2v15H6z" />
          <path d="M15 3.5V7h3" />
          <path d="M9 10h6" />
          <path d="M9 13h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "final-resting-place":
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="3" />
          <path d="M6 20c.7-4.3 2.7-6.3 6-6.3s5.3 2 6 6.3" />
          <path d="M18.5 8.5c1.6 1.1 2.5 2.5 2.5 4.1 0 3-4 5.7-9 5.7" />
        </svg>
      );
    case "backup-person":
      return (
        <svg {...common}>
          <path d="M12 3.5 19 6v5.2c0 4.4-2.7 7.5-7 9.3-4.3-1.8-7-4.9-7-9.3V6l7-2.5Z" />
          <circle cx="12" cy="10" r="2" />
          <path d="M8.8 15.3c.7-1.8 1.8-2.7 3.2-2.7s2.5.9 3.2 2.7" />
        </svg>
      );
    case "review":
      return (
        <svg {...common}>
          <path d="M8 6h12" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
          <path d="M3.5 6h.01" />
          <path d="M3.5 12h.01" />
          <path d="M3.5 18h.01" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export default function MemorialChapterNav({
  chapters,
  currentChapterId,
  onChapterSelect,
}: MemorialChapterNavProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const visibleChapters = chapters.filter((chapter) => !chapter.hidden);
  const desktopGridColumns =
    visibleChapters.length === 13
      ? "xl:grid-cols-[repeat(13,minmax(0,1fr))]"
      : visibleChapters.length === 14
        ? "xl:grid-cols-[repeat(14,minmax(0,1fr))]"
        : "xl:grid-cols-[repeat(15,minmax(0,1fr))]";

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const updateScrollControls = () => {
      const maxScrollLeft = Math.max(
        0,
        scroller.scrollWidth - scroller.clientWidth
      );

      setCanScrollLeft(scroller.scrollLeft > 4);
      setCanScrollRight(scroller.scrollLeft < maxScrollLeft - 4);
    };

    updateScrollControls();

    scroller.addEventListener("scroll", updateScrollControls, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollControls);

    const resizeObserver = new ResizeObserver(updateScrollControls);
    resizeObserver.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
      resizeObserver.disconnect();
    };
  }, [visibleChapters.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || !currentChapterId) {
      return;
    }

    const selectedButton = Array.from(
      scroller.querySelectorAll<HTMLButtonElement>(
        "button[data-chapter-nav-item]"
      )
    ).find(
      (button) => button.dataset.chapterId === currentChapterId
    );

    if (!selectedButton) {
      return;
    }

    /*
     * On tablet/mobile, keep the active chapter near the center of the
     * visible icon strip. This makes the row naturally advance as the user
     * chooses chapters, while the left/right arrows remain available for
     * manual browsing. At either end, the browser clamps to the available
     * scroll range.
     */
    const frameId = window.requestAnimationFrame(() => {
      const maxScrollLeft = Math.max(
        0,
        scroller.scrollWidth - scroller.clientWidth
      );

      if (maxScrollLeft <= 0) {
        return;
      }

      const selectedCenter =
        selectedButton.offsetLeft + selectedButton.offsetWidth / 2;
      const targetLeft = Math.min(
        maxScrollLeft,
        Math.max(0, selectedCenter - scroller.clientWidth / 2)
      );

      scroller.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currentChapterId, visibleChapters.length]);

  if (visibleChapters.length === 0) {
    return null;
  }

  function getScrollStep() {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return 300;
    }

    const firstChapterButton =
      scroller.querySelector<HTMLButtonElement>("button[data-chapter-nav-item]");
    const chapterWidth =
      firstChapterButton?.getBoundingClientRect().width || 100;

    /*
     * Leave room for the left/right arrow overlays and advance by a whole
     * number of chapter buttons. This prevents narrow screens from jumping
     * past a chapter between arrow clicks.
     */
    const usableWidth = Math.max(chapterWidth, scroller.clientWidth - 88);
    const visibleWholeChapters = Math.max(
      1,
      Math.floor(usableWidth / chapterWidth)
    );

    return visibleWholeChapters * chapterWidth;
  }

  function scrollBackward() {
    scrollerRef.current?.scrollBy({
      left: -getScrollStep(),
      behavior: "smooth",
    });
  }

  function scrollForward() {
    scrollerRef.current?.scrollBy({
      left: getScrollStep(),
      behavior: "smooth",
    });
  }

  return (
    <nav
      aria-label="Guided Memory Builder chapters"
      className="w-full border-y border-stone-200 bg-white shadow-sm"
    >
      <div className="relative w-full">
        <div
          ref={scrollerRef}
          className="overflow-x-auto scroll-smooth xl:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            className={[
              "flex min-w-max items-stretch pr-12 xl:grid xl:min-w-0 xl:pr-0",
              desktopGridColumns,
            ].join(" ")}
          >
            {visibleChapters.map((chapter) => {
              const isCurrent = chapter.id === currentChapterId;
              const isDisabled = chapter.disabled === true;
              const label = CHAPTER_LABELS[chapter.id] || chapter.title;

              return (
                <button
                  key={chapter.id}
                  type="button"
                  data-chapter-nav-item
                  data-chapter-id={chapter.id}
                  disabled={isDisabled}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => {
                    if (!isDisabled) {
                      onChapterSelect(chapter.id);
                    }
                  }}
                  className={[
                    "relative flex w-[100px] shrink-0 flex-col items-center justify-start border-r border-stone-200 px-2 pb-3 pt-3 text-center transition xl:w-auto xl:min-w-0",
                    isCurrent
                      ? "bg-white text-blue-950"
                      : "bg-white text-slate-800 hover:bg-stone-50 hover:text-blue-950",
                    isDisabled
                      ? "cursor-not-allowed opacity-45 hover:bg-white"
                      : "",
                  ].join(" ")}
                >
                  <span className="flex h-7 items-center justify-center text-blue-950">
                    <ChapterIcon chapterId={chapter.id} />
                  </span>

                  <span className="mt-2 text-base font-semibold leading-5">
                    {label}
                  </span>

                  <span
                    aria-hidden="true"
                    className={[
                      "absolute inset-x-2 bottom-0 h-[3px] rounded-full",
                      isCurrent ? "bg-blue-950" : "bg-transparent",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {canScrollLeft ? (
          <button
            type="button"
            onClick={scrollBackward}
            aria-label="Show previous chapters"
            className="absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-stone-200 bg-white/95 text-blue-950 shadow-[8px_0_14px_rgba(255,255,255,0.92)] transition hover:bg-stone-50 xl:hidden"
          >
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            onClick={scrollForward}
            aria-label="Show more chapters"
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center border-l border-stone-200 bg-white/95 text-blue-950 shadow-[-8px_0_14px_rgba(255,255,255,0.92)] transition hover:bg-stone-50 xl:hidden"
          >
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
