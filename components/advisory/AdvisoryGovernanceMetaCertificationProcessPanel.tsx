import type { GovernanceMetaCertification } from "@/services/advisory/advisoryGovernanceMetaCertification";

function processRows(certification: GovernanceMetaCertification) {
  return [
    ["certification gate present", certification.processChecks.certificationGatePresent],
    ["completion report present", certification.processChecks.completionReportPresent],
    ["completion bundle verification present", certification.processChecks.completionBundleVerificationPresent],
    ["documentation present", certification.processChecks.documentationPresent],
    ["ADR coverage present", certification.processChecks.adrCoveragePresent],
    ["seal history present", certification.processChecks.sealHistoryPresent],
    ["verification before review preserved", certification.processChecks.verificationBeforeReviewPreserved],
    ["no live import preserved", certification.processChecks.noLiveImportPreserved],
    ["no trusted state preserved", certification.processChecks.noTrustedStatePreserved],
    ["authority containment preserved", certification.processChecks.authorityContainmentPreserved],
  ] as const;
}

export function AdvisoryGovernanceMetaCertificationProcessPanel({
  certification,
}: {
  certification: GovernanceMetaCertification;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-meta-process-panel">
      <p className="text-xs uppercase text-sky-200">Process Checks</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Governance process remains bounded</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {processRows(certification).map(([label, value]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={label}>
            <dt className="text-xs uppercase text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-100">
              {label} {String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
