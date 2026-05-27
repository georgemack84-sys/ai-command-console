import type { ContainmentAction } from "../survivability/survivabilityPolicies";

export function buildContainmentEscalation(input: {
  recommendedAction: ContainmentAction;
  emergencyStabilizationRequired: boolean;
  operatorInterventionRequired: boolean;
  unstableDomains: string[];
}) {
  return {
    escalationRequired: input.emergencyStabilizationRequired || input.operatorInterventionRequired || ["QUARANTINE", "DENY"].includes(input.recommendedAction),
    escalationReasoning: [
      ...(input.emergencyStabilizationRequired ? ["emergency_stabilization_required"] : []),
      ...(input.operatorInterventionRequired ? ["operator_intervention_required"] : []),
      ...(input.unstableDomains.length > 0 ? [`unstable_domains:${input.unstableDomains.join(",")}`] : []),
    ],
  };
}
