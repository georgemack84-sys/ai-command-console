import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export function SourceBreakdownPanel({ model }: { model: AdvisoryReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="source-breakdown-panel">
      <p className="text-xs uppercase text-sky-200">Source Breakdown</p>
      <div className="mt-4 grid gap-3">
        {model.sourceBreakdown.map((source) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={source.source}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">{source.source}</h2>
              <span className="rounded border border-slate-500 px-2 py-1 text-xs text-slate-100">{source.status}</span>
            </div>
            <dl className="mt-3 grid gap-2 text-sm text-slate-200 sm:grid-cols-3">
              <div>
                <dt className="text-slate-400">Risk</dt>
                <dd>{source.risk || "Unavailable"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Replayable</dt>
                <dd>{source.replayable ? "true" : "false"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Evidence</dt>
                <dd>{source.evidenceAvailable ? "available" : "missing"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
