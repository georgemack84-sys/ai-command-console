import type { CompletionBundleVerificationResult } from "@/services/advisory/advisoryEvidenceLifecycleCompletionBundleVerification";
import { AdvisoryEvidenceLifecycleCompletionBundleIntegrityPanel } from "./AdvisoryEvidenceLifecycleCompletionBundleIntegrityPanel";
import { AdvisoryEvidenceLifecycleCompletionBundleMetadataPanel } from "./AdvisoryEvidenceLifecycleCompletionBundleMetadataPanel";

function statusLabel(status: string) {
  if (
    status === "VALID_COMPLETION_BUNDLE"
    || status === "DISPUTED_COMPLETION_BUNDLE"
    || status === "FAILED_COMPLETION_BUNDLE"
  ) {
    return status;
  }
  return "UNKNOWN_COMPLETION_BUNDLE";
}

function statusMessage(status: string) {
  if (status === "VALID_COMPLETION_BUNDLE") {
    return "Completion bundle verified. This does not mark evidence trusted.";
  }
  if (status === "DISPUTED_COMPLETION_BUNDLE") {
    return "Completion bundle disputed. Review bundle integrity before relying on evidence.";
  }
  if (status === "FAILED_COMPLETION_BUNDLE") {
    return "Completion bundle verification failed. Required completion bundle metadata is missing or malformed.";
  }
  return "Completion bundle verification state is unknown. Review remains read-only.";
}

export function AdvisoryEvidenceLifecycleCompletionBundleReviewPanel({
  verification,
}: {
  verification: CompletionBundleVerificationResult;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-lifecycle-completion-bundle-review-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Completion Bundle Review</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Advisory evidence lifecycle completion bundle review</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Review consumes precomputed completion bundle verification results only. Completion export artifacts are not inspected directly here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">COMPLETION_BUNDLE_REVIEW_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_LIFECYCLE_ACTIONS</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Completion Bundle Verification Summary</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{statusLabel(verification.verificationStatus)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Hash match</p>
            <p className="mt-1 text-lg font-semibold text-white">{String(verification.hashMatches)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">ID match</p>
            <p className="mt-1 text-lg font-semibold text-white">{String(verification.idMatches)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Replayable</p>
            <p className="mt-1 text-lg font-semibold text-white">{String(verification.replayable)}</p>
          </div>
        </div>
        <p className="mt-4 rounded border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          {statusMessage(verification.verificationStatus)}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <AdvisoryEvidenceLifecycleCompletionBundleIntegrityPanel verification={verification} />
        <AdvisoryEvidenceLifecycleCompletionBundleMetadataPanel verification={verification} />
      </div>
    </main>
  );
}
