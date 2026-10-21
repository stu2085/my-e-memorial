import FormSection from "./FormSection";
import TextArea from "./TextArea";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function LifeStorySection({
  form,
  handleChange,
  isSaving,
  isPublished,
}: Props) {
  return (
    <FormSection
      title="Life Story"
      description="Tell the story of a life through memories, experiences, and meaningful moments."
    >
      <TextArea
        label="Life Story"
        name="lifeStory"
        value={form.lifeStory}
        onChange={handleChange}
        rows={8}
      />

      <fieldset className="mt-6 space-y-4 rounded-xl border border-stone-200 p-4">
        <legend className="px-2 text-lg font-semibold">Military Service</legend>
        <label className="block space-y-2">
          <span>{form.isLivingPreplan ? "Have you served in the military?" : "Did your loved one serve in the military?"}</span>
          <select name="militaryService" value={form.militaryService || ""} onChange={handleChange} className="block w-full rounded-lg border border-stone-300 bg-white p-3">
            <option value="">Select an answer (optional)</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        {form.militaryService === "yes" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2"><span>Branch of service</span>
              <select name="militaryBranch" value={form.militaryBranch || ""} onChange={handleChange} className="block w-full rounded-lg border border-stone-300 bg-white p-3">
                <option value="">Select a branch</option>
                {["Army", "Marine Corps", "Navy", "Air Force", "Coast Guard", "Space Force", "Other"].map(branch => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </label>
            <label className="block space-y-2"><span>Years served</span><input name="militaryYears" value={form.militaryYears || ""} onChange={handleChange} maxLength={120} placeholder="e.g., 1974–1978" className="block w-full rounded-lg border border-stone-300 p-3" /></label>
            <label className="block space-y-2"><span>Rank</span><input name="militaryRank" value={form.militaryRank || ""} onChange={handleChange} maxLength={120} className="block w-full rounded-lg border border-stone-300 p-3" /></label>
            <label className="block space-y-2 sm:col-span-2"><span>Deployment locations</span><textarea name="militaryDeployments" value={form.militaryDeployments || ""} onChange={handleChange} maxLength={2000} rows={3} className="block w-full rounded-lg border border-stone-300 p-3" /></label>
            <p className="text-sm text-stone-600 sm:col-span-2">These details are optional and will appear in the memorial’s Life Story. A custom tribute symbol with the selected branch name will appear at the top.</p>
          </div>
        )}
      </fieldset>

      <QuickSaveButton
  sectionId="life-story"
  isSaving={isSaving}
  isPublished={isPublished}
/>
    </FormSection>
  );
}