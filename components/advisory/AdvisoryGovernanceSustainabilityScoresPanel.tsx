import type { GovernanceSustainabilityCertification } from "@/services/advisory/advisoryGovernanceSustainabilityCertificationGate";

function sortedReasons(reasons: readonly string[]) {
  return [...reasons].sort();
}

export function AdvisoryGovernanceSustainabilityScoresPanel({
  certification,
}: {
  certification: GovernanceSustainabilityCertification;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-sustainability-scores-panel">
      <p className="text-xs uppercase text-sky-200">Readiness Scores</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Sustainability readiness remains advisory</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-3" data-testid="sustainability-maintenance-score">
          <p className="text-xs uppercase text-slate-400">Maintenance readiness score</p>
          <p className="mt-1 text-lg font-semibold text-white">maintenance readiness score {certification.maintenanceReadinessScore}</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/60 p-3" data-testid="sustainability-preservation-score">
          <p className="text-xs uppercase text-slate-400">Preservation readiness score</p>
          <p className="mt-1 text-lg font-semibold text-white">preservation readiness score {certification.preservationReadinessScore}</p>
        </div>
      </div>

      <div className="mt-5" data-testid="sustainability-tracks">
        <p className="text-xs uppercase text-slate-400">Sustainability Tracks</p>
        <ul className="mt-3 space-y-2">
          {certification.sustainabilityTracks.map((track) => (
            <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100" key={track.track}>
              <span className="font-semibold">{track.track}</span>
              <span className="block text-slate-300">
                optional {String(track.optional)} authoritative {String(track.authoritative)} runtime {String(track.runtime)} present {String(track.present ?? true)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5" data-testid="sustainability-reasons">
        <p className="text-xs uppercase text-slate-400">Reasons</p>
        {certification.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No sustainability reasons recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedReasons(certification.reasons).map((reason) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200" key={reason}>
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
