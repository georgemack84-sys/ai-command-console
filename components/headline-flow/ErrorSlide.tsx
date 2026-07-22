export function ErrorSlide({ message, onRetry, onMock }: { message: string; onRetry: () => void; onMock: () => void }) {
  return (
    <section className="rounded-[28px] border border-red-300/20 bg-red-950/20 p-8 text-white">
      <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-100">Headline service</p>
      <h2 className="mt-3 font-display text-3xl font-bold">Unable to load stories</h2>
      <p className="mt-3 max-w-2xl text-slate-300">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
          Retry
        </button>
        <button type="button" onClick={onMock} className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-bold text-white">
          Load mock headlines
        </button>
      </div>
    </section>
  );
}
