"use client";

type PlanKey = "basic" | "plus" | "premium";

type CreateGallerySectionProps = {
  form: {
  plan: string;
};
  galleryPhotos: File[];
  setGalleryPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  PLAN_LIMITS: Record<
    PlanKey,
    {
      label: string;
      galleryPhotos: number;
    }
  >;
};

export default function CreateGallerySection({
  form,
  galleryPhotos,
  setGalleryPhotos,
  PLAN_LIMITS,
}: CreateGallerySectionProps) {
  const selectedPlan = form.plan as PlanKey;
  const limit = PLAN_LIMITS[selectedPlan]?.galleryPhotos ?? 50;

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-stone-700">
        Upload Gallery Photos
      </label>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);

          if (Number.isFinite(limit) && files.length > limit) {
            alert(
              `${PLAN_LIMITS[selectedPlan].label} allows up to ${limit} gallery photos. You selected ${files.length}.`
            );
            e.target.value = "";
            setGalleryPhotos([]);
            return;
          }

          setGalleryPhotos(files);
        }}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
      />

      <p className="mt-2 text-sm text-stone-600">
        {selectedPlan === "premium"
          ? `${galleryPhotos.length} gallery photo${
              galleryPhotos.length === 1 ? "" : "s"
            } selected. Premium allows unlimited photos.`
          : `${galleryPhotos.length} of ${limit} gallery photos selected.`}
      </p>
    </div>
  );
}