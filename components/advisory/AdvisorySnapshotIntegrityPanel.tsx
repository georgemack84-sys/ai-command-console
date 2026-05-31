import type { AdvisorySnapshotOfflineReview } from "@/services/advisory/advisorySnapshotOfflineReview";

export function AdvisorySnapshotIntegrityPanel({ review }: { review: AdvisorySnapshotOfflineReview }) {
  const rows = [
    ["Snapshot ID", review.snapshotId ?? "Unavailable"],
    ["Snapshot hash", review.snapshotHash ?? "Unavailable"],
    ["Hash match", review.hashMatches ? "yes" : "no"],
    ["ID match", review.idMatches ? "yes" : "no"],
    ["Policy version", review.policyVersion ?? "Unavailable"],
    ["Unified status", review.unifiedStatus ?? "Unavailable"],
    ["Unified risk", review.unifiedRisk ?? "Unavailable"],
  ] as const;

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="snapshot-integrity-panel">
      <p className="text-xs uppercase text-sky-200">Snapshot Integrity</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Hash and identity</h2>
      <dl className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={label}>
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-100">
              {label === "Hash match" ? `Hash match: ${value}` : label === "ID match" ? `ID match: ${value}` : value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
