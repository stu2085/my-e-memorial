export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
          DMCA / Copyright Policy
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Last updated: May 15, 2026
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-stone-700">

          <section>
            <h2 className="font-semibold text-stone-900">
              1. Respect for Copyright
            </h2>

            <p>
              MyEMemorial respects the intellectual property rights of others
              and expects users of the platform to do the same.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              2. Reporting Copyright Infringement
            </h2>

            <p>
              If you believe content hosted on MyEMemorial infringes your
              copyright, please provide a written notice containing:
            </p>

            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>Your name and contact information</li>
              <li>A description of the copyrighted work</li>
              <li>The URL or location of the allegedly infringing content</li>
              <li>A statement that you believe the use is unauthorized</li>
              <li>A statement made under penalty of perjury that your notice is accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              3. Removal of Content
            </h2>

            <p>
              MyEMemorial may remove or disable access to allegedly infringing
              content while claims are reviewed.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              4. Repeat Infringers
            </h2>

            <p>
              Accounts or users repeatedly submitting infringing content may
              have content removed or access restricted.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              5. Contact
            </h2>

            <p>
              Copyright notices should be sent to:
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