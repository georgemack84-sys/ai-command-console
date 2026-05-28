import { clampMetric } from "../stability/stabilityMetrics";

export type GovernancePressureMatrix = {
  governanceIntegrity: number;
  escalationPressure: number;
  approvalBacklog: number;
  containmentPressure: number;
  survivabilityPressure: number;
  autonomyPressure: number;
  operationalRisk: number;
  constitutionalStability: number;
};

export function buildGovernancePressureMatrix(input: {
  governanceIntegrity: number;
  escalationPressure: number;
  pendingApprovals: number;
  containmentRequired: boolean;
  survivabilityState: string;
  autonomyBlockedActions: number;
  operationalRisk: number;
  constitutionalState: string;
}) : GovernancePressureMatrix {
  return {
    governanceIntegrity: clampMetric(input.governanceIntegrity, 0.05),
    escalationPressure: clampMetric(input.escalationPressure, 0.05),
    approvalBacklog: clampMetric(input.pendingApprovals / 10, 0),
    containmentPressure: clampMetric(input.containmentRequired ? 0.8 : 0.2, 0.05),
    survivabilityPressure: clampMetric(
      ["CRITICAL", "COLLAPSING", "EMERGENCY_STABILIZATION", "SURVIVABILITY_MODE"].includes(input.survivabilityState) ? 0.85 : 0.35,
      0.05,
    ),
    autonomyPressure: clampMetric(input.autonomyBlockedActions / 6, 0.05),
    operationalRisk: clampMetric(input.operationalRisk, 0.05),
    constitutionalStability: clampMetric(
      ["CONSTITUTIONAL", "RESTRICTED"].includes(input.constitutionalState) ? 0.75 : 0.35,
      0.05,
    ),
  };
}
