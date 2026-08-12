import Link from "next/link";

export default function MomBirthdayGiftPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-800">
      {/* Header */}
      <header className="border-b border-amber-700/30 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-800 text-2xl font-bold text-slate-800">
            ME
          </div>

          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
              MyEMemorial
            </div>
            <div className="mt-1 text-base font-medium text-amber-700 md:text-lg">
              Where Life’s Stories Are Told
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        {/* Continue the teaser */}
        <section className="mx-auto max-w-3xl rounded-2xl bg-[#f6f3ed] px-6 py-7 shadow-sm md:px-9 md:py-8">
          <p className="text-lg font-medium md:text-xl">
            (Continue reading...)
          </p>

          <div className="mt-5 space-y-5 text-lg leading-8 md:text-xl">
            <p>
              Give her the opportunity to preserve the story of her life —
              in her own words.
            </p>

            <p>
              The memories she treasures. The stories her children may not
              know. The family history only she may remember.
            </p>

            <p>
              Photos. Favorite songs. Videos. Places she&apos;s lived.
              Accomplishments. Family memories.
            </p>

            <p className="font-semibold">
              A birthday gift that can be treasured for generations.
            </p>
          </div>
        </section>

        {/* Video */}
        <section className="mt-9 overflow-hidden rounded-2xl bg-black shadow-lg">
          <div className="aspect-video w-full">
            <video
              className="h-full w-full object-cover"
              controls
              playsInline
            >
              {/* We will add the Mom birthday AI video source here */}
            </video>
          </div>
        </section>

        {/* Buttons */}
        <section className="mx-auto mt-9 max-w-3xl space-y-4">
          <Link
            href="/gift?type=personal"
            className="flex min-h-[76px] w-full items-center justify-between rounded-2xl bg-amber-600 px-7 text-lg font-bold text-white shadow-md transition hover:bg-amber-700 md:text-xl"
          >
            <span className="flex items-center gap-4">
              <span className="text-3xl">🎁</span>
              <span>Gift Mom a MyEMemorial</span>
            </span>

            <span className="text-3xl">›</span>
          </Link>

          <Link
            href="/memorial/daniel-james-whitmore"
            className="flex min-h-[76px] w-full items-center justify-between rounded-2xl border-2 border-slate-700 bg-white px-7 text-lg font-bold text-slate-800 transition hover:bg-stone-100 md:text-xl"
          >
            <span className="flex items-center gap-4">
              <span className="text-3xl">♧</span>
              <span>Experience a Sample MyEMemorial</span>
            </span>

            <span className="text-3xl">›</span>
          </Link>

          <Link
            href="/"
            className="flex min-h-[76px] w-full items-center justify-between rounded-2xl border-2 border-slate-700 bg-white px-7 text-lg font-bold text-slate-800 transition hover:bg-stone-100 md:text-xl"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-700 text-xl">
                i
              </span>
              <span>Learn More About MyEMemorial</span>
            </span>

            <span className="text-3xl">›</span>
          </Link>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-base text-stone-500 md:text-lg">
          MyEMemorial — Where Life’s Stories Are Told.
        </footer>
      </div>
    </main>
  );
}