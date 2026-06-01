import type { OperationalGovernanceIntegration } from "@/services/advisory/advisoryOperationalGovernanceIntegration";

function stateRows(integration: OperationalGovernanceIntegration) {
  return [
    ["Governance States", "operational-governance-states", integration.governanceStates],
    ["Certification States", "operational-certification-states", integration.certificationStates],
    ["Sustainability States", "operational-sustainability-states", integration.sustainabilityStates],
    ["Maintenance States", "operational-maintenance-states", integration.maintenanceStates],
  ] as const;
}

export function OperationalGovernanceStatePanel({
  integration,
}: {
  integration: OperationalGovernanceIntegration;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/80 p-5" data-testid="operational-governance-state-panel">
      <p className="text-xs uppercase text-sky-200">Governance State Mapping</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Sealed governance states remain visibility-only</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {stateRows(integration).map(([title, testId, states]) => (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3" data-testid={testId} key={title}>
            <p className="text-xs uppercase text-slate-400">{title}</p>
            <ul className="mt-3 space-y-2">
              {states.map((state) => (
                <li className="text-sm text-slate-100" key={state.source}>
                  <span className="font-semibold">{state.source}</span>
                  <span className="block text-slate-300">
                    status {state.status} present {String(state.present)} required {String(state.required)} hash {state.hash ?? "unavailable"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
