"use client";

import type { ChangeEvent } from "react";

type BannerFitStatus = "wide" | "needs-extension" | null;

export const MYEMEMORIAL_STOCK_BANNERS = [
  {
    id: "sunset-lake",
    label: "Golden Sunset Lake",
    imageUrl: "/memorial-banners/stock/sunset-lake.png",
  },
  {
    id: "soft-dawn",
    label: "Soft Dawn",
    imageUrl: "/memorial-banners/stock/soft-dawn.png",
  },
  {
    id: "quiet-meadow",
    label: "Quiet Meadow",
    imageUrl: "/memorial-banners/stock/quiet-meadow.png",
  },
  {
    id: "peaceful-sky",
    label: "Peaceful Sky",
    imageUrl: "/memorial-banners/stock/peaceful-sky.png",
  },
  {
    id: "autumn-horizon",
    label: "Autumn Horizon",
    imageUrl: "/memorial-banners/stock/autumn-horizon.png",
  },
  {
    id: "navy-gold",
    label: "Classic Navy & Gold",
    imageUrl: "/memorial-banners/stock/navy-gold.png",
  },
] as const;

type MemorialBannerPhotoSectionProps = {
  bannerUrl?: string | null;
  positionX: number;
  positionY: number;
  fitStatus?: BannerFitStatus;
  isSaving?: boolean;
  isExtending?: boolean;
  onPhotoSelected: (file: File) => void;
  onStockBannerSelected: (imageUrl: string) => void;
  onExtendPhoto: () => void;
  onPositionChange: (positionX: number, positionY: number) => void;
  onRemove: () => void;
};

function clampPosition(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function MemorialBannerPhotoSection({
  bannerUrl,
  positionX,
  positionY,
  fitStatus = null,
  isSaving = false,
  isExtending = false,
  onPhotoSelected,
  onStockBannerSelected,
  onExtendPhoto,
  onPositionChange,
  onRemove,
}: MemorialBannerPhotoSectionProps) {
  const safePositionX = clampPosition(positionX);
  const safePositionY = clampPosition(positionY);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    onPhotoSelected(file);

    // Allow the same photo to be selected again later if needed.
    event.target.value = "";
  }

  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-base font-bold uppercase tracking-[0.14em] text-blue-950">
          Memorial Banner Photo
        </p>

        <h3 className="mt-2 text-2xl font-bold text-stone-900">
          Choose the full-width photo for the top of the MyEMemorial
        </h3>

        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-700">
          Use your own meaningful family photo, favorite place, home, hobby, or
          landscape. If you do not have a photo that works well, choose one of
          the MyEMemorial banners below.
        </p>
      </div>

      <div className="mt-7">
        <h4 className="text-xl font-bold text-stone-900">
          Choose a MyEMemorial Banner
        </h4>

        <p className="mt-2 text-base leading-7 text-stone-700">
          These ready-to-use banners are included and can be changed at any time.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MYEMEMORIAL_STOCK_BANNERS.map((option) => {
            const isSelected = bannerUrl === option.imageUrl;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onStockBannerSelected(option.imageUrl)}
                disabled={isSaving || isExtending}
                aria-pressed={isSelected}
                className={[
                  "overflow-hidden rounded-2xl border-2 bg-white text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-200"
                    : "border-stone-200 hover:border-stone-400",
                ].join(" ")}
              >
                <div className="aspect-[16/5] w-full overflow-hidden bg-stone-100">
                  <img
                    src={option.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
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
      </div>

      <div className="mt-7 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5">
        <h4 className="text-xl font-bold text-stone-900">
          Or Upload Your Own Banner Photo
        </h4>

        <p className="mt-2 max-w-3xl text-base leading-7 text-stone-700">
          Wide photos can be used directly. If your photo is square or vertical,
          MyEMemorial can create a wide version by extending the scenery around
          the original photo.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl bg-blue-950 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-900">
            {bannerUrl ? "Choose a Different Banner Photo" : "Choose Banner Photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isSaving || isExtending}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {bannerUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={isSaving || isExtending}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-base font-bold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove Banner Photo
            </button>
          )}
        </div>
      </div>

      {fitStatus === "needs-extension" && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-base font-bold text-amber-900">
            This photo is not wide enough for the finished banner.
          </p>

          <p className="mt-2 text-base leading-7 text-amber-900">
            MyEMemorial can extend only the surrounding scenery to the left and
            right. The original uploaded photo is preserved separately, and the
            original portion is placed back into the finished banner so faces,
            people, pets, and important objects are not replaced.
          </p>

          <button
            type="button"
            onClick={onExtendPhoto}
            disabled={isSaving || isExtending}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-amber-700 px-5 py-3 text-base font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtending
              ? "Creating Full-Width Banner..."
              : "Create Full-Width Banner"}
          </button>

          {isExtending && (
            <p className="mt-3 text-base leading-7 text-amber-900">
              This can take a minute or two. Keep this page open while the wider
              banner is being created.
            </p>
          )}
        </div>
      )}

      {fitStatus === "wide" && bannerUrl && (
        <div className="mt-5 rounded-2xl border border-green-300 bg-green-50 p-4">
          <p className="text-base font-bold text-green-900">
            This banner is ready to use.
          </p>
        </div>
      )}

      {bannerUrl && (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-300 bg-stone-900">
            <div className="relative aspect-[16/5] min-h-[180px] w-full overflow-hidden">
              <img
                src={bannerUrl}
                alt="Memorial banner preview"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  objectPosition: `${safePositionX}% ${safePositionY}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-stone-50 p-5">
            <h4 className="text-xl font-bold text-stone-900">
              Reposition Photo
            </h4>

            <p className="mt-2 text-base leading-7 text-stone-700">
              Move the focus point until the important part of the photo looks
              right in the wide banner. This does not change your original photo.
            </p>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="text-base font-bold text-stone-800">
                  Move focus left or right
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={safePositionX}
                  onChange={(event) =>
                    onPositionChange(
                      Number(event.target.value),
                      safePositionY
                    )
                  }
                  className="mt-3 w-full"
                />
              </label>

              <label className="block">
                <span className="text-base font-bold text-stone-800">
                  Move focus up or down
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={safePositionY}
                  onChange={(event) =>
                    onPositionChange(
                      safePositionX,
                      Number(event.target.value)
                    )
                  }
                  className="mt-3 w-full"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => onPositionChange(50, 50)}
              className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-base font-bold text-stone-800 transition hover:bg-stone-100"
            >
              Center Photo
            </button>
          </div>
        </>
      )}
    </section>
  );
}
