"use client";

type MemorialBuilderHeroProps = {
  fullName?: string;
  birthDate?: string;
  deathDate?: string;
  isLivingPreplan?: boolean;
  featuredPhotoUrl?: string | null;
  bannerUrl?: string | null;
  bannerPositionX?: number;
  bannerPositionY?: number;
};

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function clampPosition(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function MemorialBuilderHero({
  fullName,
  birthDate,
  deathDate,
  isLivingPreplan = false,
  featuredPhotoUrl,
  bannerUrl,
  bannerPositionX = 50,
  bannerPositionY = 50,
}: MemorialBuilderHeroProps) {
  const safeName = fullName?.trim() || "";
  const formattedBirthDate = formatDate(birthDate);
  const formattedDeathDate = formatDate(deathDate);
  const safeBannerPositionX = clampPosition(bannerPositionX);
  const safeBannerPositionY = clampPosition(bannerPositionY);

  const dateLine = isLivingPreplan
    ? formattedBirthDate
      ? `Born ${formattedBirthDate}`
      : ""
    : formattedBirthDate || formattedDeathDate
      ? `${formattedBirthDate || "—"} – ${formattedDeathDate || "—"}`
      : "";

  return (
    <section
      aria-label="MyEMemorial header"
      className="relative overflow-hidden bg-stone-900"
    >
      <div className="relative min-h-[260px] sm:min-h-[300px] lg:min-h-[330px]">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: `${safeBannerPositionX}% ${safeBannerPositionY}%`,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-stone-800"
          />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.04) 70%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[260px] max-w-7xl items-end px-4 pb-7 pt-8 sm:min-h-[300px] sm:px-6 sm:pb-8 lg:min-h-[330px] lg:px-8">
          <div className="flex w-full flex-col gap-6 md:flex-row md:items-end">
            <div className="shrink-0">
              <div className="relative h-48 w-40 overflow-hidden rounded-2xl border-[3px] border-white bg-stone-200 shadow-2xl sm:h-56 sm:w-48 lg:h-60 lg:w-52">
                {featuredPhotoUrl ? (
                  <img
                    src={featuredPhotoUrl}
                    alt={safeName ? `Featured memorial photo for ${safeName}` : "Featured memorial photo"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-label="Featured memorial photo placeholder"
                    className="h-full w-full"
                  />
                )}
              </div>
            </div>

            <div className="max-w-3xl pb-1 text-white">
              {safeName && (
                <h1 className="text-3xl font-bold leading-tight drop-shadow sm:text-4xl lg:text-5xl">
                  {safeName}
                </h1>
              )}

              {dateLine && (
                <p className={`${safeName ? "mt-2" : ""} text-xl font-semibold leading-8 text-white sm:text-2xl`}>
                  {dateLine}
                </p>
              )}

              {(birthDate || deathDate) && (
                <p className="sr-only">
                  {birthDate
                    ? `Date of birth: ${formatDate(birthDate)}.`
                    : ""}
                  {deathDate
                    ? ` Date of passing: ${formatDate(deathDate)}.`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
