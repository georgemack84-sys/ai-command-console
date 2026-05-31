import type { AdvisorySnapshotOfflineReview, AdvisorySnapshotReviewFinding } from "@/services/advisory/advisorySnapshotOfflineReview";

const CATEGORY_ORDER: Record<AdvisorySnapshotReviewFinding["category"], number> = {
  HASH: 0,
  IDENTITY: 1,
  POLICY: 2,
  AUTHORITY: 3,
  PAYLOAD: 4,
  REPLAYABILITY: 5,
};

function orderedFindings(findings: readonly AdvisorySnapshotReviewFinding[]) {
  return [...findings].sort((left, right) => (
    CATEGORY_ORDER[left.category] - CATEGORY_ORDER[right.category] ||
    left.severity.localeCompare(right.severity) ||
    left.message.localeCompare(right.message)
  ));
}

export function AdvisorySnapshotFindingsPanel({ review }: { review: AdvisorySnapshotOfflineReview }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="snapshot-findings-panel">
      <p className="text-xs uppercase text-sky-200">Findings</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Review findings</h2>
      <ul className="mt-4 space-y-3">
        {orderedFindings(review.reviewFindings).map((finding) => (
          <li className="rounded border border-slate-700 bg-slate-900/60 p-3" key={`${finding.category}:${finding.message}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-slate-500 px-2 py-1 text-xs font-semibold text-slate-100">{finding.category}</span>
              <span className="rounded border border-slate-500 px-2 py-1 text-xs text-slate-300">{finding.severity}</span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{finding.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
