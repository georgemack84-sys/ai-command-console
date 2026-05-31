import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export function AdvisorySummaryPanel({ model }: { model: AdvisoryReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="advisory-summary-panel">
      <p className="text-xs uppercase text-sky-200">Unified Advisory</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-400">Status</p>
          <p className="text-3xl font-semibold text-white">{model.unifiedStatus}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Risk</p>
          <p className="text-3xl font-semibold text-white">{model.unifiedRisk}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Snapshot Hash</dt>
          <dd className="break-words">{model.snapshotHash}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Generated</dt>
          <dd>{model.generatedAt}</dd>
        </div>
      </dl>
    </section>
  );
}
