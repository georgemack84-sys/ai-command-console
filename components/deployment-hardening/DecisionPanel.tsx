import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

function decisionNote(decision: string) {
  if (decision === "BLOCK_RECOMMENDED") return "recommendation only";
  if (decision === "DISPUTED") return "operator review required";
  return "read-only visibility";
}

export function DecisionPanel({ model }: { model: DeploymentHardeningReadModel }) {
  const latestDecision = model.timeline.findLast((event) => event.deploymentDecision === model.deploymentDecision);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="decision-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-sky-200">Decision</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{model.deploymentDecision}</h2>
        </div>
        <span className="rounded border border-slate-500 px-3 py-1 text-xs text-slate-200">ENFORCEMENT_DISABLED</span>
      </div>
      <dl className="mt-4 space-y-3 text-sm text-slate-200">
        <div>
          <dt className="text-slate-400">Risk</dt>
          <dd>{model.deploymentRisk}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Policy</dt>
          <dd>{latestDecision?.event ? "dh-deployment-decision/v1" : "Unavailable"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Decision Meaning</dt>
          <dd>{decisionNote(model.deploymentDecision)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Enforcement Decision</dt>
          <dd>{model.enforcementDecision}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Enforcement Policy</dt>
          <dd>{model.enforcementPolicyVersion || "Unavailable"}</dd>
        </div>
      </dl>
      {model.enforcementMode === "WARN_ONLY" ? (
        <p className="mt-4 rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Scoped enforcement is warning only. Deployment is not blocked.
        </p>
      ) : null}
      {model.enforcementDecision === "DISPUTED_NO_BLOCK" ? (
        <p className="mt-4 rounded border border-sky-400/40 bg-sky-950/30 px-3 py-2 text-sm text-sky-100">
          Enforcement state disputed. No block applied in DH-6.
        </p>
      ) : null}
      {model.deterministicCauses.length ? (
        <div className="mt-4 text-sm text-slate-200">
          <p className="text-slate-400">Deterministic Causes</p>
          <ul className="mt-1 space-y-1">
            {model.deterministicCauses.map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {model.enforcementReasons.length ? (
        <div className="mt-4 text-sm text-slate-200">
          <p className="text-slate-400">Enforcement Reasons</p>
          <ul className="mt-1 space-y-1">
            {model.enforcementReasons.slice(0, 5).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {model.disputedReasons.length ? (
        <ul className="mt-4 space-y-1 text-sm text-amber-100">
          {model.disputedReasons.slice(0, 5).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
