"use client";

import { useEffect, useState } from "react";
import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  setFeaturedPhotoFile: React.Dispatch<
    React.SetStateAction<File | null>
  >;
  isSaving: boolean;
  isPublished: boolean;
  isPaid?: boolean;
};

export default function BasicInformationSection({
  form,
  handleChange,
  setFeaturedPhotoFile,
  isSaving,
  isPublished,
  isPaid = true,
}: Props) {
  const [featuredPhotoPreview, setFeaturedPhotoPreview] = useState<
    string | null
  >(null);

  useEffect(() => {
    return () => {
      if (featuredPhotoPreview) {
        URL.revokeObjectURL(featuredPhotoPreview);
      }
    };
  }, [featuredPhotoPreview]);

  function handleFeaturedPhotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] ?? null;

    setFeaturedPhotoFile(file);

    setFeaturedPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return file ? URL.createObjectURL(file) : null;
    });
  }

  const displayedFeaturedPhoto =
    featuredPhotoPreview || form.featuredPhotoUrl;

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

          {displayedFeaturedPhoto && (
            <div className="mt-4">
              <img
                src={displayedFeaturedPhoto}
                alt="Featured memorial photo"
                className="h-48 w-48 rounded-3xl object-cover shadow-sm"
              />

              {featuredPhotoPreview && (
                <p className="mt-2 text-xs font-medium text-green-700">
                  New photo selected. Click Save Changes to keep it.
                </p>
              )}
            </div>
          )}

          {!isPaid && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Choose a memorial plan and complete payment before uploading
              photos.
            </p>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={!isPaid}
            onChange={handleFeaturedPhotoChange}
            className="mt-4 w-full rounded-2xl border bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
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