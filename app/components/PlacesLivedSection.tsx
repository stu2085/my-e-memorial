import FormSection from "./FormSection";
import QuickSaveButton from "./QuickSaveButton";

type PlacesLivedSectionProps = {
  placesLived: string;
  handleChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function PlacesLivedSection({
  placesLived,
  handleChange,
  isSaving,
  isPublished,
}: PlacesLivedSectionProps) {
  return (
    <FormSection
      title="Places Lived"
      description="Cities, states, and countries associated with this person."
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-800">
          Places Lived
        </label>

        <textarea
          name="placesLived"
          value={placesLived}
          onChange={handleChange}
          rows={5}
          placeholder={`Example:
Lancaster, Pennsylvania
Philadelphia, Pennsylvania
Naples, Florida`}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
        />

        <p className="mt-2 text-xs text-stone-500">
          Enter one place per line.
        </p>
      </div>

      <QuickSaveButton
        isSaving={isSaving}
        isPublished={isPublished}
      />
    </FormSection>
  );
}