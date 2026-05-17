export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
          Privacy Policy
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Last updated: May 15, 2026
        </p>

        <div className="mt-6 space-y-6 text-sm text-stone-700 leading-relaxed">

          <section>
            <h2 className="font-semibold text-stone-900">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide when creating a memorial,
              including names, photos, videos, written content, and optional
              location information.
            </p>
            <p className="mt-2">
              We may also collect technical data such as IP address, browser type,
              and usage data to improve our services.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              2. How We Use Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Provide and maintain memorial pages</li>
              <li>Process payments</li>
              <li>Improve the platform and user experience</li>
              <li>Ensure compliance with our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              3. Public Content
            </h2>
            <p>
              Memorials created on MyEMemorial are intended to be publicly visible
              unless otherwise specified. Information you choose to include in a
              memorial may be viewed by others.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              4. Payments
            </h2>
            <p>
              Payments are processed securely through third-party providers such
              as Stripe. We do not store full payment card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              5. Sharing of Information
            </h2>
            <p>
              We do not sell your personal information. We may share information
              with service providers (such as hosting, payment processing, and
              video delivery services) only as necessary to operate the platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              6. Data Storage and Security
            </h2>
            <p>
              We take reasonable measures to protect your data. However, no system
              is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              7. Your Rights
            </h2>
            <p>
              You may request updates or removal of your content by contacting us.
              We will make reasonable efforts to comply with such requests.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              8. Cookies and Tracking
            </h2>
            <p>
              We may use cookies and similar technologies to improve functionality
              and analyze usage. These do not typically identify you personally.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              9. Children’s Privacy
            </h2>
            <p>
              MyEMemorial is not intended for use by children under 13. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use
              of the service means you accept those changes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              11. Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at: <span className="font-medium">help@myememorial.com</span>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}