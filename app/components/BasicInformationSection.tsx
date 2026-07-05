import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  setFeaturedPhotoFile: React.Dispatch<React.SetStateAction<File | null>>;
  isSaving: boolean;
  isPublished: boolean;
};

export default function BasicInformationSection({
  form,
  handleChange,
  setFeaturedPhotoFile,
  isSaving,
  isPublished,
}: Props) {
  return (
    <FormSection
      title="Basic Information"
      description="Core details about this person."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <label className="block text-sm font-semibold text-stone-800">
            Featured Memorial Photo
          </label>

          <p className="mt-1 text-xs text-stone-500">
            This photo will appear at the top of the public memorial page.
          </p>

          {form.featuredPhotoUrl && (
            <img
              src={form.featuredPhotoUrl}
              alt="Featured memorial photo"
              className="mt-4 h-48 w-48 rounded-3xl object-cover shadow-sm"
            />
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFeaturedPhotoFile(e.target.files?.[0] ?? null)
            }
            className="mt-4 w-full rounded-2xl border bg-white px-4 py-3"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
          />

          <Input
            label="Middle Name"
            name="middleName"
            value={form.middleName}
            onChange={handleChange}
          />

          <Input
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
          />

          <Input
            label="Maiden Name"
            name="maidenName"
            value={form.maidenName}
            onChange={handleChange}
          />

          <Input
            label="Nickname"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
          />

          <Input
            label="Birth Date"
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={handleChange}
          />

          <Input
            label="Death Date"
            name="deathDate"
            type="date"
            value={form.deathDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <QuickSaveButton
        isSaving={isSaving}
        isPublished={isPublished}
      />
    </FormSection>
  );
}