"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  maidenName: string;
  nickname: string;
  gender: string;
  birthDate: string;
  deathDate: string;
  obituary: string;
  lifeStory: string;
  cemeteryName: string;
  graveSection: string;
  graveRow: string;
  gravePlot: string;
    placesLived: string;
    placesWorked: string;
  schoolsAttended: string;
  awardsWon: string;
};

type MemorialRecord = {
  id?: number;
  slug?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  nickname?: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  obituary?: string;
  life_story?: string;
  cemetery_name?: string;
  grave_section?: string;
  grave_row?: string;
  grave_plot?: string;
    places_lived?: string;
    places_worked?: string;
  schools_attended?: string;
  awards_won?: string;
  headstone_photos?: string[];
  gallery_photos?: string[];
};

const initialForm: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  maidenName: "",
  nickname: "",
  gender: "",
  birthDate: "",
  deathDate: "",
  obituary: "",
  lifeStory: "",
  cemeteryName: "",
  graveSection: "",
  graveRow: "",
  gravePlot: "",
    placesLived: "",
    placesWorked: "",
  schoolsAttended: "",
  awardsWon: "",
};

const US_STATES = [
  "",
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

function makeSlug(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getUniqueSlug(baseSlug: string, currentSlug?: string) {
  let testSlug = baseSlug;
  let counter = 2;

  while (true) {
    const { data, error } = await supabase
      .from("memorials")
      .select("slug")
      .eq("slug", testSlug)
      .maybeSingle();

    if (error) throw error;

    if (!data || data.slug === currentSlug) {
      return testSlug;
    }

    testSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export default function EditMemorialPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [form, setForm] = useState<FormState>(initialForm);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [headstonePhotos, setHeadstonePhotos] = useState<string[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [headstoneFiles, setHeadstoneFiles] = useState<File[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [headstonePreviews, setHeadstonePreviews] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadMemorial() {
      if (!slug || typeof slug !== "string") {
        setErrorMessage("Missing memorial slug.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage("Could not load this memorial.");
        setIsLoading(false);
        return;
      }

      const memorial = data as MemorialRecord;

      setRecordId(memorial.id ?? null);
      setOriginalSlug(memorial.slug || "");
      setForm({
        firstName: memorial.first_name || "",
        middleName: memorial.middle_name || "",
        lastName: memorial.last_name || "",
        maidenName: memorial.maiden_name || "",
        nickname: memorial.nickname || "",
        gender: memorial.gender || "",
        birthDate: memorial.birth_date || "",
        deathDate: memorial.death_date || "",
        obituary: memorial.obituary || "",
        lifeStory: memorial.life_story || "",
        cemeteryName: memorial.cemetery_name || "",
        graveSection: memorial.grave_section || "",
        graveRow: memorial.grave_row || "",
        gravePlot: memorial.grave_plot || "",
                placesLived: memorial.places_lived || "",
        placesWorked: memorial.places_worked || "",
        schoolsAttended: memorial.schools_attended || "",
        awardsWon: memorial.awards_won || "",
      });
      setHeadstonePhotos(memorial.headstone_photos || []);
      setGalleryPhotos(memorial.gallery_photos || []);
      setIsLoading(false);
    }

    loadMemorial();
  }, [slug]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageUpload(
    e: ChangeEvent<HTMLInputElement>,
    type: "headstone" | "gallery"
  ) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const previews = files.map((file) => URL.createObjectURL(file));

    if (type === "headstone") {
      const slotsRemaining = Math.max(0, 2 - headstonePhotos.length - headstoneFiles.length);
      const acceptedFiles = files.slice(0, slotsRemaining);
      const acceptedPreviews = previews.slice(0, slotsRemaining);
      setHeadstoneFiles((prev) => [...prev, ...acceptedFiles]);
      setHeadstonePreviews((prev) => [...prev, ...acceptedPreviews]);
    } else {
      setGalleryFiles((prev) => [...prev, ...files]);
      setGalleryPreviews((prev) => [...prev, ...previews]);
    }

    e.target.value = "";
  }

  function removeExistingPhoto(type: "headstone" | "gallery", index: number) {
    if (type === "headstone") {
      setHeadstonePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function removeNewPhoto(type: "headstone" | "gallery", index: number) {
    if (type === "headstone") {
      setHeadstoneFiles((prev) => prev.filter((_, i) => i !== index));
      setHeadstonePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
      setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  }

  async function uploadFiles(files: File[], slugValue: string, folder: string) {
    if (!files.length) return [];

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `${slugValue}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("memorial-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("memorial-photos")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!recordId) {
      setErrorMessage("No memorial record loaded.");
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMessage("Please enter at least a first name and last name.");
      return;
    }

    try {
      setIsSubmitting(true);

      const baseSlug = makeSlug(form.firstName, form.lastName);

      if (!baseSlug) {
        setErrorMessage("Could not create a memorial URL. Please check the name.");
        setIsSubmitting(false);
        return;
      }

      const finalSlug = await getUniqueSlug(baseSlug, originalSlug);

      const newHeadstoneUrls = await uploadFiles(headstoneFiles, finalSlug, "headstones");
      const newGalleryUrls = await uploadFiles(galleryFiles, finalSlug, "gallery");

      const updatedHeadstonePhotos = [...headstonePhotos, ...newHeadstoneUrls].slice(0, 2);
      const updatedGalleryPhotos = [...galleryPhotos, ...newGalleryUrls];

      const updateData = {
        slug: finalSlug,
        full_name: [
          form.firstName,
          form.middleName,
          form.lastName,
          form.maidenName ? `(${form.maidenName})` : "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
        first_name: form.firstName || "",
        middle_name: form.middleName || "",
        last_name: form.lastName || "",
        maiden_name: form.maidenName || "",
        nickname: form.nickname || "",
        gender: form.gender || "",
        birth_date: form.birthDate || null,
        death_date: form.deathDate || null,
        obituary: form.obituary || "",
        life_story: form.lifeStory || "",
        cemetery_name: form.cemeteryName || "",
        grave_section: form.graveSection || "",
        grave_row: form.graveRow || "",
        grave_plot: form.gravePlot || "",
                places_lived: form.placesLived || "",
                places_worked: form.placesWorked || "",
        schools_attended: form.schoolsAttended || "",
        awards_won: form.awardsWon || "",
        headstone_photos: updatedHeadstonePhotos,
        gallery_photos: updatedGalleryPhotos,
      };

      const { error } = await supabase
        .from("memorials")
        .update(updateData)
        .eq("id", recordId);

      if (error) throw error;

      setOriginalSlug(finalSlug);
      setHeadstonePhotos(updatedHeadstonePhotos);
      setGalleryPhotos(updatedGalleryPhotos);
      setHeadstoneFiles([]);
      setGalleryFiles([]);
      setHeadstonePreviews([]);
      setGalleryPreviews([]);
      setSuccessMessage("Memorial updated successfully.");
setIsSubmitting(false);
      window.location.href = `/memorial/${finalSlug}`;
    } catch (error) {
      console.error("UPDATE ERROR:", error);
      const message =
        error instanceof Error ? error.message : "There was a problem updating this memorial.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-stone-600">Loading memorial for editing...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-stone-900">Edit Memorial</h1>
          <p className="mt-3 text-lg text-stone-600">
            Update details, replace text, and add or remove photos.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            <Section title="Basic Identity">
              <Grid>
                <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
                <Input label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} />
                <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
                <Input label="Maiden Name" name="maidenName" value={form.maidenName} onChange={handleChange} />
                <Input label="Nickname" name="nickname" value={form.nickname} onChange={handleChange} />
                <Select
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={["", "Male", "Female", "Other", "Prefer not to say"]}
                />
                <Input label="Birth Date" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} />
                <Input label="Death Date" name="deathDate" type="date" value={form.deathDate} onChange={handleChange} />
              </Grid>
            </Section>

            <Section title="Life Story">
              <div className="space-y-6">
                <Textarea label="Obituary" name="obituary" value={form.obituary} onChange={handleChange} rows={5} />
                <Textarea label="Life Story" name="lifeStory" value={form.lifeStory} onChange={handleChange} rows={8} />
              </div>
            </Section>

            <Section title="Cemetery & Grave Details">
              <Grid>
                <Input label="Cemetery Name" name="cemeteryName" value={form.cemeteryName} onChange={handleChange} />
                <Input label="Section" name="graveSection" value={form.graveSection} onChange={handleChange} />
                <Input label="Row" name="graveRow" value={form.graveRow} onChange={handleChange} />
                <Input label="Plot" name="gravePlot" value={form.gravePlot} onChange={handleChange} />
              </Grid>
            </Section>

           <Section title="Places Lived, Places Worked, Schools & Awards">
  <div className="grid grid-cols-1 gap-6">
    <Textarea
      label="Places Lived"
      name="placesLived"
      value={form.placesLived}
      onChange={handleChange}
      rows={5}
    />

    <Textarea
      label="Places Worked"
      name="placesWorked"
      value={form.placesWorked}
      onChange={handleChange}
      rows={5}
    />

    <Input
      label="Schools Attended"
      name="schoolsAttended"
      value={form.schoolsAttended}
      onChange={handleChange}
    />

    <Input
      label="Awards Won"
      name="awardsWon"
      value={form.awardsWon}
      onChange={handleChange}
    />
  </div>
</Section>

            <Section title="Photos">
              <div className="space-y-8">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Existing Headstone Photos
                  </label>
                  <PhotoGrid
                    photos={headstonePhotos}
                    onRemove={(index) => removeExistingPhoto("headstone", index)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Add New Headstone Photos (up to 2 total)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, "headstone")}
                    className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-700"
                  />
                  <PhotoGrid
                    photos={headstonePreviews}
                    onRemove={(index) => removeNewPhoto("headstone", index)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Existing Gallery Photos
                  </label>
                  <PhotoGrid
                    photos={galleryPhotos}
                    onRemove={(index) => removeExistingPhoto("gallery", index)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Add New Gallery Photos
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, "gallery")}
                    className="block w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-700"
                  />
                  <PhotoGrid
                    photos={galleryPreviews}
                    onRemove={(index) => removeNewPhoto("gallery", index)}
                  />
                </div>
              </div>
            </Section>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => window.location.href = originalSlug ? `/memorial/${originalSlug}` : "/search"}
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-stone-50 p-5 md:p-6">
      <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
}

type ChangeHandler = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => void;

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500"
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500"
      >
        {options.map((option) => (
          <option key={option || "blank"} value={option}>
            {option || "Select one"}
          </option>
        ))}
      </select>
    </div>
  );
}

function PhotoGrid({
  photos,
  onRemove,
}: {
  photos: string[];
  onRemove: (index: number) => void;
}) {
  if (photos.length === 0) {
    return <p className="mt-2 text-sm text-stone-500">No photos yet.</p>;
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      {photos.map((photo, index) => (
        <div
          key={`${photo}-${index}`}
          className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
        >
          <img src={photo} alt={`Preview ${index + 1}`} className="h-36 w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-full border-t border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}