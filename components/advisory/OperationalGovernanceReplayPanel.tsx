import type { OperationalGovernanceIntegration } from "@/services/advisory/advisoryOperationalGovernanceIntegration";

function sortedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function OperationalGovernanceReplayPanel({
  integration,
}: {
  integration: OperationalGovernanceIntegration;
}) {
  const replayRows = [
    ["replayable", integration.replayReadiness.replayable],
    ["seal lineage visible", integration.replayReadiness.sealLineageVisible],
    ["verification lineage visible", integration.replayReadiness.verificationLineageVisible],
    ["certification lineage visible", integration.replayReadiness.certificationLineageVisible],
    ["artifact continuity visible", integration.replayReadiness.artifactContinuityVisible],
  ] as const;

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="operational-governance-replay-panel">
      <p className="text-xs uppercase text-sky-200">Replay Visibility</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Replay readiness is visible, not mutable</h2>
      <dl className="mt-4 grid gap-3">
        {replayRows.map(([label, value]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={label}>
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-100">{label} {String(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5" data-testid="operational-governance-reasons">
        <p className="text-xs uppercase text-slate-400">Reasons</p>
        {integration.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No operational governance integration reasons recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedReasons(integration.reasons).map((reason) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
