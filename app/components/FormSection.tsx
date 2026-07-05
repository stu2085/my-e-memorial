export default function FormSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200/80 bg-stone-50/70 p-6 transition hover:shadow-sm md:p-7">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>

        {description && (
          <p className="mt-2 leading-7 text-stone-600">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}