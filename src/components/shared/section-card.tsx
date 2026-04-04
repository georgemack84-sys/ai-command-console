export function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,19,31,0.9),rgba(8,19,31,0.74))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="mb-5">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-sky-300/85">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {children}
    </section>
  );
}
