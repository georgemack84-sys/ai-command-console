import type { AdvisoryEvidenceRetentionResult } from "@/services/advisory/advisoryEvidenceRetentionPolicy";
import { AdvisoryEvidenceRetentionMetadataPanel } from "./AdvisoryEvidenceRetentionMetadataPanel";

export function AdvisoryEvidenceRetentionPolicyPanel({
  retentions,
}: {
  retentions: readonly AdvisoryEvidenceRetentionResult[];
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="advisory-retention-policy-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-sky-200">Retention Summary</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Evidence retention metadata</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Retention metadata is visible for lifecycle review only. No delete, compact, import, trust, or control action is available here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
          <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">RETENTION_METADATA_ONLY</span>
          <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_LIFECYCLE_ACTIONS</span>
          <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
          <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
          <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase text-sky-200">Retention Metadata</p>
        {retentions.length === 0 ? (
          <p className="mt-3 rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">No retention metadata available.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {retentions.map((retention) => (
              <AdvisoryEvidenceRetentionMetadataPanel
                key={`${retention.referenceHash ?? "missing"}:${retention.retentionHash}`}
                retention={retention}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
