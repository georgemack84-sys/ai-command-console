import type { OperationalGovernanceIntegration } from "@/services/advisory/advisoryOperationalGovernanceIntegration";
import { OperationalGovernanceReplayPanel } from "./OperationalGovernanceReplayPanel";
import { OperationalGovernanceStatePanel } from "./OperationalGovernanceStatePanel";

function integrationStatusLabel(status: string) {
  if (
    status === "INTEGRATED"
    || status === "PARTIALLY_INTEGRATED"
    || status === "DISPUTED_INTEGRATION"
    || status === "FAILED_INTEGRATION"
  ) {
    return status;
  }
  return "UNKNOWN_INTEGRATION";
}

function integrationStatusMessage(status: string) {
  if (status === "INTEGRATED") return "Governance is operationally visible without operational authority.";
  if (status === "PARTIALLY_INTEGRATED") return "Governance visibility is partial. Review missing optional state or replay gaps.";
  if (status === "DISPUTED_INTEGRATION") return "Operational governance integration is disputed. Authority boundaries require review.";
  if (status === "FAILED_INTEGRATION") return "Operational governance integration failed. Required governance state is missing.";
  return "Operational governance integration state is unknown. Review remains read-only.";
}

export function OperationalGovernanceIntegrationPanel({
  integration,
}: {
  integration: OperationalGovernanceIntegration;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="operational-governance-integration-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Governed Operational Integration</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Governance visibility for operational surfaces</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Operational integration exposes sealed governance state for inspection only. It does not create execution, scheduling, or control authority.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">OPERATIONAL_VISIBILITY_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_EXECUTION_AUTHORITY</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">OPERATOR_SUPREMACY_PRESERVED</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Integration Summary</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{integrationStatusLabel(integration.integrationStatus)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Authority</p>
            <p className="mt-1 text-lg font-semibold text-white">{integration.authority}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Trusted</p>
            <p className="mt-1 text-lg font-semibold text-white">{String(integration.trusted)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Live import</p>
            <p className="mt-1 text-lg font-semibold text-white">{String(integration.importedToLiveState)}</p>
          </div>
        </div>
        <p className="mt-4 rounded border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          {integrationStatusMessage(integration.integrationStatus)}
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="operational-governance-hash-panel">
        <p className="text-xs uppercase text-sky-200">Integration Hash</p>
        <p className="mt-3 break-all rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100">
          {integration.integrationHash}
        </p>
      </section>

      <OperationalGovernanceStatePanel integration={integration} />

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <OperationalGovernanceReplayPanel integration={integration} />
        <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="operational-governance-authority">
          <p className="text-xs uppercase text-sky-200">Authority Boundary</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Execution authority remains absent</h2>
          <div className="mt-4 grid gap-2">
            <p className="text-sm text-slate-100">authority {integration.authority}</p>
            <p className="text-sm text-slate-100">trusted {String(integration.trusted)}</p>
            <p className="text-sm text-slate-100">imported to live state {String(integration.importedToLiveState)}</p>
            <p className="text-sm text-slate-100">mayDeploy {String(integration.mayDeploy)}</p>
            <p className="text-sm text-slate-100">mayRetry {String(integration.mayRetry)}</p>
            <p className="text-sm text-slate-100">mayRollback {String(integration.mayRollback)}</p>
            <p className="text-sm text-slate-100">mayCancel {String(integration.mayCancel)}</p>
            <p className="text-sm text-slate-100">mayResume {String(integration.mayResume)}</p>
            <p className="text-sm text-slate-100">mayApprove {String(integration.mayApprove)}</p>
            <p className="text-sm text-slate-100">mayOverride {String(integration.mayOverride)}</p>
            <p className="text-sm text-slate-100">mayDelete {String(integration.mayDelete)}</p>
            <p className="text-sm text-slate-100">mayCompact {String(integration.mayCompact)}</p>
            <p className="text-sm text-slate-100">mayArchiveMutate {String(integration.mayArchiveMutate)}</p>
            <p className="text-sm text-slate-100">mayImportToLiveState {String(integration.mayImportToLiveState)}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
