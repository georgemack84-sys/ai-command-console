import type { AdvisoryEvidenceLifecycleCompletionReport } from "@/services/advisory/advisoryEvidenceLifecycleCompletionReport";
import { AdvisoryEvidenceLifecycleCompletionChainPanel } from "./AdvisoryEvidenceLifecycleCompletionChainPanel";
import { AdvisoryEvidenceLifecycleCompletionGuaranteesPanel } from "./AdvisoryEvidenceLifecycleCompletionGuaranteesPanel";

function completionStatusLabel(status: string) {
  if (
    status === "COMPLETE"
    || status === "CONDITIONALLY_COMPLETE"
    || status === "DISPUTED_COMPLETION"
    || status === "FAILED_COMPLETION"
  ) {
    return status;
  }
  return "UNKNOWN_COMPLETION";
}

function completionStatusMessage(status: string) {
  if (status === "COMPLETE") return "Advisory evidence lifecycle completion verified.";
  if (status === "CONDITIONALLY_COMPLETE") return "Advisory evidence lifecycle completion available with warnings.";
  if (status === "DISPUTED_COMPLETION") return "Advisory evidence lifecycle completion disputed.";
  if (status === "FAILED_COMPLETION") return "Advisory evidence lifecycle completion failed.";
  return "Advisory evidence lifecycle completion state is unknown. Review remains read-only.";
}

function sortedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function AdvisoryEvidenceLifecycleCompletionReviewPanel({
  report,
}: {
  report: AdvisoryEvidenceLifecycleCompletionReport;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-lifecycle-completion-review-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Lifecycle Completion Review</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Advisory evidence lifecycle completion</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Completion evidence is displayed for inspection only. This review does not create lifecycle authority.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">COMPLETION_REVIEW_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_LIFECYCLE_ACTIONS</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Completion Summary</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{completionStatusLabel(report.completionStatus)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Generated at</p>
            <p className="mt-1 break-words text-sm font-semibold text-white">{report.generatedAt}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Authority</p>
            <p className="mt-1 text-lg font-semibold text-white">{report.authority}</p>
          </div>
        </div>
        <p className="mt-4 rounded border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          {completionStatusMessage(report.completionStatus)}
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-hash-panel">
        <p className="text-xs uppercase text-sky-200">Completion Hash</p>
        <p className="mt-3 break-all rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100">
          {report.completionHash}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AdvisoryEvidenceLifecycleCompletionGuaranteesPanel report={report} />
        <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-authority-panel">
          <p className="text-xs uppercase text-sky-200">Authority State</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Completion remains informational</h2>
          <div className="mt-4 grid gap-2">
            <p className="text-sm text-slate-100">trusted {String(report.trusted)}</p>
            <p className="text-sm text-slate-100">imported to live state {String(report.importedToLiveState)}</p>
            <p className="text-sm text-slate-100">mayDeploy {String(report.mayDeploy)}</p>
            <p className="text-sm text-slate-100">mayRetry {String(report.mayRetry)}</p>
            <p className="text-sm text-slate-100">mayRollback {String(report.mayRollback)}</p>
            <p className="text-sm text-slate-100">mayCancel {String(report.mayCancel)}</p>
            <p className="text-sm text-slate-100">mayResume {String(report.mayResume)}</p>
            <p className="text-sm text-slate-100">mayApprove {String(report.mayApprove)}</p>
            <p className="text-sm text-slate-100">mayOverride {String(report.mayOverride)}</p>
            <p className="text-sm text-slate-100">mayDelete {String(report.mayDelete)}</p>
            <p className="text-sm text-slate-100">mayCompact {String(report.mayCompact)}</p>
            <p className="text-sm text-slate-100">mayArchiveMutate {String(report.mayArchiveMutate)}</p>
            <p className="text-sm text-slate-100">mayImportToLiveState {String(report.mayImportToLiveState)}</p>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-certification-summary">
          <p className="text-xs uppercase text-sky-200">Certification Summary</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-100">
            <p>certification status {report.certificationSummary.certificationStatus}</p>
            <p className="break-all">certification hash {report.certificationSummary.certificationHash ?? "Unavailable"}</p>
            <p>certification commit {report.certificationSummary.certificationCommit ?? "Unavailable"}</p>
            <p>review UI commit {report.certificationSummary.reviewUiCommit ?? "Unavailable"}</p>
            <p>final seal commit {report.certificationSummary.finalSealCommit ?? "Unavailable"}</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-operator-visibility">
          <p className="text-xs uppercase text-sky-200">Operator Visibility Summary</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-100">
            <p>dashboard available {String(report.operatorVisibilitySummary.dashboardAvailable)}</p>
            <p>review UI available {String(report.operatorVisibilitySummary.reviewUiAvailable)}</p>
            <p>certification review UI available {String(report.operatorVisibilitySummary.certificationReviewUiAvailable)}</p>
            <p>archive UI available {String(report.operatorVisibilitySummary.archiveUiAvailable)}</p>
          </div>
        </section>
      </div>

      <AdvisoryEvidenceLifecycleCompletionChainPanel report={report} />

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-reasons">
        <p className="text-xs uppercase text-sky-200">Reasons</p>
        {report.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No completion reasons recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedReasons(report.reasons).map((reason) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
