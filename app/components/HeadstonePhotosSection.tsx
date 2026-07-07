import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form?: any;
  handleChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  setForm?: React.Dispatch<React.SetStateAction<any>>;
  setHeadstonePhoto1File?: React.Dispatch<React.SetStateAction<File | null>>;
  setHeadstonePhoto2File?: React.Dispatch<React.SetStateAction<File | null>>;
  isSaving?: boolean;
  isPublished?: boolean;
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
  if (!form || !handleChange) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-800">
            Headstone Photo 1
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setHeadstonePhoto1File?.(e.target.files?.[0] ?? null)
            }
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-800">
            Headstone Photo 2
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setHeadstonePhoto2File?.(e.target.files?.[0] ?? null)
            }
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
          />
        </div>
      </div>
    );
  }

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
                if (!setForm || !setHeadstonePhoto1File) return;
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
            setHeadstonePhoto1File?.(e.target.files?.[0] ?? null)
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
                if (!setForm || !setHeadstonePhoto2File) return;
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
            setHeadstonePhoto2File?.(e.target.files?.[0] ?? null)
          }
          className="w-full rounded-2xl border px-4 py-3"
        />
      </div>

      {typeof isSaving === "boolean" && typeof isPublished === "boolean" && (
        <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
      )}
    </FormSection>
  );
}