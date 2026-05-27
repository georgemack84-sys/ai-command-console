import type { ContainmentAction, SurvivabilityState } from "./survivabilityPolicies";

export function buildSurvivabilityAuditRecord(input: {
  survivabilityState: SurvivabilityState;
  recommendedAction: ContainmentAction;
  isolatedDomains: string[];
  blockedReasons: string[];
  timestamp: string;
}) {
  return {
    auditRef: `survivability:${input.survivabilityState.toLowerCase()}:${input.timestamp}`,
    survivabilityState: input.survivabilityState,
    recommendedAction: input.recommendedAction,
    isolatedDomains: input.isolatedDomains,
    blockedReasons: Array.from(new Set(input.blockedReasons)).sort(),
    timestamp: input.timestamp,
  };
}
