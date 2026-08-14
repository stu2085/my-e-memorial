import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Start preserving your story at no cost.",
    features: [
      "Life story",
      "Basic information",
      "A small photo gallery",
      "Share your Personal E-Memorial",
    ],
  },
  {
    name: "Basic",
    price: "$49.95",
    description: "A meaningful way to preserve your story in more depth.",
    features: [
      "Up to 50 photos",
      "Up to 15 minutes of video",
      "Favorite music",
      "Family history",
      "Guided Memory Builder",
    ],
  },
  {
    name: "Plus",
    price: "$69.95",
    description: "More room for memories, stories, photos, and video.",
    features: [
      "Up to 150 photos",
      "Up to 30 minutes of video",
      "Favorite music",
      "Family history",
      "Guided Memory Builder",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$89.95",
    description: "Our most complete Personal E-Memorial experience.",
    features: [
      "Unlimited photos",
      "Up to 60 minutes of video",
      "Favorite music",
      "Family history",
      "Guided Memory Builder",
    ],
  },
];

const benefits = [
  {
    icon: "🎙️",
    title: "Tell Your Story in Your Own Words",
    text: "Preserve the experiences, memories, lessons, and moments that shaped your life while you can still tell them yourself.",
  },
  {
    icon: "📷",
    title: "Preserve Photos and Memories",
    text: "Bring together meaningful photos, stories, videos, favorite songs, family history, and important life events.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Share With Family",
    text: "Give your children, grandchildren, relatives, and future generations a place where they can truly know your story.",
  },
  {
    icon: "🔐",
    title: "You Stay in Control",
    text: "Continue updating your Personal E-Memorial throughout your life and decide how and when it is shared.",
  },
];

export default function PersonalEMemorialPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec]">
      <section className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-white shadow-sm lg:grid-cols-2">
            <div className="p-7 md:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-700">
                Personal E-Memorials for the Living
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
                Tell Your Life Story While You Can Still Tell It Yourself
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                Preserve your memories, photos, videos, favorite songs, family
                history, and life experiences so the people you love and future
                generations can truly know you.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/create?mode=personal"
                  className="inline-flex h-[58px] w-full max-w-[300px] items-center justify-center rounded-full bg-amber-400 px-6 text-center text-sm font-bold text-stone-900 transition hover:bg-amber-300"
                >
                  Create Your Personal E-Memorial
                </Link>

                <Link
                  href="/gift?type=personal"
                  className="inline-flex h-[58px] w-full max-w-[300px] items-center justify-center rounded-full bg-blue-950 px-6 text-center text-sm font-bold text-white transition hover:bg-blue-900"
                >
                  🎁 Gift a Personal E-Memorial
                </Link>
              </div>
            </div>

            <div className="relative min-h-[360px] bg-stone-200 lg:min-h-[520px]">
             <div
  className="absolute inset-0 bg-cover bg-center"
  style={{
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.06), rgba(255,255,255,0.06)), url('/Images/personal-ememorial-hero.png')",
  }}
/>

              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                  Your Story. Your Voice. Your Legacy.
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Keep building your story over time, then let a trusted backup
                  person complete the final details when the time comes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                    Local Living Resources
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-stone-900">
                    Planning Ahead
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Helpful local services for protecting your family, wishes,
                    and legacy.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">⚖️</span>
                  <span className="mt-2 block font-bold text-stone-900">
                    Estate Planning Attorneys
                  </span>
                  <span className="mt-1 block text-sm text-stone-600">
                    Find local attorneys
                  </span>
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">📜</span>
                  <span className="mt-2 block font-bold text-stone-900">
                    Wills & Trusts
                  </span>
                  <span className="mt-1 block text-sm text-stone-600">
                    Find planning resources
                  </span>
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="text-2xl">📈</span>
                  <span className="mt-2 block font-bold text-stone-900">
                    Financial Planning
                  </span>
                  <span className="mt-1 block text-sm text-stone-600">
                    Find local advisors
                  </span>
                </button>
              </div>
            </aside>

            <div className="space-y-8">
              <section className="rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm md:p-8">
                <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                      Personal Introduction Video
                    </p>

                    <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                      A Better Way to Preserve the Story of Your Life
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-200 md:text-base">
                      This area will contain the short autoplay introduction
                      video explaining what a Personal E-Memorial is, how it
                      works, and why creating one while living matters.
                    </p>
                  </div>

                  <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/20 bg-black/30 shadow-inner">
                    <div className="text-center">
                      <div className="text-5xl">▶</div>
                      <p className="mt-3 text-sm font-semibold text-stone-200">
                        Intro Video Will Play Here
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                    Why Create One?
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    Your Life Is More Than Two Dates
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
                    >
                      <div className="text-3xl">{benefit.icon}</div>

                      <h3 className="mt-3 text-lg font-bold text-stone-900">
                        {benefit.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {benefit.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                    How It Works
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    Create It Now. Keep Adding to It. Preserve It Forever.
                  </h2>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  <div className="rounded-2xl bg-stone-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                      1
                    </div>

                    <h3 className="mt-4 font-bold text-stone-900">
                      Create Your Story
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Add your life story, photos, family history, memories,
                      videos, music, and meaningful experiences.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-stone-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                      2
                    </div>

                    <h3 className="mt-4 font-bold text-stone-900">
                      Keep It Growing
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Continue adding memories throughout your life and decide
                      when and how you want your Personal E-Memorial shared.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-stone-50 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-stone-900">
                      3
                    </div>

                    <h3 className="mt-4 font-bold text-stone-900">
                      Your Backup Person Completes It
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      A trusted person can add final information after your
                      passing while preserving the story you created yourself.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-[#eee7dc] p-6 shadow-sm md:p-8">
                <div className="grid items-center gap-8 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                      In Your Own Voice
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-stone-900">
                      Record Memories Directly From Your Phone or Computer
                    </h2>

                    <p className="mt-4 text-base leading-7 text-stone-700">
                      Personal E-Memorials will allow you to record video
                      memories directly from your camera and microphone, making
                      it easier to preserve your voice, expressions, stories,
                      and personality.
                    </p>

                    <p className="mt-4 text-sm leading-6 text-stone-600">
                      This feature will be integrated with the existing Video
                      Memories system so recorded videos become part of your
                      memorial just like uploaded videos.
                    </p>
                  </div>

                  <div className="flex min-h-[280px] items-center justify-center rounded-3xl bg-white p-6 shadow-sm">
                    <div className="text-center">
                      <div className="text-6xl">🎥</div>
                      <p className="mt-4 text-lg font-bold text-stone-900">
                        Write Your Answer
                      </p>
                      <p className="mt-1 text-sm text-stone-500">or</p>
                      <p className="mt-1 text-lg font-bold text-amber-700">
                        Record Your Answer
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                    Personal E-Memorial Plans
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-stone-900">
                    Start Free or Choose the Plan That Fits Your Story
                  </h2>

                  <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
                    All plans are designed to help preserve your story. Paid
                    plans provide more room for photos, videos, family history,
                    music, and guided storytelling.
                  </p>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative flex flex-col rounded-3xl border p-6 ${
                        plan.popular
                          ? "border-2 border-blue-950 bg-blue-950 text-white"
                          : "border-stone-200 bg-stone-50 text-stone-900"
                      }`}
                    >
                      {plan.popular && (
                        <div className="mb-4">
                          <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-900">
                            Most Popular
                          </span>
                        </div>
                      )}

                      <h3 className="text-xl font-bold">{plan.name}</h3>

                      <p className="mt-3 text-3xl font-bold">{plan.price}</p>

                      <p
                        className={`mt-3 text-sm leading-6 ${
                          plan.popular ? "text-stone-200" : "text-stone-600"
                        }`}
                      >
                        {plan.description}
                      </p>

                      <ul
                        className={`mt-5 space-y-2 text-sm ${
                          plan.popular ? "text-stone-100" : "text-stone-700"
                        }`}
                      >
                        {plan.features.map((feature) => (
                          <li key={feature}>✔ {feature}</li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-6">
                        <Link
                          href="/create?mode=personal"
                          className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition ${
                            plan.popular
                              ? "bg-white text-stone-900 hover:bg-stone-200"
                              : "bg-stone-900 text-white hover:bg-stone-700"
                          }`}
                        >
                          {plan.name === "Free" ? "Start Free" : "Choose Plan"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-center text-sm text-stone-500">
                  Paid plans are one-time payments with no recurring
                  subscription fee.
                </p>
              </section>

              <section className="rounded-[2rem] bg-blue-950 p-7 text-center text-white shadow-sm md:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                  Preserve the Story Only You Can Tell
                </p>

                <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold md:text-4xl">
                  Give Your Family More Than Names, Dates, and Photographs
                </h2>

                <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-stone-200">
                  Create a place where future generations can hear your voice,
                  see your memories, understand your experiences, and know the
                  person behind the dates.
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/create?mode=personal"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300"
                  >
                    Create Your Personal E-Memorial
                  </Link>

                  <Link
                    href="/gift?type=personal"
                    className="inline-flex min-h-[56px] w-full max-w-[290px] items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    🎁 Give One as a Gift
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}