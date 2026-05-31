import type { AdvisoryEvidenceLifecycleRollup } from "./AdvisoryEvidenceLifecycleRollupPanel";

const STAGE_LABELS: { key: keyof Pick<
  AdvisoryEvidenceLifecycleRollup,
  "exportStatus" | "verificationStatus" | "reviewStatus" | "archiveStatus" | "summaryStatus" | "retentionStatus"
>; label: string }[] = [
  { key: "exportStatus", label: "Export" },
  { key: "verificationStatus", label: "Verification" },
  { key: "reviewStatus", label: "Offline Review" },
  { key: "archiveStatus", label: "Archive" },
  { key: "summaryStatus", label: "Summary" },
  { key: "retentionStatus", label: "Retention" },
];

export function AdvisoryEvidenceLifecycleStatusPanel({ rollup }: { rollup: AdvisoryEvidenceLifecycleRollup }) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-stage-statuses">
      <p className="text-xs uppercase text-sky-200">Lifecycle Stage Summaries</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {STAGE_LABELS.map((stage) => (
          <div className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2" key={stage.key}>
            <p className="text-xs uppercase text-slate-400">{stage.label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-100">{rollup[stage.key] ?? "Unavailable"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
