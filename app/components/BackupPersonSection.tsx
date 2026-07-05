import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function BackupPersonSection({
  form,
  handleChange,
  isSaving,
  isPublished,
}: Props) {
  return (
    <FormSection
      title="Backup Person"
      description="Assign a trusted person who can manage and publish this memorial."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Backup Person Name"
          name="backupPersonName"
          value={form.backupPersonName}
          onChange={handleChange}
        />

        <Input
          label="Backup Email"
          name="backupEmail"
          value={form.backupEmail}
          onChange={handleChange}
        />

        <Input
          label="Backup Password"
          name="backupPassword"
          value={form.backupPassword}
          onChange={handleChange}
        />
      </div>

      <p className="mt-3 text-sm text-stone-500">
        This person will be able to edit and publish this memorial if needed.
      </p>

      <QuickSaveButton
        isSaving={isSaving}
        isPublished={isPublished}
      />
    </FormSection>
  );
}