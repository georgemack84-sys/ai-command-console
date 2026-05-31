import type { AdvisorySnapshotOfflineReview } from "@/services/advisory/advisorySnapshotOfflineReview";
import { AdvisorySnapshotFindingsPanel } from "./AdvisorySnapshotFindingsPanel";
import { AdvisorySnapshotIntegrityPanel } from "./AdvisorySnapshotIntegrityPanel";

function reviewStatusMessage(status: string) {
  if (status === "REVIEWABLE") return "Snapshot is reviewable. Hash and identity are verified.";
  if (status === "DISPUTED_REVIEW") return "Snapshot is disputed. Do not treat it as trusted advisory evidence.";
  if (status === "FAILED_REVIEW") return "Snapshot review failed. Required payload or verification data is missing.";
  return "Snapshot review state is unknown. Inspection only.";
}

function orderedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function AdvisorySnapshotReviewPanel({ review }: { review: AdvisorySnapshotOfflineReview }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-snapshot-review-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Advisory Snapshot Review</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Offline advisory snapshot review</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Reviewed snapshot evidence is displayed for inspection only. Live advisory state is not trusted here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">OFFLINE_REVIEW</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NO_LIVE_STATE_TRUST</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Review Summary</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Review status</p>
            <p className="mt-1 text-lg font-semibold text-white">{review.reviewStatus}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Verification status</p>
            <p className="mt-1 text-lg font-semibold text-white">{review.verificationStatus}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" data-testid="snapshot-authority-status">
            <p className="text-xs uppercase text-slate-400">Authority Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{review.authorityStatus}</p>
          </div>
        </div>
        <p className="mt-4 rounded border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          {reviewStatusMessage(review.reviewStatus)}
        </p>
        <p className="mt-3 text-sm text-slate-300">{review.operatorSummary}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AdvisorySnapshotIntegrityPanel review={review} />
        <AdvisorySnapshotFindingsPanel review={review} />
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Reasons</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Verification reasons</h2>
        {review.reasons.length === 0 ? (
          <p className="mt-4 rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">No review reasons.</p>
        ) : (
          <ul className="mt-4 space-y-2" data-testid="snapshot-reasons">
            {orderedReasons(review.reasons).map((reason) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
