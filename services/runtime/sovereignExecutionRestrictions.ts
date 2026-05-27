export function buildSovereignExecutionRestrictions(input: {
  sovereigntyState: string;
  autonomySafe: boolean;
}) {
  return {
    executionAllowed: false as const,
    advisoryOnly: true as const,
    blockedReasons: Array.from(new Set([
      "execution_authority_prohibited",
      ...(input.autonomySafe ? [] : ["autonomy_constraints_failed"]),
      ...(["EMERGENCY_CONTAINMENT", "CIVILIZATION_LOCKDOWN"].includes(input.sovereigntyState) ? ["sovereignty_lockdown_active"] : []),
    ])).sort(),
  };
}
