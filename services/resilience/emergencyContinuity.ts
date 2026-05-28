export function buildEmergencyContinuityPlan(input: {
  resilienceState: string;
  containmentState: string;
  blockedReasons: string[];
  isolatedDomains: string[];
  operatorInterventionRequired: boolean;
  createdAt: number;
}) {
  return {
    continuityId: `emergency-continuity:${input.createdAt}`,
    resilienceState: input.resilienceState,
    containmentState: input.containmentState,
    recommendedActions: Array.from(new Set([
      "preserve_audit_lineage",
      "preserve_replay_safety",
      ...(input.blockedReasons.length > 0 ? ["freeze_unsafe_progression"] : []),
      ...(input.isolatedDomains.length > 0 ? ["maintain_isolation_boundaries"] : []),
      ...(input.operatorInterventionRequired ? ["operator_intervention_required"] : []),
    ])).sort(),
    executionAuthorized: false as const,
    advisoryOnly: true as const,
  };
}
