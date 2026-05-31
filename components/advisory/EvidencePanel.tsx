import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export function EvidencePanel({ model }: { model: AdvisoryReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="evidence-panel">
      <p className="text-xs uppercase text-sky-200">Evidence Completeness</p>
      <dl className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Available</dt>
          <dd className="text-2xl font-semibold text-white">{model.evidenceCompleteness.available} available</dd>
        </div>
        <div>
          <dt className="text-slate-400">Missing</dt>
          <dd className="text-2xl font-semibold text-white">{model.evidenceCompleteness.missing} missing</dd>
        </div>
      </dl>
      {model.evidenceCompleteness.missing > 0 ? (
        <p className="mt-4 rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Evidence incomplete. Do not infer safety.
        </p>
      ) : null}
    </section>
  );
}
