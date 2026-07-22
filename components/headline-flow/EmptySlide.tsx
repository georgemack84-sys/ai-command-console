import Link from "next/link";

export function EmptySlide({ category, onClear }: { category: string; onClear: () => void }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-100">No stories available</p>
      <h2 className="mt-3 font-display text-3xl font-bold">Nothing is showing for {category}.</h2>
      <p className="mt-3 max-w-2xl text-slate-300">Hidden stories and category filters can empty the active slideshow.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onClear} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
          Restore hidden stories
        </button>
        <Link href="/?category=top" className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-bold text-white">
          Switch to Top Stories
        </Link>
      </div>
    </section>
  );
}
