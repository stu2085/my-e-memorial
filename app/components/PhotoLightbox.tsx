"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  photos: string[];
  title?: string;
  heightClass?: string;
  columnsClass?: string;
};

export default function PhotoLightbox({
  photos,
  title,
  heightClass = "h-48",
  columnsClass = "grid-cols-2 md:grid-cols-3",
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const selectedImage =
    selectedIndex !== null ? photos[selectedIndex] : null;

  function goNext() {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % photos.length);
  }

  function goPrev() {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (selectedIndex === null) return;

      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setSelectedIndex(null);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, photos.length]);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    touchEndX.current = e.changedTouches[0].clientX;

    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;

    if (distance > swipeThreshold) {
      goNext();
    } else if (distance < -swipeThreshold) {
      goPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  if (!photos || photos.length === 0) return null;

  return (
    <>
      {title && (
        <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
      )}

      <div className={`mt-6 grid gap-4 ${columnsClass}`}>
        {photos.map((photo, index) => (
          <button
            key={`${photo}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="overflow-hidden rounded-2xl text-left"
          >
            <img
              src={photo}
              alt={`${title || "Photo"} ${index + 1}`}
              className={`${heightClass} w-full cursor-zoom-in object-cover transition duration-300 hover:scale-105`}
            />
          </button>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 hidden text-4xl text-white md:block"
            >
              ←
            </button>
          )}

          <img
            src={selectedImage}
            alt="Enlarged"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 hidden text-4xl text-white md:block"
            >
              →
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-stone-900"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}