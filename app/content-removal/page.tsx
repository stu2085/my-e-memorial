export default function ContentRemovalPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
          Content Removal Policy
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Last updated: May 15, 2026
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-stone-700">

          <section>
            <h2 className="font-semibold text-stone-900">
              1. Memorial Review Requests
            </h2>

            <p>
              Family members, legal representatives, or other concerned parties
              may request review or removal of memorial content they believe is:
            </p>

            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>Inaccurate or misleading</li>
              <li>Unauthorized or impersonating another person</li>
              <li>Offensive, abusive, or inappropriate</li>
              <li>Violating privacy or legal rights</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              2. Copyright and Media Concerns
            </h2>

            <p>
              If you believe photos, videos, music, or written content infringe
              your copyright or rights of ownership, please contact us with
              sufficient detail so we can investigate the issue.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              3. Temporary Removal
            </h2>

            <p>
              MyEMemorial reserves the right to temporarily unpublish or remove
              memorials or submissions while disputes or investigations are
              reviewed.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              4. Review Process
            </h2>

            <p>
              Requests are reviewed individually. We may request additional
              information to verify identity or authority before taking action.
            </p>

            <p className="mt-2">
              We reserve the right to determine whether content violates our
              policies or applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              5. Contact
            </h2>

            <p>
              To request content review or removal, contact:
            </p>

            <p className="mt-2 font-medium">
              help@myememorial.com
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}