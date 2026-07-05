import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isSaving: boolean;
  isPublished: boolean;
};

function FamilyTextArea({
  label,
  name,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      />
    </div>
  );
}

export default function FamilyHistorySection({
  form,
  handleChange,
  isSaving,
  isPublished,
}: Props) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-stone-900">
          Family History
        </h2>

        <p className="mt-1 text-sm text-stone-600">
          Add family names for future generations and genealogy research.
        </p>
      </div>

      <div className="space-y-5">
        <FamilyTextArea
          label="Great Grandparents Names"
          name="greatGrandparentsNames"
          value={form.greatGrandparentsNames}
          onChange={handleChange}
          rows={3}
        />

        <FamilyTextArea
          label="Grandparents Names — Father’s Side"
          name="grandparentsFatherSide"
          value={form.grandparentsFatherSide}
          onChange={handleChange}
          rows={3}
        />

        <FamilyTextArea
          label="Grandparents Names — Mother’s Side"
          name="grandparentsMotherSide"
          value={form.grandparentsMotherSide}
          onChange={handleChange}
          rows={3}
        />

        <FamilyTextArea
          label="Parents Names"
          name="parentsNames"
          value={form.parentsNames}
          onChange={handleChange}
          rows={3}
        />

        <FamilyTextArea
          label="Siblings Names"
          name="siblingsNames"
          value={form.siblingsNames}
          onChange={handleChange}
          rows={3}
          placeholder={`Mother's siblings:\nFather's siblings:`}
        />

        <FamilyTextArea
          label="Children's Names"
          name="childrenNames"
          value={form.childrenNames}
          onChange={handleChange}
          rows={3}
        />

        <FamilyTextArea
          label="Grandchildren"
          name="grandchildrenNames"
          value={form.grandchildrenNames}
          onChange={handleChange}
          rows={3}
        />

        <FamilyTextArea
          label="Great Grandchildren"
          name="greatGrandchildrenNames"
          value={form.greatGrandchildrenNames}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </section>
  );
}