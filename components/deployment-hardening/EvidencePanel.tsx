import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

export function EvidencePanel({ model }: { model: DeploymentHardeningReadModel }) {
  const missing = model.artifacts.filter((artifact) => !artifact.available || artifact.malformed);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="evidence-panel">
      <p className="text-xs uppercase text-sky-200">Evidence</p>
      <h2 className="mt-1 text-xl font-semibold text-white">
        {model.evidenceAvailable ? "Complete" : "Evidence incomplete. Do not infer safety."}
      </h2>
      {missing.length ? (
        <p className="mt-3 text-sm text-amber-100">{missing.length} artifact issues require operator review.</p>
      ) : null}
      <dl className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
        <div>
          <dt className="text-slate-400">Enforcement</dt>
          <dd>{model.enforcementMode}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Decision</dt>
          <dd>{model.enforcementDecision}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Blocked</dt>
          <dd>{model.blocked ? "true" : "false"}</dd>
        </div>
      </dl>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm text-slate-200">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2 pr-3">Artifact</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Hash</th>
            </tr>
          </thead>
          <tbody>
            {model.artifacts.map((artifact) => (
              <tr key={artifact.name} className="border-t border-slate-800">
                <td className="py-2 pr-3">{artifact.name}</td>
                <td className="py-2 pr-3">{artifact.malformed ? "malformed" : artifact.available ? "available" : "missing"}</td>
                <td className="break-all py-2 pr-3 text-xs">{artifact.hash || artifact.reason || "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
