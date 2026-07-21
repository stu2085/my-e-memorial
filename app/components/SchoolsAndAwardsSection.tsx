import FormSection from "./FormSection";
import TextArea from "./TextArea";
import QuickSaveButton from "./QuickSaveButton";

type SchoolsAndAwardsSectionProps = {
  schoolsAttended: string;
  awardsWon: string;
  handleChange: (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >
) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function SchoolsAndAwardsSection({
  schoolsAttended,
  awardsWon,
  handleChange,
  isSaving,
  isPublished,
}: SchoolsAndAwardsSectionProps) {
  return (
    <FormSection
      title="Schools and Awards"
      description="Separate multiple items with commas."
    >
      <div className="space-y-5">
        <TextArea
          label="Schools Attended"
          name="schoolsAttended"
          value={schoolsAttended}
          onChange={handleChange}
          rows={3}
          helpText="Example: Lancaster Catholic, Penn State, Temple University"
        />

        <TextArea
          label="Awards Won"
          name="awardsWon"
          value={awardsWon}
          onChange={handleChange}
          rows={3}
          helpText="Example: Purple Heart, Eagle Scout, Teacher of the Year"
        />
      </div>

      <QuickSaveButton
  sectionId="schools-and-awards"
  isSaving={isSaving}
  isPublished={isPublished}
/>
    </FormSection>
  );
}