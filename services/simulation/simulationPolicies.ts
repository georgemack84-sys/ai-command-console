import type { SimulationInput } from "./simulationTypes";

export function validateSimulationPolicies(input: SimulationInput) {
  const reasons: string[] = [];
  if (!input.dashboard) {
    reasons.push("dashboard_input_missing");
  }
  if ((input.dashboard?.auditHistory || []).length === 0) {
    reasons.push("simulation_evidence_sparse");
  }
  if (input.dashboard?.stewardship?.shouldFreeze || input.dashboard?.continuityConvergence?.requiresFreeze) {
    reasons.push("frozen_recovery_chain_present");
  }
  if (input.dashboard?.governanceDisputes?.length) {
    reasons.push("governance_disputes_present");
  }

  return {
    ok: reasons.filter((reason) => reason === "dashboard_input_missing").length === 0,
    reasons,
    advisoryOnly: true as const,
    canExecute: false as const,
  };
}
