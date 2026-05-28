export function inheritGovernanceSignals(input: {
  governanceIntegrity: number;
  governanceReliability: number;
  governanceSafe: boolean;
  blockedReasons: string[];
  escalationPressure: number;
}) {
  return {
    governanceReliability: Number(((input.governanceIntegrity * 0.5) + (input.governanceReliability * 0.5)).toFixed(4)),
    constitutionalSafe: input.governanceSafe && input.blockedReasons.length === 0,
    inheritedConstraints: Array.from(new Set(input.blockedReasons)).sort(),
    escalationPressure: input.escalationPressure,
  };
}
