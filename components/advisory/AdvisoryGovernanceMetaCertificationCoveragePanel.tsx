import type { GovernanceMetaCertification } from "@/services/advisory/advisoryGovernanceMetaCertification";

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

export function AdvisoryGovernanceMetaCertificationCoveragePanel({
  certification,
}: {
  certification: GovernanceMetaCertification;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="governance-meta-coverage-panel">
      <p className="text-xs uppercase text-sky-200">Governance Coverage</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Documented artifacts and sealed commits</h2>

      <div className="mt-4 grid gap-5 xl:grid-cols-2">
        <div data-testid="governance-meta-documents">
          <p className="text-xs uppercase text-slate-400">Document coverage</p>
          <ul className="mt-3 space-y-2">
            {certification.documentedArtifacts.map((artifact) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100" key={artifact.path}>
                <span className="break-words">{artifact.path}</span>
                <span className="block text-slate-300">required {yesNo(artifact.required)} present {yesNo(artifact.present)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div data-testid="governance-meta-seals">
          <p className="text-xs uppercase text-slate-400">Seal coverage</p>
          <ul className="mt-3 space-y-2">
            {certification.sealedCommits.map((seal) => (
              <li className="rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100" key={seal.commit}>
                <span className="font-semibold">{seal.commit}</span>
                <span className="block break-words text-slate-300">{seal.description}</span>
                <span className="block text-slate-300">required {yesNo(seal.required)} present {yesNo(seal.present)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
