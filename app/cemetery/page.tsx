const cemeteries = [
  {
    name: "Greenwood Memorial Cemetery",
    slug: "greenwood-memorial-cemetery",
    address: "123 Memory Lane, Lancaster, PA 17601",
  },
  {
    name: "St. Joseph Cemetery",
    slug: "st-joseph-cemetery",
    address: "456 Sacred Heart Drive, Lancaster, PA 17602",
  },
  {
    name: "Lancaster Cemetery",
    slug: "lancaster-cemetery",
    address: "789 Heritage Road, Lancaster, PA 17603",
  },
];

export default function CemeteryDirectoryPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <h1 className="text-4xl font-bold text-stone-900">
            Cemetery Directory
          </h1>

          <p className="mt-4 text-lg text-stone-600">
            Select a cemetery to view memorials and grave locations.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {cemeteries.map((cemetery) => (
              <a
                key={cemetery.slug}
                href={`/cemetery/${cemetery.slug}`}
                className="block rounded-3xl border border-stone-200 bg-stone-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h2 className="text-2xl font-bold text-stone-900">
                  {cemetery.name}
                </h2>

                <p className="mt-3 text-stone-600">{cemetery.address}</p>

                <p className="mt-4 text-sm font-semibold text-stone-800">
                  View cemetery →
                </p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}