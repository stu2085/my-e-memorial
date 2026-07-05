// components/edit/NewspaperArticlesSection.tsx

import FormSection from "./FormSection";
import QuickSaveButton from "./QuickSaveButton";

type NewspaperArticlesSectionProps = {
  newspaperArticles: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  splitGalleryPhotos: (value: string) => string[];
  setNewspaperArticleFiles: (files: File[]) => void;
  isSaving: boolean;
  isPublished: boolean;
};

export default function NewspaperArticlesSection({
  newspaperArticles,
  handleChange,
  splitGalleryPhotos,
  setNewspaperArticleFiles,
  isSaving,
  isPublished,
}: NewspaperArticlesSectionProps) {
  const articles = splitGalleryPhotos(newspaperArticles);

  return (
    <FormSection
      title="Newspaper Articles"
      description="Upload obituary clippings, newspaper articles, announcements, or other public records."
    >
      <input
        type="hidden"
        name="newspaperArticles"
        value={newspaperArticles}
        onChange={handleChange}
      />

      {articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <a
              key={`${article}-${index}`}
              href={article}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              View Newspaper Article {index + 1}
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">
          No newspaper articles uploaded yet.
        </p>
      )}

      <div className="mt-4">
        <label className="text-sm font-medium text-stone-700">
          Upload Newspaper Articles
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={(e) =>
            setNewspaperArticleFiles(Array.from(e.target.files ?? []))
          }
          className="w-full rounded-2xl border border-stone-300 px-4 py-3"
        />
        <p className="mt-2 text-sm text-stone-500">
          PDF or image files are supported.
        </p>
      </div>

      <QuickSaveButton isSaving={isSaving} isPublished={isPublished} />
    </FormSection>
  );
}