import type { AdvisoryEvidenceLifecycleCertification } from "@/services/advisory/advisoryEvidenceLifecycleCertificationGate";

function sortedChain(certification: AdvisoryEvidenceLifecycleCertification) {
  return [...certification.certifiedChain].sort((left, right) => left.phase.localeCompare(right.phase));
}

export function AdvisoryEvidenceLifecycleCertifiedChainPanel({
  certification,
}: {
  certification: AdvisoryEvidenceLifecycleCertification;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="certified-chain-panel">
      <p className="text-xs uppercase text-sky-200">Certified Chain</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Sealed lifecycle phases</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Phase</th>
              <th className="py-2 pr-3">Commit</th>
              <th className="py-2 pr-3">Required</th>
              <th className="py-2 pr-3">Present</th>
            </tr>
          </thead>
          <tbody>
            {sortedChain(certification).map((phase) => (
              <tr className="border-b border-slate-800 text-slate-100" key={phase.phase}>
                <td className="py-3 pr-3">{phase.phase}</td>
                <td className="py-3 pr-3">{phase.commit ?? "Unavailable"}</td>
                <td className="py-3 pr-3">{String(phase.required)}</td>
                <td className="py-3 pr-3">{String(phase.present)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
