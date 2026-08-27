"use client";

import { type ReactNode, useEffect, useState } from "react";

type MemorialBuilderPageFrameProps = {
  navigationHostId: string;
  hero: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  children: ReactNode;
};

export default function MemorialBuilderPageFrame({
  navigationHostId,
  hero,
  leftRail,
  rightRail,
  children,
}: MemorialBuilderPageFrameProps) {
  const [mainNavHeight, setMainNavHeight] = useState(0);
  const [chapterNavHeight, setChapterNavHeight] = useState(0);

  useEffect(() => {
    const mainNav = document.querySelector<HTMLElement>("header.sticky");
    const chapterNavHost = document.getElementById(navigationHostId);

    const updateStickyHeights = () => {
      setMainNavHeight(
        mainNav ? Math.ceil(mainNav.getBoundingClientRect().height) : 0
      );
      setChapterNavHeight(
        chapterNavHost
          ? Math.ceil(chapterNavHost.getBoundingClientRect().height)
          : 0
      );
    };

    updateStickyHeights();

    const resizeObserver = new ResizeObserver(updateStickyHeights);

    if (mainNav) {
      resizeObserver.observe(mainNav);
    }

    if (chapterNavHost) {
      resizeObserver.observe(chapterNavHost);
    }

    window.addEventListener("resize", updateStickyHeights);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateStickyHeights);
    };
  }, [navigationHostId]);

  const sideRailStickyTop = mainNavHeight + chapterNavHeight + 16;

  return (
    <>
      {/* Break out of the Create/Edit page padding so the memorial header
          touches the site navbar and spans the full browser width. */}
      <div className="-mx-4 -mt-10 md:-mx-8">
        <div className="w-full">{hero}</div>
      </div>

      {/* The banner scrolls away normally. Once the chapter row reaches the
          main site navbar, it stays pinned directly beneath it. */}
      <div
        id={navigationHostId}
        className="sticky z-40 -mx-4 w-auto md:-mx-8"
        style={{ top: `${mainNavHeight}px` }}
      />

      {/* Keep the working/editing area contained below the full-width header.
          Side ads stay sticky on desktop, but are hidden below lg so they never
          squeeze the chapter editor on phones and tablets. */}
      <div className="mx-auto mt-6 max-w-7xl">
        <div className="flex items-start gap-6">
          {leftRail ? (
            <div
              className="sticky z-20 hidden shrink-0 self-start lg:block"
              style={{ top: `${sideRailStickyTop}px` }}
            >
              {leftRail}
            </div>
          ) : null}

          <div className="min-w-0 w-full flex-1">{children}</div>

          {rightRail ? (
            <div
              className="sticky z-20 hidden shrink-0 self-start lg:block"
              style={{ top: `${sideRailStickyTop}px` }}
            >
              {rightRail}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
