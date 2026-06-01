import type { CompletionBundleVerificationResult } from "@/services/advisory/advisoryEvidenceLifecycleCompletionBundleVerification";

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

export function AdvisoryEvidenceLifecycleCompletionBundleIntegrityPanel({
  verification,
}: {
  verification: CompletionBundleVerificationResult;
}) {
  const rows = [
    ["Export hash", verification.exportHash ?? "Unavailable"],
    ["Expected export hash", verification.expectedExportHash ?? "Unavailable"],
    ["Hash matches", yesNo(verification.hashMatches)],
    ["Export ID", verification.exportId ?? "Unavailable"],
    ["Expected export ID", verification.expectedExportId ?? "Unavailable"],
    ["ID matches", yesNo(verification.idMatches)],
  ] as const;

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-bundle-integrity-panel">
      <p className="text-xs uppercase text-sky-200">Bundle Integrity</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Completion bundle hashes and IDs</h2>
      <dl className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={label}>
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-100">
              {label}: {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
