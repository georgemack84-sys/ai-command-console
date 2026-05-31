import type { AdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export function ReplayabilityPanel({ model }: { model: AdvisoryReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="replayability-panel">
      <p className="text-xs uppercase text-sky-200">Replayability</p>
      <dl className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Replayable Sources</dt>
          <dd className="text-2xl font-semibold text-white">{model.replayability.replayableSources} replayable</dd>
        </div>
        <div>
          <dt className="text-slate-400">Non-Replayable Sources</dt>
          <dd className="text-2xl font-semibold text-white">{model.replayability.nonReplayableSources} non-replayable</dd>
        </div>
      </dl>
      {model.replayability.nonReplayableSources > 0 ? (
        <p className="mt-4 rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          One or more advisory sources cannot be replayed. Operator review required.
        </p>
      ) : null}
    </section>
  );
}
