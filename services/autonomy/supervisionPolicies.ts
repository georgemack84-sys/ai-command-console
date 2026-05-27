export function evaluateSupervisionPolicies(input: {
  sovereigntyState?: string;
  coordinationRisk: number;
  escalationRequired: boolean;
  disputedTruthPresent: boolean;
  emergencyLockActive: boolean;
}) {
  if (input.emergencyLockActive) {
    return { supervisionState: "BLOCKED", stabilizationRecommended: false };
  }
  if (input.disputedTruthPresent) {
    return { supervisionState: "DISPUTED", stabilizationRecommended: false };
  }
  if (input.sovereigntyState === "CONTAINMENT_ACTIVE") {
    return { supervisionState: "CONTAINING", stabilizationRecommended: true };
  }
  if (["CRITICAL", "COLLAPSING", "EMERGENCY_CONTAINMENT"].includes(input.sovereigntyState ?? "")) {
    return { supervisionState: "FROZEN", stabilizationRecommended: true };
  }
  if (input.escalationRequired || input.sovereigntyState === "SURVIVABILITY_RISK") {
    return { supervisionState: "STABILIZING", stabilizationRecommended: true };
  }
  if (input.sovereigntyState === "GOVERNANCE_RISK" || input.sovereigntyState === "UNSTABLE" || input.coordinationRisk >= 0.6) {
    return { supervisionState: "SUPERVISING", stabilizationRecommended: true };
  }
  return { supervisionState: "MONITORING", stabilizationRecommended: false };
}
