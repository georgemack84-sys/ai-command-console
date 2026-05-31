import type { AdvisoryEvidenceArchiveEntry } from "@/services/advisory/advisoryEvidenceArchiveIndex";

const STATUS_ORDER: Record<string, number> = {
  INDEXED: 0,
  DISPUTED_REFERENCE: 1,
  FAILED_REFERENCE: 2,
};

export function orderedArchiveEntries(entries: readonly AdvisoryEvidenceArchiveEntry[]) {
  return [...entries].sort((left, right) => (
    (STATUS_ORDER[left.archiveStatus] ?? 99) - (STATUS_ORDER[right.archiveStatus] ?? 99) ||
    left.evidenceRef.localeCompare(right.evidenceRef) ||
    left.referenceHash.localeCompare(right.referenceHash)
  ));
}

export function AdvisoryEvidenceArchiveTable({ entries }: { entries: readonly AdvisoryEvidenceArchiveEntry[] }) {
  const orderedEntries = orderedArchiveEntries(entries);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
      <p className="text-xs uppercase text-sky-200">Reference Table</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Archive references</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm" data-testid="archive-reference-table">
          <thead>
            <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Evidence ref</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Reference hash</th>
              <th className="py-2 pr-3">Snapshot ID</th>
              <th className="py-2 pr-3">Snapshot hash</th>
              <th className="py-2 pr-3">Review</th>
              <th className="py-2 pr-3">Verification</th>
            </tr>
          </thead>
          <tbody>
            {orderedEntries.length === 0 ? (
              <tr>
                <td className="py-4 text-slate-300" colSpan={8}>No archive references available.</td>
              </tr>
            ) : orderedEntries.map((entry) => (
              <tr className="border-b border-slate-800 text-slate-200" key={`${entry.referenceHash}:${entry.evidenceRef}`}>
                <td className="py-3 pr-3 font-semibold">{entry.archiveStatus}</td>
                <td className="py-3 pr-3">{entry.evidenceRef}</td>
                <td className="py-3 pr-3">{entry.source}</td>
                <td className="break-all py-3 pr-3">{entry.referenceHash}</td>
                <td className="break-all py-3 pr-3">{entry.snapshotId ?? "Unavailable"}</td>
                <td className="break-all py-3 pr-3">{entry.snapshotHash ?? "Unavailable"}</td>
                <td className="py-3 pr-3">{entry.reviewStatus ?? "Unavailable"}</td>
                <td className="py-3 pr-3">{entry.verificationStatus ?? "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
