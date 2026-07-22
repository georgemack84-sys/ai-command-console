export function LoadingSlide() {
  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-[28px] border border-white/12 bg-[#07111f] lg:grid-cols-[46%_54%]">
      <div className="min-h-[280px] animate-pulse bg-slate-800/60" />
      <div className="space-y-6 p-8 lg:p-10">
        <div className="h-9 w-36 rounded-full bg-white/10" />
        <div className="h-12 w-11/12 rounded bg-white/10" />
        <div className="h-12 w-4/5 rounded bg-white/10" />
        <div className="h-5 w-full rounded bg-white/10" />
        <div className="h-5 w-3/4 rounded bg-white/10" />
      </div>
    </div>
  );
}
