import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isSaving?: boolean;
  isPublished?: boolean;
};

export default function BackupPersonSection({
  form,
  handleChange,
  isSaving,
  isPublished,
}: Props) {
  const isCreateMode =
    typeof isSaving !== "boolean" || typeof isPublished !== "boolean";

  return (
    <FormSection
      title="Personal E-Memorial Backup Person"
      description="Assign a trusted person who can manage and publish this memorial."
    >
      {isCreateMode && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            This personal E-Memorial will be saved but not published.
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your backup person will be responsible for completing and publishing
            this memorial upon your passing.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Backup Person Name"
          name="backupPersonName"
          value={form.backupPersonName ?? ""}
          onChange={handleChange}
        />

        {isCreateMode ? (
          <>
            <Input
              label="Backup Person Email"
              name="backupPersonEmail"
              value={form.backupPersonEmail ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Backup Person Username"
              name="backupPersonUsername"
              value={form.backupPersonUsername ?? ""}
              onChange={handleChange}
            />
          </>
        ) : (
          <Input
            label="Backup Email"
            name="backupEmail"
            value={form.backupEmail ?? ""}
            onChange={handleChange}
          />
        )}

        <Input
          label="Backup Password"
          name="backupPassword"
          value={form.backupPassword ?? ""}
          onChange={handleChange}
          
        />

        {isCreateMode && (
          <>
            <Input
              label="Your Street Address"
              name="creatorStreet"
              value={form.creatorStreet ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Your City"
              name="creatorCity"
              value={form.creatorCity ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Your State"
              name="creatorState"
              value={form.creatorState ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Your ZIP Code"
              name="creatorZip"
              value={form.creatorZip ?? ""}
              onChange={handleChange}
            />
          </>
        )}
      </div>

      {!isCreateMode && (
        <p className="mt-3 text-sm text-stone-500">
          This person will be able to edit and publish this memorial if needed.
        </p>
      )}

      {typeof isSaving === "boolean" && typeof isPublished === "boolean" && (
        <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
      )}
    </FormSection>
  );
}