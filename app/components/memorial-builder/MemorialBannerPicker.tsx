"use client";

import Image from "next/image";
import { ChangeEvent } from "react";

export type MemorialBannerOption = {
  id: string;
  label: string;
  imageUrl: string;
};

type MemorialBannerPickerProps = {
  options: MemorialBannerOption[];
  selectedBannerUrl?: string | null;
  customBannerPreviewUrl?: string | null;
  isUploading?: boolean;
  onSelectPreset: (option: MemorialBannerOption) => void;
  onCustomBannerSelected: (file: File) => void;
  onRemoveBanner?: () => void;
};

export default function MemorialBannerPicker({
  options,
  selectedBannerUrl,
  customBannerPreviewUrl,
  isUploading = false,
  onSelectPreset,
  onCustomBannerSelected,
  onRemoveBanner,
}: MemorialBannerPickerProps) {
  const activeBannerUrl =
    customBannerPreviewUrl || selectedBannerUrl || "";

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onCustomBannerSelected(file);

    // Allow the same file to be picked again later if needed.
    event.target.value = "";
  }

  return (
    <section
      aria-labelledby="memorial-banner-picker-heading"
      className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h2
          id="memorial-banner-picker-heading"
          className="text-2xl font-bold text-stone-900"
        >
          Personalize Your Memorial Banner
        </h2>

        <p className="mt-2 max-w-3xl text-base leading-7 text-stone-700">
          Choose one of the MyEMemorial banner images below or upload your own
          photo. The banner will appear across the top of the memorial.
        </p>
      </div>

      {activeBannerUrl && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
          <div className="relative aspect-[16/5] min-h-[180px] w-full">
            <Image
              src={activeBannerUrl}
              alt="Current memorial banner preview"
              fill
              sizes="(max-width: 768px) 100vw, 1100px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="mt-7">
        <h3 className="text-lg font-bold text-stone-900">
          Choose a MyEMemorial Banner
        </h3>

        {options.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => {
              const isSelected =
                !customBannerPreviewUrl &&
                selectedBannerUrl === option.imageUrl;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectPreset(option)}
                  aria-pressed={isSelected}
                  className={[
                    "overflow-hidden rounded-2xl border-2 bg-white text-left transition",
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-200"
                      : "border-stone-200 hover:border-stone-400",
                  ].join(" ")}
                >
                  <div className="relative aspect-[16/6] w-full bg-stone-100">
                    <Image
                      src={option.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 360px"
                      className="object-cover"
                    />
                  </div>

                  <div className="px-4 py-3">
                    <p className="text-base font-bold text-stone-900">
                      {option.label}
                    </p>

                    {isSelected && (
                      <p className="mt-1 text-base font-semibold text-amber-800">
                        Selected
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-base leading-7 text-stone-600">
            Preset banner choices will appear here.
          </p>
        )}
      </div>

      <div className="mt-7 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Or Upload Your Own Banner
        </h3>

        <p className="mt-2 text-base leading-7 text-stone-700">
          For the best result, choose a wide landscape photo with the main
          subject away from the lower-left area where the featured memorial
          portrait may overlap.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl bg-blue-950 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-900">
            {isUploading ? "Uploading..." : "Choose Banner Photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {activeBannerUrl && onRemoveBanner && (
            <button
              type="button"
              onClick={onRemoveBanner}
              disabled={isUploading}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-base font-bold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove Banner
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
