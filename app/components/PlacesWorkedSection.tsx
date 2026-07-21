import FormSection from "./FormSection";
import QuickSaveButton from "./QuickSaveButton";

type PlacesWorkedSectionProps = {
  placesWorked: string;
  handleChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function PlacesWorkedSection({
  placesWorked,
  handleChange,
  isSaving,
  isPublished,
}: PlacesWorkedSectionProps) {
  return (
    <FormSection
      title="Places Worked"
      description="Employers, occupations, or businesses associated with this person."
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-stone-800">
          Places Worked
        </label>

        <textarea
          name="placesWorked"
          value={placesWorked}
          onChange={handleChange}
          rows={5}
          placeholder={`Example:
Armstrong World Industries
Stum's Repair Service
Hershey Foods Corporation`}
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
        />

        <p className="mt-2 text-xs text-stone-500">
          Enter one employer, job, or workplace per line.
        </p>
      </div>

      <QuickSaveButton
  sectionId="places-worked"
  isSaving={isSaving}
  isPublished={isPublished}
/>
    </FormSection>
  );
}