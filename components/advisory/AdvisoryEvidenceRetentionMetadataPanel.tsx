import type { AdvisoryEvidenceRetentionResult } from "@/services/advisory/advisoryEvidenceRetentionPolicy";

function retentionStatusLabel(status: string) {
  if (
    status === "RETAIN" ||
    status === "REVIEW_RETENTION" ||
    status === "RETENTION_DISPUTED" ||
    status === "RETENTION_FAILED"
  ) {
    return status;
  }
  return "UNKNOWN_RETENTION";
}

function retentionStatusMessage(status: string) {
  if (status === "RETAIN") return "Evidence is classified for retention. No lifecycle action is performed.";
  if (status === "REVIEW_RETENTION") return "Retention metadata requires operator review. No lifecycle action is performed.";
  if (status === "RETENTION_DISPUTED") return "Retention policy is disputed. Do not treat lifecycle metadata as resolved.";
  if (status === "RETENTION_FAILED") return "Retention classification failed. Required metadata is missing or malformed.";
  return "Retention state is unknown. No lifecycle action or trust authority is available.";
}

function sortedValues(values: readonly string[]) {
  return [...values].sort();
}

export function AdvisoryEvidenceRetentionMetadataPanel({
  retention,
}: {
  retention: AdvisoryEvidenceRetentionResult;
}) {
  return (
    <article className="rounded border border-slate-700 bg-slate-900/60 p-4">
      <div>
        <p className="text-xs uppercase text-slate-400">Retention status</p>
        <p className="mt-1 font-semibold text-slate-100">{retentionStatusLabel(retention.retentionStatus)}</p>
        <p className="mt-2 text-sm text-slate-300">{retentionStatusMessage(retention.retentionStatus)}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2" data-testid="retention-metadata">
        <div>
          <p className="text-xs uppercase text-slate-400">Retention class</p>
          <p className="break-words text-sm text-slate-100">{retention.retentionClass}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Retention until</p>
          <p className="break-words text-sm text-slate-100">{retention.retentionUntil ?? "Unavailable"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Review required</p>
          <p className="text-sm text-slate-100">review required {String(retention.reviewRequired)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Policy Version</p>
          <p className="break-words text-sm text-slate-100">{retention.policyVersion}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Reference hash</p>
          <p className="break-all text-sm text-slate-100">{retention.referenceHash ?? "Unavailable"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Snapshot hash</p>
          <p className="break-all text-sm text-slate-100">{retention.snapshotHash ?? "Unavailable"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Retention hash</p>
          <p className="break-all text-sm text-slate-100">{retention.retentionHash}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Source / indexed</p>
          <p className="break-words text-sm text-slate-100">{retention.source ?? "Unavailable"} / {retention.indexedAt ?? "Unavailable"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-950/70 p-3" data-testid="retention-lifecycle-controls">
          <p className="text-xs uppercase text-sky-200">Lifecycle Controls</p>
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-slate-100">mayDelete {String(retention.mayDelete)}</p>
            <p className="text-sm text-slate-100">mayCompact {String(retention.mayCompact)}</p>
            <p className="text-sm text-slate-100">mayArchiveMutate {String(retention.mayArchiveMutate)}</p>
            <p className="text-sm text-slate-100">mayImportToLiveState {String(retention.mayImportToLiveState)}</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-950/70 p-3" data-testid="retention-authority-state">
          <p className="text-xs uppercase text-sky-200">Authority State</p>
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-slate-100">authority {retention.authority}</p>
            <p className="text-sm text-slate-100">trusted {String(retention.trusted)}</p>
            <p className="text-sm text-slate-100">imported to live state {String(retention.importedToLiveState)}</p>
            <p className="text-sm text-slate-100">controls available false</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-950/70 p-3" data-testid="retention-reasons">
          <p className="text-xs uppercase text-sky-200">Retention Reasons</p>
          {retention.retentionReason.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No retention reasons recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedValues(retention.retentionReason).map((reason) => (
                <li className="rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200" key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded border border-slate-700 bg-slate-950/70 p-3" data-testid="retention-policy-reasons">
          <p className="text-xs uppercase text-sky-200">Reasons</p>
          {retention.reasons.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No policy reasons recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedValues(retention.reasons).map((reason) => (
                <li className="rounded border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200" key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
