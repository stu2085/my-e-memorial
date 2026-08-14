import Link from "next/link";

export default function OnlineMemorialPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-900">
            E-Memorial
          </p>

          <h1 className="mt-4 text-3xl font-bold text-stone-900 md:text-5xl">
            Create a Lasting Memorial for Someone Who Has Passed Away
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
            Preserve their life story, photos, videos, favorite songs, family
            history, obituary, final resting place, and meaningful memories in
            one lasting memorial.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-blue-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
            >
              Create an E-Memorial
            </Link>

            <Link
              href="/gift"
              className="inline-flex min-h-[56px] w-full max-w-[280px] items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
            >
              Gift an E-Memorial
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}