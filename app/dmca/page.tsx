export default function DmcaPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">
          Copyright and DMCA Policy
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Last updated: August 12, 2026
        </p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-stone-700">

          <section>
            <h2 className="font-semibold text-stone-900">
              Copyright Policy
            </h2>

            <p className="mt-2">
              MyEMemorial respects the intellectual property rights of
              others and expects users of the MyEMemorial service to do
              the same.
            </p>

            <p className="mt-2">
              Users may not upload, publish, or distribute photographs,
              videos, music, written material, obituary content,
              newspaper material, or other content unless they own the
              content or have the legal right or permission to use it.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              DMCA Designated Agent
            </h2>

            <p className="mt-2">
              Notices of claimed copyright infringement relating to
              content available through MyEMemorial may be sent to:
            </p>

            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="font-semibold text-stone-900">
                MyEMemorial DMCA Designated Agent
              </p>

              <p className="mt-2">
                John Michael Stum
                <br />
                MyEMemorial
                <br />
                1128-D River Road
                <br />
                Holtwood, PA 17532
                <br />
                United States
                <br />
                Phone: 717-940-5760
                <br />
                Email:{" "}
                <a
                  href="mailto:mike@myememorial.com"
                  className="text-blue-900 underline hover:text-blue-700"
                >
                  mike@myememorial.com
                </a>
              </p>

              <p className="mt-3 text-xs text-stone-500">
                U.S. Copyright Office DMCA Registration Number:
                DMCA-1078099
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              Submitting a Copyright Infringement Notice
            </h2>

            <p className="mt-2">
              To submit a notification of claimed copyright
              infringement, provide a written notice containing
              substantially the following information:
            </p>

            <ol className="ml-5 mt-3 list-decimal space-y-2">
              <li>
                A physical or electronic signature of the copyright
                owner or a person authorized to act on behalf of the
                copyright owner.
              </li>

              <li>
                Identification of the copyrighted work claimed to have
                been infringed. If multiple copyrighted works are
                involved, you may provide a representative list.
              </li>

              <li>
                Identification of the material claimed to be infringing
                and information reasonably sufficient to allow
                MyEMemorial to locate the material, such as the
                memorial page URL and a description of the content.
              </li>

              <li>
                Information reasonably sufficient to allow MyEMemorial
                to contact you, such as your name, mailing address,
                telephone number, and email address.
              </li>

              <li>
                A statement that you have a good-faith belief that use
                of the material in the manner complained of is not
                authorized by the copyright owner, its agent, or the
                law.
              </li>

              <li>
                A statement that the information in your notice is
                accurate and, under penalty of perjury, that you are
                authorized to act on behalf of the owner of the
                exclusive right that is allegedly infringed.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              What Happens After a Notice Is Received
            </h2>

            <p className="mt-2">
              MyEMemorial may review a copyright complaint and,
              when appropriate, remove or disable access to material
              claimed to be infringing.
            </p>

            <p className="mt-2">
              MyEMemorial may also notify the affected user and take
              appropriate action regarding users who repeatedly
              infringe the copyrights of others.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              Counter Notifications
            </h2>

            <p className="mt-2">
              If material you submitted is removed or disabled because
              of a copyright complaint and you believe the material was
              removed as a result of mistake or misidentification, you
              may contact the MyEMemorial designated agent regarding
              the applicable counter-notification procedure.
            </p>

            <p className="mt-2">
              Because DMCA notices and counter notifications can have
              legal consequences, you may wish to consult an attorney
              before submitting one.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-900">
              False or Misleading Claims
            </h2>

            <p className="mt-2">
              Knowingly making material misrepresentations in a
              copyright notification or counter notification may result
              in legal liability under applicable law.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}