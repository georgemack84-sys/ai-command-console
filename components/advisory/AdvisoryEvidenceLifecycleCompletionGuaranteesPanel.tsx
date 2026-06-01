import type { AdvisoryEvidenceLifecycleCompletionReport } from "@/services/advisory/advisoryEvidenceLifecycleCompletionReport";

const GUARANTEE_ROWS = [
  ["deterministic", "Deterministic"],
  ["readOnly", "Read only"],
  ["replayable", "Replayable"],
  ["operatorVisible", "Operator visible"],
  ["authorityContained", "Authority contained"],
  ["nonAuthoritative", "Non-authoritative"],
  ["nonMutating", "Non-mutating"],
  ["trustedStateAbsent", "Trusted state absent"],
  ["liveImportAbsent", "Live import absent"],
  ["workflowControlAbsent", "Workflow control absent"],
] as const;

export function AdvisoryEvidenceLifecycleCompletionGuaranteesPanel({
  report,
}: {
  report: AdvisoryEvidenceLifecycleCompletionReport;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-guarantees-panel">
      <p className="text-xs uppercase text-sky-200">Lifecycle Guarantees</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Completion guarantees</h2>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {GUARANTEE_ROWS.map(([key, label]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={key}>
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-100">
              {label}: {String(report.guarantees[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
