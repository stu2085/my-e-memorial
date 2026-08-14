import Link from "next/link";

export default function PersonalEMemorialPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Personal E-Memorial
          </p>

          <h1 className="mt-4 text-3xl font-bold text-stone-900 md:text-5xl">
            Preserve Your Life Story While You Can Still Tell It Yourself
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
            Create a Personal E-Memorial to preserve your memories, photos,
            videos, favorite songs, family history, and the stories that shaped
            your life for the people you love and future generations.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/create?mode=personal"
              className="inline-flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300"
            >
              Create Your Personal E-Memorial
            </Link>

            <Link
              href="/gift?type=personal"
              className="inline-flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
            >
              Gift a Personal E-Memorial
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}