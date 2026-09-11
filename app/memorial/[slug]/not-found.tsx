import Link from "next/link";

export default function MemorialNotFound() {
  return (
    <main className="min-h-[60vh] bg-stone-100 px-4 py-12 md:px-8 md:py-16">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm md:p-10">
        <p className="text-base font-semibold uppercase tracking-[0.16em] text-blue-950">
          Public MyEMemorial
        </p>

        <h1 className="mt-3 text-3xl font-bold text-stone-900 md:text-4xl">
          Memorial Not Available
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600 md:text-lg">
          This MyEMemorial may have been removed, made private, or the address
          may be incorrect.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/search"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-blue-950 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-900"
          >
            Search Public MyEMemorials
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-base font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
