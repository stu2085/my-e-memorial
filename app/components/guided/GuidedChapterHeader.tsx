type GuidedChapterHeaderProps = {
  chapterNumber: number;
  totalChapters: number;
  title: string;
  description: string;
};

export default function GuidedChapterHeader({
  chapterNumber,
  totalChapters,
  title,
  description,
}: GuidedChapterHeaderProps) {
  const progress = (chapterNumber / totalChapters) * 100;

  return (
    <header className="mb-10">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Chapter {chapterNumber} of {totalChapters}
          </span>

          <span className="text-sm font-medium text-stone-500">
            {Math.round(progress)}% Complete
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-stone-900 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold uppercase tracking-[0.25em] text-stone-500">
  {toChapterWord(chapterNumber)}
</h2>

<h1 className="mt-3 break-words text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-5xl">
  {title}
</h1>

<div className="mt-8 max-w-3xl rounded-2xl border-l-4 border-stone-700 bg-stone-50 px-6 py-5">
  <p className="text-lg italic leading-8 text-stone-700">
    "{description}"
  </p>
</div>
    </header>
  );
}
function toChapterWord(chapterNumber: number): string {
  const words = [
    "Chapter One",
    "Chapter Two",
    "Chapter Three",
    "Chapter Four",
    "Chapter Five",
    "Chapter Six",
    "Chapter Seven",
    "Chapter Eight",
    "Chapter Nine",
    "Chapter Ten",
    "Chapter Eleven",
    "Chapter Twelve",
    "Chapter Thirteen",
    "Chapter Fourteen",
    "Chapter Fifteen",
  ];

  return words[chapterNumber - 1] ?? `Chapter ${chapterNumber}`;
}