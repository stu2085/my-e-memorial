import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Gift Purchase Complete | MyEMemorial",
  },
  description:
    "MyEMemorial gift purchase confirmation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type GiftSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function GiftSuccessPage({
  searchParams,
}: GiftSuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <div className="mb-6 text-6xl">🎁</div>

        <h1 className="text-4xl font-bold text-stone-900">
          Thank You!
        </h1>

        <p className="mt-6 text-lg leading-8 text-stone-700">
          Your MyEMemorial Gift purchase was successful.
        </p>

        <p className="mt-4 text-stone-600">
          We&apos;ve emailed your purchase confirmation.
        </p>

        <p className="mt-2 text-stone-600">
          Your recipient will soon receive an invitation to claim their gift
          and begin creating their MyEMemorial.
        </p>

        {sessionId && (
          <div className="mt-8 rounded-xl bg-stone-100 p-4">
            <p className="text-base text-stone-500">
              Stripe Session
            </p>

            <p className="mt-1 break-all font-mono text-base">
              {sessionId}
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-amber-400 px-8 py-3 font-semibold text-stone-900 hover:bg-amber-300"
          >
            Return Home
          </Link>

          <Link
            href="/search"
            className="rounded-full border border-stone-300 px-8 py-3 font-semibold text-stone-900 hover:bg-stone-100"
          >
            Search Memorials
          </Link>
        </div>
      </div>
    </main>
  );
}