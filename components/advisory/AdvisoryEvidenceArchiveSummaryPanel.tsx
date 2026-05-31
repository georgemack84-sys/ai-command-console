import type { AdvisoryEvidenceArchiveSummary } from "@/services/advisory/advisoryEvidenceArchiveSummary";

function summaryStatusMessage(status: string) {
  if (status === "SUMMARIZED") return "Archive summary available. This does not mark evidence trusted.";
  if (status === "DISPUTED_SUMMARY") return "Archive summary disputed. Review disputed references before relying on evidence.";
  if (status === "FAILED_SUMMARY") return "Archive summary failed. Required archive data is missing or malformed.";
  return "Archive summary state is unknown. No trust or control authority is available.";
}

function summaryStatusLabel(status: string) {
  if (status === "SUMMARIZED" || status === "DISPUTED_SUMMARY" || status === "FAILED_SUMMARY") {
    return status;
  }
  return "UNKNOWN_SUMMARY";
}

function ReferenceList({
  emptyText,
  references,
}: {
  emptyText: string;
  references: readonly Readonly<{ referenceHash: string | null; reason: string }>[];
}) {
  if (references.length === 0) {
    return <p className="mt-3 rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">{emptyText}</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {references.map((reference) => (
        <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={`${reference.referenceHash ?? "missing"}:${reference.reason}`}>
          <span className="break-all font-semibold text-slate-100">{reference.referenceHash ?? "Unavailable"}</span>
          <span className="block text-slate-300">{reference.reason}</span>
        </li>
      ))}
    </ul>
  );
}

export function AdvisoryEvidenceArchiveSummaryPanel({ summary }: { summary: AdvisoryEvidenceArchiveSummary }) {
  const statusLabel = summaryStatusLabel(summary.summaryStatus);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="archive-summary-ui">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-sky-200">Archive Summary</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Evidence archive summary</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">{summaryStatusMessage(summary.summaryStatus)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
          <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">SUMMARY_ONLY</span>
          <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
          <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
          <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
        </div>
      </div>

      <div className="mt-4 rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100">
        <p className="text-xs uppercase text-slate-400">Summary status</p>
        <p className="mt-1 font-semibold">{statusLabel}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-status-counts">
          <p className="text-xs uppercase text-sky-200">Status Counts</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.totalEntries} total entries</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.counts.indexed} indexed</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.counts.disputed} disputed</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.counts.failed} failed</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.counts.unknown} unknown</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-evidence-coverage">
          <p className="text-xs uppercase text-sky-200">Evidence Coverage</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.evidenceCoverage.withSnapshotId} with snapshot ID</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.evidenceCoverage.withSnapshotHash} with snapshot hash</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.evidenceCoverage.withPolicyVersion} with policy version</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">{summary.evidenceCoverage.withEvidenceRef} with evidence ref</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-source-coverage">
          <p className="text-xs uppercase text-sky-200">Source Coverage</p>
          {summary.bySource.length === 0 ? (
            <p className="mt-3 rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-200">No source coverage available.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {summary.bySource.map((source) => (
                <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={source.source}>
                  <span className="font-semibold text-slate-100">{source.source}</span>
                  <span className="ml-2">{source.count} entries</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-authority-state">
          <p className="text-xs uppercase text-sky-200">Authority State</p>
          <div className="mt-3 grid gap-2">
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">authority {summary.authority}</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">trusted {String(summary.trusted)}</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">imported to live state {String(summary.importedToLiveState)}</p>
            <p className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">controls available false</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-disputed-references">
          <p className="text-xs uppercase text-sky-200">Disputed References</p>
          <ReferenceList emptyText="No disputed references recorded." references={summary.disputedReferences} />
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-failed-references">
          <p className="text-xs uppercase text-sky-200">Failed References</p>
          <ReferenceList emptyText="No failed references recorded." references={summary.failedReferences} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-sky-200">Summary Hash</p>
          <p className="mt-2 break-all text-sm text-slate-100">{summary.summaryHash}</p>
          <p className="mt-3 text-xs uppercase text-slate-400">Generated At</p>
          <p className="mt-1 text-sm text-slate-100">{summary.generatedAt}</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="archive-reasons">
          <p className="text-xs uppercase text-sky-200">Reasons</p>
          {summary.reasons.length === 0 ? (
            <p className="mt-3 rounded border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-200">No summary reasons recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {[...summary.reasons].sort().map((reason) => (
                <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
