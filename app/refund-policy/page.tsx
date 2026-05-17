export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
          Refund Policy
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Last updated: May 15, 2026
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-stone-700">

          <section>
            <h2 className="font-semibold text-stone-900">
              1. Memorial Purchases
            </h2>

            <p>
              Memorial purchases are generally non-refundable once a memorial
              page has been created or digital services have been delivered.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              2. Advertising Purchases
            </h2>

            <p>
              Advertising purchases are generally non-refundable after an
              advertisement has been activated or displayed on the platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              3. Billing Errors
            </h2>

            <p>
              If you believe you were charged incorrectly, please contact us as
              soon as possible so we can review the issue.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              4. Chargebacks and Disputes
            </h2>

            <p>
              Filing a fraudulent or abusive chargeback may result in memorial
              suspension, advertiser suspension, or account restrictions.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              5. Contact
            </h2>

            <p>
              For billing or refund questions, contact:
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