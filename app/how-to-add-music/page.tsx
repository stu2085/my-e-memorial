import Link from "next/link";

export default function HowToAddMusicPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm md:p-10">
        <Link
          href="/"
          className="text-sm font-semibold text-stone-600 underline hover:text-stone-900"
        >
          ← Back to MyEMemorial
        </Link>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-stone-900">
          How to Add Music to a Memorial
        </h1>

        <p className="mt-4 text-stone-700">
          You can upload songs or personal recordings to a memorial using common audio files.
          MyEMemorial supports MP3, M4A, AAC, and WAV files.
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-stone-900">
            Best Options
          </h2>

          <ul className="list-disc space-y-2 pl-6 text-stone-700">
            <li>Upload an MP3, M4A, AAC, or WAV audio file.</li>
            <li>iPhone Voice Memos usually create M4A files.</li>
            <li>Phone-recorded songs or hymns can be uploaded.</li>
            <li>For best results, keep recordings clear and avoid background noise.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-stone-900">
            How to Record on iPhone
          </h2>

          <ol className="list-decimal space-y-2 pl-6 text-stone-700">
            <li>Open the Voice Memos app.</li>
            <li>Tap the red record button.</li>
            <li>Record the song.</li>
            <li>Tap Done when finished.</li>
            <li>Tap the recording, then tap Share.</li>
            <li>Email it to yourself or save it to Files.</li>
            <li>On MyEMemorial, upload that file in the Favorite Songs section.</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-bold text-stone-900">
            Permission Reminder
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-700">
            Only upload songs, recordings, or audio files you have permission to use.
            Personally recorded songs & hymns are often the safest choice.
          </p>
        </section>
      </div>
    </main>
  );
}