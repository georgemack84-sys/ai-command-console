import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";
import { CertificatePanel } from "./CertificatePanel";
import { CheckpointPanel } from "./CheckpointPanel";
import { DecisionPanel } from "./DecisionPanel";
import { DeploymentStatusPanel } from "./DeploymentStatusPanel";
import { EvidencePanel } from "./EvidencePanel";
import { TelemetryTimeline } from "./TelemetryTimeline";

export function DeploymentHardeningDashboard({ model }: { model: DeploymentHardeningReadModel }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="deployment-hardening-dashboard">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Deployment Hardening</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Operator visibility</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Read-only deployment evidence, certificate state, checkpoint health, decision risk, and telemetry timeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">ENFORCEMENT_DISABLED</span>
          </div>
        </div>
        {!model.evidenceAvailable ? (
          <p className="mt-4 rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            Evidence incomplete. Do not infer safety.
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DeploymentStatusPanel model={model} />
        <DecisionPanel model={model} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <CertificatePanel model={model} />
        <CheckpointPanel model={model} />
      </div>

      <EvidencePanel model={model} />
      <TelemetryTimeline model={model} />
    </main>
  );
}
