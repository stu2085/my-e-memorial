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
      description="Tell the story of their life."
    >
      <TextArea
        label="Life Story"
        name="lifeStory"
        value={form.lifeStory}
        onChange={handleChange}
        rows={8}
      />

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </FormSection>
  );
}