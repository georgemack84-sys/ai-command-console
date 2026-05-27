import type { ContainmentAction } from "./survivabilityPolicies";

export function buildSurvivabilityRoute(input: {
  recommendedAction: ContainmentAction;
  disputed: boolean;
  freezeActive: boolean;
}) {
  return {
    route: [
      "governance_validation",
      "constitutional_enforcement",
      ...(input.disputed ? ["dispute_freeze"] : []),
      ...(input.freezeActive ? ["freeze_preservation"] : []),
      "survivability_assessment",
      "containment_assessment",
      "immutable_audit_append",
    ],
    terminalAction: input.recommendedAction,
  };
}
