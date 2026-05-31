import type { AdvisoryEvidenceArchiveEntry } from "@/services/advisory/advisoryEvidenceArchiveIndex";
import { orderedArchiveEntries } from "./AdvisoryEvidenceArchiveTable";

function orderedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function AdvisoryEvidenceArchiveDetailPanel({ entries }: { entries: readonly AdvisoryEvidenceArchiveEntry[] }) {
  const orderedEntries = orderedArchiveEntries(entries);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="archive-reference-details">
      <p className="text-xs uppercase text-sky-200">Reference Details</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Reasons and metadata</h2>
      {orderedEntries.length === 0 ? (
        <p className="mt-4 rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">No reference details available.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orderedEntries.map((entry) => (
            <article className="rounded border border-slate-700 bg-slate-900/60 p-4" key={`${entry.referenceHash}:${entry.evidenceRef}`}>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-slate-400">Evidence reference</p>
                  <p className="break-words text-sm text-slate-100">{entry.evidenceRef}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Snapshot hash</p>
                  <p className="break-all text-sm text-slate-100">{entry.snapshotHash ?? "Unavailable"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Review / verification</p>
                  <p className="text-sm text-slate-100">{entry.reviewStatus ?? "Unavailable"} / {entry.verificationStatus ?? "Unavailable"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Policy / indexed</p>
                  <p className="text-sm text-slate-100">{entry.policyVersion ?? "Unavailable"} / {entry.indexedAt}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Trusted</p>
                  <p className="text-sm text-slate-100">{String(entry.trusted)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Imported to live state</p>
                  <p className="text-sm text-slate-100">{String(entry.importedToLiveState)}</p>
                </div>
              </div>
              {entry.reasons.length === 0 ? (
                <p className="mt-3 text-sm text-slate-300">No reasons recorded.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {orderedReasons(entry.reasons).map((reason) => (
                    <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
