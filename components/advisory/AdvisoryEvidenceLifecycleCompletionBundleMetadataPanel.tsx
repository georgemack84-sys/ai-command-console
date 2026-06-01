import type { CompletionBundleVerificationResult } from "@/services/advisory/advisoryEvidenceLifecycleCompletionBundleVerification";

function sortedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function AdvisoryEvidenceLifecycleCompletionBundleMetadataPanel({
  verification,
}: {
  verification: CompletionBundleVerificationResult;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-bundle-metadata-panel">
      <p className="text-xs uppercase text-sky-200">Completion Metadata Verification</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Verification boundary contract</h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="completion-bundle-metadata">
          <p className="text-xs uppercase text-sky-200">Metadata Checks</p>
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-slate-100">policy version {verification.policyVersion ?? "Unavailable"}</p>
            <p className="text-sm text-slate-100">completion summary verified {String(verification.completionSummaryVerified)}</p>
            <p className="text-sm text-slate-100">certification summary verified {String(verification.certificationSummaryVerified)}</p>
            <p className="text-sm text-slate-100">sealed commits verified {String(verification.sealedCommitsVerified)}</p>
            <p className="text-sm text-slate-100">guarantees verified {String(verification.guaranteesVerified)}</p>
            <p className="text-sm text-slate-100">replayable {String(verification.replayable)}</p>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="completion-bundle-authority">
          <p className="text-xs uppercase text-sky-200">Authority</p>
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-slate-100">authority {verification.authority}</p>
            <p className="text-sm text-slate-100">trusted {String(verification.trusted)}</p>
            <p className="text-sm text-slate-100">imported to live state {String(verification.importedToLiveState)}</p>
            <p className="text-sm text-slate-100">mayDeploy {String(verification.mayDeploy)}</p>
            <p className="text-sm text-slate-100">mayRetry {String(verification.mayRetry)}</p>
            <p className="text-sm text-slate-100">mayRollback {String(verification.mayRollback)}</p>
            <p className="text-sm text-slate-100">mayCancel {String(verification.mayCancel)}</p>
            <p className="text-sm text-slate-100">mayResume {String(verification.mayResume)}</p>
            <p className="text-sm text-slate-100">mayApprove {String(verification.mayApprove)}</p>
            <p className="text-sm text-slate-100">mayOverride {String(verification.mayOverride)}</p>
            <p className="text-sm text-slate-100">mayDelete {String(verification.mayDelete)}</p>
            <p className="text-sm text-slate-100">mayCompact {String(verification.mayCompact)}</p>
            <p className="text-sm text-slate-100">mayArchiveMutate {String(verification.mayArchiveMutate)}</p>
            <p className="text-sm text-slate-100">mayImportToLiveState {String(verification.mayImportToLiveState)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="completion-bundle-reasons">
        <p className="text-xs uppercase text-sky-200">Reasons</p>
        {verification.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No completion bundle verification reasons recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedReasons(verification.reasons).map((reason) => (
              <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
