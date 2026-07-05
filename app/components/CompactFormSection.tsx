export default function CompactFormSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-stone-200/80 bg-stone-50/70 p-4 transition hover:shadow-sm md:p-5">
      <div className="mb-3">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-stone-600">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}