import type { AdvisoryEvidenceArchiveEntry } from "@/services/advisory/advisoryEvidenceArchiveIndex";
import { summarizeAdvisoryEvidenceArchive } from "@/services/advisory/advisoryEvidenceArchiveSummary";
import { classifyAdvisoryEvidenceRetention } from "@/services/advisory/advisoryEvidenceRetentionPolicy";
import { AdvisoryEvidenceArchiveDetailPanel } from "./AdvisoryEvidenceArchiveDetailPanel";
import { AdvisoryEvidenceArchiveSummaryPanel } from "./AdvisoryEvidenceArchiveSummaryPanel";
import { AdvisoryEvidenceArchiveTable } from "./AdvisoryEvidenceArchiveTable";
import { AdvisoryEvidenceLifecycleRollupPanel } from "./AdvisoryEvidenceLifecycleRollupPanel";
import type { AdvisoryEvidenceLifecycleRollup } from "./AdvisoryEvidenceLifecycleRollupPanel";
import { AdvisoryEvidenceRetentionPolicyPanel } from "./AdvisoryEvidenceRetentionPolicyPanel";

function stateMessage(status: string) {
  if (status === "INDEXED") return "Reference indexed. This does not mark evidence trusted.";
  if (status === "DISPUTED_REFERENCE") return "Reference disputed. Review before relying on this evidence.";
  if (status === "FAILED_REFERENCE") return "Reference failed. Required evidence metadata is missing or malformed.";
  return "UNKNOWN_REFERENCE";
}

export function AdvisoryEvidenceArchivePanel({ entries }: { entries: readonly AdvisoryEvidenceArchiveEntry[] }) {
  const statuses = [...new Set(entries.map((entry) => entry.archiveStatus))];
  const summary = summarizeAdvisoryEvidenceArchive(entries);
  const retentionResults = entries.map((entry) => classifyAdvisoryEvidenceRetention(entry, {
    retentionClass: "STANDARD",
    retentionUntil: null,
  }));
  const firstEntry = entries[0] || null;
  const firstRetention = retentionResults[0] || null;
  const lifecycleStatus: AdvisoryEvidenceLifecycleRollup["lifecycleStatus"] = summary.summaryStatus === "FAILED_SUMMARY" || firstRetention?.retentionStatus === "RETENTION_FAILED"
    ? "LIFECYCLE_FAILED"
    : summary.summaryStatus === "DISPUTED_SUMMARY" || firstRetention?.retentionStatus === "RETENTION_DISPUTED" || firstRetention?.reviewRequired
      ? "LIFECYCLE_DISPUTED"
      : "LIFECYCLE_AVAILABLE";
  const lifecycleRollup = {
    lifecycleStatus,
    exportStatus: null,
    verificationStatus: firstEntry?.verificationStatus ?? null,
    reviewStatus: firstEntry?.reviewStatus ?? null,
    archiveStatus: firstEntry?.archiveStatus ?? null,
    summaryStatus: summary.summaryStatus,
    retentionStatus: firstRetention?.retentionStatus ?? null,
    snapshotId: firstEntry?.snapshotId ?? null,
    snapshotHash: firstEntry?.snapshotHash ?? null,
    summaryHash: summary.summaryHash,
    retentionHash: firstRetention?.retentionHash ?? null,
    policyVersions: [...new Set([
      ...entries.map((entry) => entry.policyVersion).filter((version): version is string => Boolean(version)),
      ...(firstRetention ? [firstRetention.policyVersion] : []),
    ])].sort(),
    reviewRequired: retentionResults.some((retention) => retention.reviewRequired),
    trusted: false as const,
    importedToLiveState: false as const,
    authority: "READ_ONLY" as const,
    mayDeploy: false as const,
    mayRetry: false as const,
    mayRollback: false as const,
    mayCancel: false as const,
    mayResume: false as const,
    mayApprove: false as const,
    mayOverride: false as const,
    mayDelete: false as const,
    mayCompact: false as const,
    mayArchiveMutate: false as const,
    mayImportToLiveState: false as const,
    reasons: [...new Set([
      ...summary.reasons,
      ...retentionResults.flatMap((retention) => retention.reasons),
    ])].sort(),
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-evidence-archive-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Advisory Evidence Archive</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Advisory evidence archive</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Archive references are visible for inspection only. References are not trusted and are not imported to live state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">ARCHIVE_REFERENCE_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
          </div>
        </div>
      </section>

      <AdvisoryEvidenceArchiveSummaryPanel summary={summary} />
      <AdvisoryEvidenceLifecycleRollupPanel rollup={lifecycleRollup} />
      <AdvisoryEvidenceRetentionPolicyPanel retentions={retentionResults} />

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="archive-reference-state-messages">
        <p className="text-xs uppercase text-sky-200">Reference State Messages</p>
        <div className="mt-4 space-y-2">
          {(statuses.length > 0 ? statuses : ["UNKNOWN_REFERENCE"]).map((status) => (
            <p className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={status}>
              {stateMessage(status)}
            </p>
          ))}
        </div>
      </section>

      <AdvisoryEvidenceArchiveTable entries={entries} />
      <AdvisoryEvidenceArchiveDetailPanel entries={entries} />
    </main>
  );
}
