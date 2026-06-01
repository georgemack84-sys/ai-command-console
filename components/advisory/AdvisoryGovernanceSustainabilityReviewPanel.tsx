import type { GovernanceSustainabilityCertification } from "@/services/advisory/advisoryGovernanceSustainabilityCertificationGate";
import { AdvisoryGovernanceSustainabilityCoveragePanel } from "./AdvisoryGovernanceSustainabilityCoveragePanel";
import { AdvisoryGovernanceSustainabilityScoresPanel } from "./AdvisoryGovernanceSustainabilityScoresPanel";

function sustainabilityStatusLabel(status: string) {
  if (
    status === "SUSTAINABILITY_CERTIFIED"
    || status === "SUSTAINABILITY_CONDITIONAL"
    || status === "SUSTAINABILITY_DISPUTED"
    || status === "SUSTAINABILITY_FAILED"
  ) {
    return status;
  }
  return "UNKNOWN_SUSTAINABILITY";
}

function sustainabilityStatusMessage(status: string) {
  if (status === "SUSTAINABILITY_CERTIFIED") {
    return "Governance sustainability certified. This does not create operational authority.";
  }
  if (status === "SUSTAINABILITY_CONDITIONAL") {
    return "Governance sustainability is conditional. Review maintenance gaps before relying on long-horizon readiness.";
  }
  if (status === "SUSTAINABILITY_DISPUTED") {
    return "Governance sustainability is disputed. Do not treat sustainability evidence as resolved.";
  }
  if (status === "SUSTAINABILITY_FAILED") {
    return "Governance sustainability certification failed. Required sustainability evidence is missing or malformed.";
  }
  return "Governance sustainability state is unknown. Review remains read-only.";
}

export function AdvisoryGovernanceSustainabilityReviewPanel({
  certification,
}: {
  certification: GovernanceSustainabilityCertification;
}) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8" data-testid="advisory-governance-sustainability-review-panel">
      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-sky-200">Governance Sustainability Review</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Governance sustainability evidence</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Review consumes precomputed sustainability certification results only. It displays longevity evidence without creating operational authority.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-100">READ_ONLY</span>
            <span className="rounded border border-sky-300/40 px-3 py-1 text-xs font-semibold text-sky-100">SUSTAINABILITY_REVIEW_ONLY</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_TRUSTED</span>
            <span className="rounded border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-100">NOT_IMPORTED_TO_LIVE_STATE</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_LIFECYCLE_ACTIONS</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_CONTROL_AUTHORITY</span>
            <span className="rounded border border-rose-300/40 px-3 py-1 text-xs font-semibold text-rose-100">NO_OPERATIONAL_AUTHORITY</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5">
        <p className="text-xs uppercase text-sky-200">Sustainability Summary</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-1 text-lg font-semibold text-white">{sustainabilityStatusLabel(certification.sustainabilityStatus)}</p>
          </div>
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs uppercase text-slate-400">Generated at</p>
            <p className="mt-1 break-words text-sm font-semibold text-white">{certification.generatedAt}</p>
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
          {sustainabilityStatusMessage(certification.sustainabilityStatus)}
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="sustainability-hash-panel">
        <p className="text-xs uppercase text-sky-200">Sustainability Hash</p>
        <p className="mt-3 break-all rounded border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100">
          {certification.sustainabilityHash}
        </p>
      </section>

      <AdvisoryGovernanceSustainabilityCoveragePanel certification={certification} />

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AdvisoryGovernanceSustainabilityScoresPanel certification={certification} />
        <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="sustainability-authority">
          <p className="text-xs uppercase text-sky-200">Authority State</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Sustainability review remains inspection-only</h2>
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
    </main>
  );
}
