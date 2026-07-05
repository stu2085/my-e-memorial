import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setHeadstonePhoto1File: React.Dispatch<React.SetStateAction<File | null>>;
  setHeadstonePhoto2File: React.Dispatch<React.SetStateAction<File | null>>;
  isSaving: boolean;
  isPublished: boolean;
};

export default function HeadstonePhotosSection({
  form,
  handleChange,
  setForm,
  setHeadstonePhoto1File,
  setHeadstonePhoto2File,
  isSaving,
  isPublished,
}: Props) {
  return (
    <FormSection
      title="Headstone Photos"
      description="Photos of the headstone or grave marker."
    >
      <div className="space-y-5">
        <Input
          label="Headstone Photo 1 URL"
          name="headstonePhoto1Url"
          value={form.headstonePhoto1Url}
          onChange={handleChange}
        />

        {form.headstonePhoto1Url && (
          <div className="space-y-3">
            <img
              src={form.headstonePhoto1Url}
              alt="Headstone photo 1"
              className="h-48 w-full rounded-2xl object-cover"
            />

            <button
              type="button"
              onClick={() => {
                if (!confirm("Delete headstone photo 1?")) return;

                setForm((prev: any) => ({
                  ...prev,
                  headstonePhoto1Url: "",
                }));

                setHeadstonePhoto1File(null);
              }}
              className="w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
            >
              Delete Headstone Photo 1
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setHeadstonePhoto1File(e.target.files?.[0] ?? null)
          }
          className="w-full rounded-2xl border px-4 py-3"
        />

        <Input
          label="Headstone Photo 2 URL"
          name="headstonePhoto2Url"
          value={form.headstonePhoto2Url}
          onChange={handleChange}
        />

        {form.headstonePhoto2Url && (
          <div className="space-y-3">
            <img
              src={form.headstonePhoto2Url}
              alt="Headstone photo 2"
              className="h-48 w-full rounded-2xl object-cover"
            />

            <button
              type="button"
              onClick={() => {
                if (!confirm("Delete headstone photo 2?")) return;

                setForm((prev: any) => ({
                  ...prev,
                  headstonePhoto2Url: "",
                }));

                setHeadstonePhoto2File(null);
              }}
              className="w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
            >
              Delete Headstone Photo 2
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setHeadstonePhoto2File(e.target.files?.[0] ?? null)
          }
          className="w-full rounded-2xl border px-4 py-3"
        />
      </div>

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </FormSection>
  );
}