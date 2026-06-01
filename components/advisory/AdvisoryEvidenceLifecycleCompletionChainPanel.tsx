import type { AdvisoryEvidenceLifecycleCompletionReport } from "@/services/advisory/advisoryEvidenceLifecycleCompletionReport";

function sortedValues(values: readonly string[]) {
  return [...values].sort();
}

function sortedSeals(report: AdvisoryEvidenceLifecycleCompletionReport) {
  return [...report.sealedCommits].sort((left, right) => left.phase.localeCompare(right.phase));
}

function sortedExtensions(report: AdvisoryEvidenceLifecycleCompletionReport) {
  return [...report.remainingOptionalExtensions].sort((left, right) => left.extension.localeCompare(right.extension));
}

export function AdvisoryEvidenceLifecycleCompletionChainPanel({
  report,
}: {
  report: AdvisoryEvidenceLifecycleCompletionReport;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="completion-chain-panel">
      <p className="text-xs uppercase text-sky-200">Lifecycle Closure</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Sealed commits and completed stages</h2>

      <div className="mt-4 overflow-x-auto" data-testid="completion-sealed-commits">
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
            {sortedSeals(report).map((seal) => (
              <tr className="border-b border-slate-800 text-slate-100" key={seal.phase}>
                <td className="py-3 pr-3">{seal.phase}</td>
                <td className="py-3 pr-3">{seal.commit ?? "Unavailable"}</td>
                <td className="py-3 pr-3">{String(seal.required)}</td>
                <td className="py-3 pr-3">{String(seal.present)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="completion-stages">
          <p className="text-xs uppercase text-sky-200">Completed Lifecycle Stages</p>
          <ul className="mt-3 space-y-2">
            {sortedValues(report.completedLifecycleStages).map((stage) => (
              <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={stage}>
                {stage}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900/60 p-4" data-testid="completion-optional-extensions">
          <p className="text-xs uppercase text-sky-200">Optional Extensions</p>
          <ul className="mt-3 space-y-2">
            {sortedExtensions(report).map((extension) => (
              <li className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200" key={extension.extension}>
                {extension.extension} optional {String(extension.optional)} blocking {String(extension.blocking)} authoritative {String(extension.authoritative)} present {String(extension.present ?? true)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
