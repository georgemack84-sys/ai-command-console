import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

function value(value: string | null) {
  return value || "Unavailable";
}

export function DeploymentStatusPanel({ model }: { model: DeploymentHardeningReadModel }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="deployment-status-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-sky-200">Deployment Status</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{model.overallState}</h2>
        </div>
        <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">
          {model.enforcementMode}
        </span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Workflow</dt>
          <dd className="break-words">{value(model.workflowId)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Deployment</dt>
          <dd className="break-words">{value(model.deploymentId)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Current Step</dt>
          <dd>{value(model.currentStep)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Current Partition</dt>
          <dd>{value(model.currentPartition)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Last Completed Partition</dt>
          <dd>{value(model.lastCompletedPartition)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Heartbeat</dt>
          <dd>{model.heartbeatAt ? `${model.heartbeatAt}${model.staleHeartbeat ? " - stale" : ""}` : "Missing"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Enforcement Mode</dt>
          <dd>{model.enforcementMode}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Blocked</dt>
          <dd>{model.blocked ? "true" : "false"}</dd>
        </div>
      </dl>
      {model.blocked ? (
        <p className="mt-4 rounded border border-rose-400/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">
          Deployment blocked by scoped enforcement policy.
        </p>
      ) : null}
      {model.staleHeartbeat ? (
        <p className="mt-4 rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Heartbeat is stale or missing. Operator review is required before inferring safety.
        </p>
      ) : null}
    </section>
  );
}
