import type { AdvisoryEvidenceArchiveEntry } from "@/services/advisory/advisoryEvidenceArchiveIndex";
import { summarizeAdvisoryEvidenceArchive } from "@/services/advisory/advisoryEvidenceArchiveSummary";
import { AdvisoryEvidenceArchiveDetailPanel } from "./AdvisoryEvidenceArchiveDetailPanel";
import { AdvisoryEvidenceArchiveSummaryPanel } from "./AdvisoryEvidenceArchiveSummaryPanel";
import { AdvisoryEvidenceArchiveTable } from "./AdvisoryEvidenceArchiveTable";

function stateMessage(status: string) {
  if (status === "INDEXED") return "Reference indexed. This does not mark evidence trusted.";
  if (status === "DISPUTED_REFERENCE") return "Reference disputed. Review before relying on this evidence.";
  if (status === "FAILED_REFERENCE") return "Reference failed. Required evidence metadata is missing or malformed.";
  return "UNKNOWN_REFERENCE";
}

export function AdvisoryEvidenceArchivePanel({ entries }: { entries: readonly AdvisoryEvidenceArchiveEntry[] }) {
  const statuses = [...new Set(entries.map((entry) => entry.archiveStatus))];
  const summary = summarizeAdvisoryEvidenceArchive(entries);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-evidence-archive-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Advisory Evidence Archive</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Advisory evidence archive</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Archive references are visible for inspection only. References are not trusted and are not imported to live state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">ARCHIVE_REFERENCE_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
          </div>
        </div>
      </section>

      <AdvisoryEvidenceArchiveSummaryPanel summary={summary} />

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="archive-reference-state-messages">
        <p className="text-xs uppercase text-sky-200">Reference State Messages</p>
        <div className="mt-4 space-y-2">
          {(statuses.length > 0 ? statuses : ["UNKNOWN_REFERENCE"]).map((status) => (
            <p className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={status}>
              {stateMessage(status)}
            </p>
          ))}
        </div>
      </section>

      <AdvisoryEvidenceArchiveTable entries={entries} />
      <AdvisoryEvidenceArchiveDetailPanel entries={entries} />
    </main>
  );
}
