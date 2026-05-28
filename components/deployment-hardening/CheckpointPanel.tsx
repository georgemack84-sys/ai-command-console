import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

export function CheckpointPanel({ model }: { model: DeploymentHardeningReadModel }) {
  const checkpointArtifact = model.artifacts.find((artifact) => artifact.name === "checkpoint-validation.json");
  const driftVisible = model.checkpointStatus === "DRIFTED";

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="checkpoint-panel">
      <p className="text-xs uppercase text-sky-200">Checkpoint</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{model.checkpointStatus}</h2>
      <dl className="mt-4 space-y-3 text-sm text-slate-200">
        <div>
          <dt className="text-slate-400">Resume Eligibility</dt>
          <dd>{model.resumeEligibility}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Environment Drift</dt>
          <dd>{driftVisible ? "Detected" : "Not indicated"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Checkpoint Hash</dt>
          <dd className="break-all">{checkpointArtifact?.hash || "Unavailable"}</dd>
        </div>
      </dl>
    </section>
  );
}
