"use client";

import { useEffect, useState } from "react";
import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form?: any;
  handleChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  setForm?: React.Dispatch<React.SetStateAction<any>>;
  setHeadstonePhoto1File?: React.Dispatch<
    React.SetStateAction<File | null>
  >;
  setHeadstonePhoto2File?: React.Dispatch<
    React.SetStateAction<File | null>
  >;
  isSaving?: boolean;
  isPublished?: boolean;
  isPaid?: boolean;
};

export default function HeadstonePhotosSection({
  form,
  handleChange,
  setForm,
  setHeadstonePhoto1File,
  setHeadstonePhoto2File,
  isSaving,
  isPublished,
  isPaid = true,
}: Props) {
  const [headstonePhoto1Preview, setHeadstonePhoto1Preview] = useState<
    string | null
  >(null);

  const [headstonePhoto2Preview, setHeadstonePhoto2Preview] = useState<
    string | null
  >(null);

  useEffect(() => {
    return () => {
      if (headstonePhoto1Preview) {
        URL.revokeObjectURL(headstonePhoto1Preview);
      }
    };
  }, [headstonePhoto1Preview]);

  useEffect(() => {
    return () => {
      if (headstonePhoto2Preview) {
        URL.revokeObjectURL(headstonePhoto2Preview);
      }
    };
  }, [headstonePhoto2Preview]);

  function handleHeadstonePhoto1Change(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] ?? null;

    setHeadstonePhoto1File?.(file);

    setHeadstonePhoto1Preview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleHeadstonePhoto2Change(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] ?? null;

    setHeadstonePhoto2File?.(file);

    setHeadstonePhoto2Preview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return file ? URL.createObjectURL(file) : null;
    });
  }

  function clearHeadstonePhoto1Preview() {
    setHeadstonePhoto1Preview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
  }

  function clearHeadstonePhoto2Preview() {
    setHeadstonePhoto2Preview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
  }

  const displayedHeadstonePhoto1 =
    headstonePhoto1Preview || form?.headstonePhoto1Url;

  const displayedHeadstonePhoto2 =
    headstonePhoto2Preview || form?.headstonePhoto2Url;

  if (!form || !handleChange) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-800">
            Headstone Photo 1
          </label>

          {!isPaid && (
            <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Choose a memorial plan and complete payment before uploading
              headstone photos.
            </p>
          )}

          {headstonePhoto1Preview && (
            <div className="mb-4">
              <img
                src={headstonePhoto1Preview}
                alt="Selected headstone photo 1"
                className="h-48 w-full rounded-2xl object-cover"
              />

              <p className="mt-2 text-xs font-medium text-green-700">
                New photo selected. Save the memorial to keep it.
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={!isPaid}
            onChange={handleHeadstonePhoto1Change}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-800">
            Headstone Photo 2
          </label>

          {headstonePhoto2Preview && (
            <div className="mb-4">
              <img
                src={headstonePhoto2Preview}
                alt="Selected headstone photo 2"
                className="h-48 w-full rounded-2xl object-cover"
              />

              <p className="mt-2 text-xs font-medium text-green-700">
                New photo selected. Save the memorial to keep it.
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={!isPaid}
            onChange={handleHeadstonePhoto2Change}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
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

        {displayedHeadstonePhoto1 && (
          <div className="space-y-3">
            <img
              src={displayedHeadstonePhoto1}
              alt="Headstone photo 1"
              className="h-48 w-full rounded-2xl object-cover"
            />

            {headstonePhoto1Preview && (
              <p className="text-xs font-medium text-green-700">
                New photo selected. Click Save Changes to keep it.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (headstonePhoto1Preview) {
                  clearHeadstonePhoto1Preview();
                  setHeadstonePhoto1File?.(null);
                  return;
                }

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
              {headstonePhoto1Preview
                ? "Remove Selected Photo 1"
                : "Delete Headstone Photo 1"}
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={!isPaid}
          onChange={handleHeadstonePhoto1Change}
          className="w-full rounded-2xl border px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        />

        <Input
          label="Headstone Photo 2 URL"
          name="headstonePhoto2Url"
          value={form.headstonePhoto2Url}
          onChange={handleChange}
        />

        {displayedHeadstonePhoto2 && (
          <div className="space-y-3">
            <img
              src={displayedHeadstonePhoto2}
              alt="Headstone photo 2"
              className="h-48 w-full rounded-2xl object-cover"
            />

            {headstonePhoto2Preview && (
              <p className="text-xs font-medium text-green-700">
                New photo selected. Click Save Changes to keep it.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (headstonePhoto2Preview) {
                  clearHeadstonePhoto2Preview();
                  setHeadstonePhoto2File?.(null);
                  return;
                }

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
              {headstonePhoto2Preview
                ? "Remove Selected Photo 2"
                : "Delete Headstone Photo 2"}
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={!isPaid}
          onChange={handleHeadstonePhoto2Change}
          className="w-full rounded-2xl border px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        />
      </div>

      {typeof isSaving === "boolean" &&
        typeof isPublished === "boolean" && (
          <QuickSaveButton
            isSaving={isSaving}
            isPublished={isPublished}
          />
        )}
    </FormSection>
  );
}