import type { GovernanceMetaCertification } from "@/services/advisory/advisoryGovernanceMetaCertification";
import { AdvisoryGovernanceMetaCertificationCoveragePanel } from "./AdvisoryGovernanceMetaCertificationCoveragePanel";
import { AdvisoryGovernanceMetaCertificationProcessPanel } from "./AdvisoryGovernanceMetaCertificationProcessPanel";

function metaStatusLabel(status: string) {
  if (
    status === "META_CERTIFIED"
    || status === "META_CONDITIONAL"
    || status === "META_DISPUTED"
    || status === "META_FAILED"
  ) {
    return status;
  }
  return "UNKNOWN_META_CERTIFICATION";
}

function metaStatusMessage(status: string) {
  if (status === "META_CERTIFIED") return "Governance process certification verified.";
  if (status === "META_CONDITIONAL") return "Governance certification available with warnings.";
  if (status === "META_DISPUTED") return "Governance certification disputed.";
  if (status === "META_FAILED") return "Governance certification failed.";
  return "Governance meta-certification state is unknown. Review remains read-only.";
}

function sortedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function AdvisoryGovernanceMetaCertificationReviewPanel({
  certification,
}: {
  certification: GovernanceMetaCertification;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-governance-meta-certification-review-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Governance Meta-Certification Review</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Advisory governance meta-certification</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Review consumes precomputed governance meta-certification results only. It displays process evidence without creating recursive authority.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">META_CERTIFICATION_REVIEW_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_LIFECYCLE_ACTIONS</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_META_AUTHORITY</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Meta-Certification Summary</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{metaStatusLabel(certification.metaCertificationStatus)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Certified at</p>
            <p className="mt-1 break-words text-sm font-semibold text-white">{certification.certifiedAt}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Authority</p>
            <p className="mt-1 text-lg font-semibold text-white">{certification.authority}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Trusted</p>
            <p className="mt-1 text-lg font-semibold text-white">{String(certification.trusted)}</p>
          </div>
        </div>
        <p className="mt-4 rounded border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          {metaStatusMessage(certification.metaCertificationStatus)}
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-meta-hash-panel">
        <p className="text-xs uppercase text-sky-200">Meta-Certification Hash</p>
        <p className="mt-3 break-all rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100">
          {certification.metaCertificationHash}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <AdvisoryGovernanceMetaCertificationProcessPanel certification={certification} />
        <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-meta-authority">
          <p className="text-xs uppercase text-sky-200">Authority Containment</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Meta-certification remains inspection-only</h2>
          <div className="mt-4 grid gap-2">
            <p className="text-sm text-slate-100">authority {certification.authority}</p>
            <p className="text-sm text-slate-100">trusted {String(certification.trusted)}</p>
            <p className="text-sm text-slate-100">imported to live state {String(certification.importedToLiveState)}</p>
            <p className="text-sm text-slate-100">mayDeploy {String(certification.mayDeploy)}</p>
            <p className="text-sm text-slate-100">mayRetry {String(certification.mayRetry)}</p>
            <p className="text-sm text-slate-100">mayRollback {String(certification.mayRollback)}</p>
            <p className="text-sm text-slate-100">mayCancel {String(certification.mayCancel)}</p>
            <p className="text-sm text-slate-100">mayResume {String(certification.mayResume)}</p>
            <p className="text-sm text-slate-100">mayApprove {String(certification.mayApprove)}</p>
            <p className="text-sm text-slate-100">mayOverride {String(certification.mayOverride)}</p>
            <p className="text-sm text-slate-100">mayDelete {String(certification.mayDelete)}</p>
            <p className="text-sm text-slate-100">mayCompact {String(certification.mayCompact)}</p>
            <p className="text-sm text-slate-100">mayArchiveMutate {String(certification.mayArchiveMutate)}</p>
            <p className="text-sm text-slate-100">mayImportToLiveState {String(certification.mayImportToLiveState)}</p>
          </div>
        </section>
      </div>

      <AdvisoryGovernanceMetaCertificationCoveragePanel certification={certification} />

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-meta-reasons">
        <p className="text-xs uppercase text-sky-200">Reasons</p>
        {certification.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No governance meta-certification reasons recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedReasons(certification.reasons).map((reason) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
