import type { DeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

export function CertificatePanel({ model }: { model: DeploymentHardeningReadModel }) {
  const certificateArtifact = model.artifacts.find((artifact) => artifact.name === "certificate-verification.json");

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/70 p-5" data-testid="certificate-panel">
      <p className="text-xs uppercase text-sky-200">Certificate</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{model.certificateStatus}</h2>
      <dl className="mt-4 space-y-3 text-sm text-slate-200">
        <div>
          <dt className="text-slate-400">Certificate Hash</dt>
          <dd className="break-all">{certificateArtifact?.hash || "Unavailable"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Failure Class</dt>
          <dd>{model.timeline.at(-1)?.failureClass || "None"}</dd>
        </div>
      </dl>
      {model.certificateStatus === "MISSING" || model.certificateStatus === "INVALID" || model.certificateStatus === "DISPUTED" ? (
        <p className="mt-4 rounded border border-rose-400/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">
          Certificate evidence is not sufficient for safety inference.
        </p>
      ) : null}
    </section>
  );
}
