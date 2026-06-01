import type { AdvisoryEvidenceLifecycleCertification } from "@/services/advisory/advisoryEvidenceLifecycleCertificationGate";

const CHECK_ROWS = [
  ["deterministic", "Deterministic"],
  ["readOnly", "Read only"],
  ["replayable", "Replayable"],
  ["operatorVisible", "Operator visible"],
  ["authorityContained", "Authority contained"],
  ["trustedStateAbsent", "Trusted state absent"],
  ["liveImportAbsent", "Live import absent"],
  ["lifecycleActionsAbsent", "Lifecycle actions absent"],
  ["workflowControlAbsent", "Workflow control absent"],
  ["buildClean", "Build clean"],
] as const;

export function AdvisoryEvidenceLifecycleCertificationChecksPanel({
  certification,
}: {
  certification: AdvisoryEvidenceLifecycleCertification;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="certification-checks-panel">
      <p className="text-xs uppercase text-sky-200">Certification Checks</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Lifecycle attestation checks</h2>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {CHECK_ROWS.map(([key, label]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={key}>
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-100">
              {label}: {String(certification.checks[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
