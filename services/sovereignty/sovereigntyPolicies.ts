import { SovereignGovernanceState } from "./sovereigntyAssessment";

export function buildSovereigntyPolicies(input: {
  sovereigntyState: string;
  constitutionalSafe: boolean;
  immutableAuditHealthy: boolean;
}) {
  const blockedReasons = [
    ...(input.constitutionalSafe ? [] : ["sovereignty_constitutional_risk"]),
    ...(input.immutableAuditHealthy ? [] : ["immutable_audit_unhealthy"]),
    ...([SovereignGovernanceState.EMERGENCY_CONTAINMENT, SovereignGovernanceState.CIVILIZATION_LOCKDOWN].includes(input.sovereigntyState as SovereignGovernanceState)
      ? ["civilization_lockdown_required"]
      : []),
  ];

  return {
    allowed: blockedReasons.length === 0,
    blockedReasons,
    inheritedRestrictions: Array.from(new Set(blockedReasons)).sort(),
  };
}
