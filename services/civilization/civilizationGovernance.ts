export function buildCivilizationGovernance(input: {
  sovereigntyState: string;
  validationState: string;
  containmentRequired: boolean;
  operatorInterventionRequired: boolean;
  blockedReasons: string[];
  createdAt: number;
}) {
  return {
    governanceId: `civilization-governance:${input.createdAt}`,
    sovereigntyState: input.sovereigntyState,
    validationState: input.validationState,
    operatorSupremacyPreserved: true,
    advisoryOnly: true as const,
    blockedReasons: Array.from(new Set(input.blockedReasons)),
    containmentRequired: input.containmentRequired,
    operatorInterventionRequired: input.operatorInterventionRequired,
  };
}
