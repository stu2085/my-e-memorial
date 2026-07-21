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

export default function SocialMediaSection({
  form,
  handleChange,
  isSaving,
  isPublished,
}: Props) {
  return (
    <FormSection
      title="Social Media Links"
      description="Add up to 5 social media pages for this memorial."
    >
      <div className="space-y-5">
        <Input
          label="Social Media Link 1"
          name="socialLink1"
          value={form.socialLink1}
          onChange={handleChange}
        />

        <Input
          label="Social Media Link 2"
          name="socialLink2"
          value={form.socialLink2}
          onChange={handleChange}
        />

        <Input
          label="Social Media Link 3"
          name="socialLink3"
          value={form.socialLink3}
          onChange={handleChange}
        />

        <Input
          label="Social Media Link 4"
          name="socialLink4"
          value={form.socialLink4}
          onChange={handleChange}
        />

        <Input
          label="Social Media Link 5"
          name="socialLink5"
          value={form.socialLink5}
          onChange={handleChange}
        />
      </div>

      <QuickSaveButton
  sectionId="social-media"
  isSaving={isSaving}
  isPublished={isPublished}
/>
    </FormSection>
  );
}