import type { ContainmentAction } from "../survivability/survivabilityPolicies";

export function buildSurvivabilityProtocols(input: {
  recommendedAction: ContainmentAction;
  containmentRequired: boolean;
  emergencyStabilizationRequired: boolean;
  operatorInterventionRequired: boolean;
}) {
  return {
    protocols: [
      "preserve_audit_lineage",
      "freeze_unsafe_coordination",
      ...(input.operatorInterventionRequired ? ["operator_review_required"] : []),
      ...(input.recommendedAction === "ISOLATE" ? ["isolate_failing_domains"] : []),
      ...(input.recommendedAction === "QUARANTINE" ? ["quarantine_cross_tenant_domains"] : []),
      ...(input.emergencyStabilizationRequired ? ["prepare_emergency_stabilization_review"] : []),
      ...(input.containmentRequired && !["ISOLATE", "QUARANTINE"].includes(input.recommendedAction) ? ["containment_required"] : []),
    ],
  };
}
