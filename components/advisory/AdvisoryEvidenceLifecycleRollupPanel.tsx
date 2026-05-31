import { AdvisoryEvidenceLifecycleStatusPanel } from "./AdvisoryEvidenceLifecycleStatusPanel";

export type AdvisoryEvidenceLifecycleRollup = Readonly<{
  lifecycleStatus: "LIFECYCLE_AVAILABLE" | "LIFECYCLE_DISPUTED" | "LIFECYCLE_FAILED";
  exportStatus: string | null;
  verificationStatus: string | null;
  reviewStatus: string | null;
  archiveStatus: string | null;
  summaryStatus: string | null;
  retentionStatus: string | null;
  snapshotId: string | null;
  snapshotHash: string | null;
  summaryHash: string | null;
  retentionHash: string | null;
  policyVersions: readonly string[];
  reviewRequired: boolean;
  trusted: false;
  importedToLiveState: false;
  authority: "READ_ONLY";
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
  mayDelete: false;
  mayCompact: false;
  mayArchiveMutate: false;
  mayImportToLiveState: false;
  reasons: readonly string[];
}>;

function lifecycleStatusLabel(status: string) {
  if (status === "LIFECYCLE_AVAILABLE" || status === "LIFECYCLE_DISPUTED" || status === "LIFECYCLE_FAILED") {
    return status;
  }
  return "LIFECYCLE_UNKNOWN";
}

function lifecycleStatusMessage(status: string) {
  if (status === "LIFECYCLE_AVAILABLE") {
    return "Advisory evidence lifecycle is available for inspection. No lifecycle action is performed.";
  }
  if (status === "LIFECYCLE_DISPUTED") {
    return "Advisory evidence lifecycle is disputed. Review disputed stages before relying on evidence.";
  }
  if (status === "LIFECYCLE_FAILED") {
    return "Advisory evidence lifecycle failed. Required lifecycle metadata is missing or malformed.";
  }
  return "Advisory evidence lifecycle state is unknown. No trust or lifecycle authority is available.";
}

function sortedValues(values: readonly string[]) {
  return [...values].sort();
}

export function AdvisoryEvidenceLifecycleRollupPanel({ rollup }: { rollup: AdvisoryEvidenceLifecycleRollup }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="advisory-lifecycle-rollup-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-sky-200">Lifecycle Summary</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Advisory evidence lifecycle</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">{lifecycleStatusMessage(rollup.lifecycleStatus)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
          <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">LIFECYCLE_ROLLUP_ONLY</span>
          <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
          <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
          <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_LIFECYCLE_ACTIONS</span>
          <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
        </div>
      </div>

      <div className="mt-4 rounded border border-slate-700 bg-slate-900/60 p-3">
        <p className="text-xs uppercase text-slate-400">Lifecycle status</p>
        <p className="mt-1 font-semibold text-slate-100">{lifecycleStatusLabel(rollup.lifecycleStatus)}</p>
      </div>

      <div className="mt-4">
        <AdvisoryEvidenceLifecycleStatusPanel rollup={rollup} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-snapshot-integrity">
          <p className="text-xs uppercase text-sky-200">Snapshot Integrity</p>
          <div className="mt-3 grid gap-2">
            <p className="break-all text-sm text-slate-100">snapshot ID {rollup.snapshotId ?? "Unavailable"}</p>
            <p className="break-all text-sm text-slate-100">snapshot hash {rollup.snapshotHash ?? "Unavailable"}</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-summary-state">
          <p className="text-xs uppercase text-sky-200">Summary State</p>
          <div className="mt-3 grid gap-2">
            <p className="break-words text-sm text-slate-100">summary status {rollup.summaryStatus ?? "Unavailable"}</p>
            <p className="break-all text-sm text-slate-100">summary hash {rollup.summaryHash ?? "Unavailable"}</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-retention-state">
          <p className="text-xs uppercase text-sky-200">Retention State</p>
          <div className="mt-3 grid gap-2">
            <p className="break-words text-sm text-slate-100">retention status {rollup.retentionStatus ?? "Unavailable"}</p>
            <p className="break-all text-sm text-slate-100">retention hash {rollup.retentionHash ?? "Unavailable"}</p>
            <p className="text-sm text-slate-100">review required {String(rollup.reviewRequired)}</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-policy-versions">
          <p className="text-xs uppercase text-sky-200">Policy Versions</p>
          {rollup.policyVersions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No policy versions available.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedValues(rollup.policyVersions).map((version) => (
                <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={version}>{version}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-authority-state">
          <p className="text-xs uppercase text-sky-200">Authority State</p>
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-slate-100">authority {rollup.authority}</p>
            <p className="text-sm text-slate-100">trusted {String(rollup.trusted)}</p>
            <p className="text-sm text-slate-100">imported to live state {String(rollup.importedToLiveState)}</p>
            <p className="text-sm text-slate-100">mayDeploy {String(rollup.mayDeploy)}</p>
            <p className="text-sm text-slate-100">mayRetry {String(rollup.mayRetry)}</p>
            <p className="text-sm text-slate-100">mayRollback {String(rollup.mayRollback)}</p>
            <p className="text-sm text-slate-100">mayCancel {String(rollup.mayCancel)}</p>
            <p className="text-sm text-slate-100">mayResume {String(rollup.mayResume)}</p>
            <p className="text-sm text-slate-100">mayApprove {String(rollup.mayApprove)}</p>
            <p className="text-sm text-slate-100">mayOverride {String(rollup.mayOverride)}</p>
            <p className="text-sm text-slate-100">mayDelete {String(rollup.mayDelete)}</p>
            <p className="text-sm text-slate-100">mayCompact {String(rollup.mayCompact)}</p>
            <p className="text-sm text-slate-100">mayArchiveMutate {String(rollup.mayArchiveMutate)}</p>
            <p className="text-sm text-slate-100">mayImportToLiveState {String(rollup.mayImportToLiveState)}</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="lifecycle-reasons">
          <p className="text-xs uppercase text-sky-200">Reasons</p>
          {rollup.reasons.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No lifecycle reasons recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedValues(rollup.reasons).map((reason) => (
                <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
