import FormSection from "./FormSection";
import Input from "./Input";
import TextArea from "./TextArea";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  setForm?: React.Dispatch<React.SetStateAction<any>>;
  setObituaryImageFile?: React.Dispatch<
    React.SetStateAction<File | null>
  >;
  isSaving: boolean;
  isPublished: boolean;
  isPaid?: boolean;
};

export default function ObituarySection({
  form,
  handleChange,
  setForm,
  setObituaryImageFile,
  isSaving,
  isPublished,
  isPaid = true,
}: Props) {
  return (
    <FormSection
      title="Obituary"
      description="Enter obituary text, upload an obituary image, or add a link to the original obituary."
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-stone-700">
            Option 1 — Enter Obituary Text
          </p>

          <TextArea
            label="Obituary Text"
            name="obituary"
            value={form.obituary}
            onChange={handleChange}
            rows={6}
          />
        </div>

        {setForm && setObituaryImageFile && (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
    <p className="text-sm font-semibold text-stone-700">
      Option 2 — Upload an Obituary Image
    </p>

    <p className="mt-1 text-sm text-stone-600">
      Upload a newspaper clipping, screenshot, scan, or JPG image of the
      obituary if text cannot be copied.
    </p>

       {form.obituaryImageUrl && (
  <div className="mt-4 space-y-3">
    <img
      src={form.obituaryImageUrl}
      alt="Uploaded obituary"
      className="max-h-96 w-full rounded-2xl bg-white object-contain"
    />

    <button
      type="button"
      onClick={() => {
        if (!confirm("Delete this obituary image?")) return;

        setForm((prev: any) => ({
          ...prev,
          obituaryImageUrl: "",
        }));

        setObituaryImageFile(null);
      }}
      className="w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
    >
      Delete Obituary Image
    </button>
  </div>
)}

    {!isPaid && (
      <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Choose a memorial plan and complete payment before uploading an obituary
        image.
      </p>
    )}

    <input
      type="file"
      accept="image/*"
      disabled={!isPaid}
      onChange={(e) =>
        setObituaryImageFile(e.target.files?.[0] ?? null)
      }
      className="mt-4 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
    />
  </div>
)}

        <Input
          label="Original Obituary Website Link (Optional)"
          name="obituaryUrl"
          value={form.obituaryUrl}
          onChange={handleChange}
        />
      </div>

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </FormSection>
  );
}