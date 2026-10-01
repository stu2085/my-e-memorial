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
      title="Funeral Information"
      description="Share the funeral date, time, venue, and address. All fields are optional and can be updated when arrangements are confirmed."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-base font-semibold text-stone-700">
              Funeral Date (Optional)
              <input
                type="date"
                name="funeralDate"
                value={form.funeralDate ?? ""}
                onChange={handleChange}
                className="mt-2 block min-w-0 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base font-normal text-stone-900"
              />
            </label>
            <label className="block text-base font-semibold text-stone-700">
              Funeral Time (Optional)
              <input
                type="time"
                name="funeralTime"
                step={60}
                value={(form.funeralTime ?? "").slice(0, 5)}
                onChange={handleChange}
                aria-describedby="funeral-time-help"
                className="mt-2 block min-w-0 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base font-normal text-stone-900"
              />
            </label>
          </div>
          <p id="funeral-time-help" className="mt-2 text-base text-stone-600">
            Enter the local time at the funeral venue.
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-base font-semibold text-stone-700">
              Funeral Venue Name (Optional)
              <input
                type="text"
                name="funeralVenueName"
                value={form.funeralVenueName ?? ""}
                onChange={handleChange}
                maxLength={200}
                placeholder="Name of funeral home, church, or other venue"
                className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base font-normal text-stone-900"
              />
            </label>
            <label className="block text-base font-semibold text-stone-700">
              Funeral Address (Optional)
              <textarea
                name="funeralAddress"
                value={form.funeralAddress ?? ""}
                onChange={handleChange}
                maxLength={1000}
                rows={3}
                placeholder="Street address, city, state, ZIP code, and country if needed"
                className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base font-normal text-stone-900"
              />
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-stone-900">
            Obituary
          </h3>
          <p className="mt-2 text-base leading-7 text-stone-700">
            Preserve the obituary by entering the text, uploading an image, or adding a link to the original obituary.
          </p>
        </div>

        <div>
          <p className="mb-2 text-base font-semibold text-stone-700">
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
    <p className="text-base font-semibold text-stone-700">
      Option 2 — Upload an Obituary Image
    </p>

    <p className="mt-1 text-base text-stone-600">
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
      className="w-full rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-base font-semibold text-red-700"
    >
      Delete Obituary Image
    </button>
  </div>
)}

    {!isPaid && (
      <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800">
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

        <div>
  <p className="mb-2 text-base font-semibold text-stone-700">
    Option 3 — Add the Original Obituary Website Link
  </p>

  <Input
    label="Original Obituary Website Link (Optional)"
    name="obituaryUrl"
    value={form.obituaryUrl}
    onChange={handleChange}
  />
</div>
      </div>

      <QuickSaveButton
  sectionId="obituary"
  isSaving={isSaving}
  isPublished={isPublished}
/>
    </FormSection>
  );
}