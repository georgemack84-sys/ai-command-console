import type { AdvisoryLifecycleBundleVerificationResult } from "@/services/advisory/advisoryEvidenceLifecycleBundleVerification";

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

export function AdvisoryEvidenceLifecycleBundleIntegrityPanel({
  verification,
}: {
  verification: AdvisoryLifecycleBundleVerificationResult;
}) {
  const rows = [
    ["Bundle hash", verification.bundleHash ?? "Unavailable"],
    ["Expected bundle hash", verification.expectedBundleHash ?? "Unavailable"],
    ["Hash matches", yesNo(verification.hashMatches)],
    ["Included hashes verified", yesNo(verification.includedHashesVerified)],
    ["Authority verified", yesNo(verification.authorityVerified)],
    ["Retention verified", yesNo(verification.retentionVerified)],
    ["Rollup verified", yesNo(verification.rollupVerified)],
    ["Replayable", yesNo(verification.replayable)],
  ] as const;

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="bundle-integrity-panel">
      <p className="text-xs uppercase text-sky-200">Bundle Integrity</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Verified lifecycle bundle hashes</h2>
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
