export function adaptResilienceToSovereignty(input: {
  resilienceState: string;
  constitutionalIntegrity: number;
  recoverabilityConfidence: number;
  operationalViability: number;
  emergencyControlsRequired: boolean;
  blockedReasons: string[];
}) {
  return {
    constitutionalSafe:
      !input.emergencyControlsRequired
      && input.constitutionalIntegrity >= 0.55
      && input.blockedReasons.length === 0
      && !["FROZEN", "CONSTITUTIONAL_EMERGENCY", "SURVIVABILITY_CRITICAL"].includes(input.resilienceState),
    survivabilityConfidence: input.recoverabilityConfidence,
    operationalStability: input.operationalViability,
    inheritedConstraints: Array.from(new Set(input.blockedReasons)).sort(),
  };
}
