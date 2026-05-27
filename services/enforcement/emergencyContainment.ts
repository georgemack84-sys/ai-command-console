export function evaluateEmergencyContainment(input: {
  sovereigntyState?: string;
  constitutionalState: string;
  disputedTruthPresent: boolean;
  containmentRequired: boolean;
  freezeActive: boolean;
}) {
  const emergencyLockActive =
    input.sovereigntyState === "EMERGENCY_CONTAINMENT"
    || input.constitutionalState === "EMERGENCY_GOVERNANCE"
    || input.disputedTruthPresent;
  const containmentApplied =
    emergencyLockActive
    || input.containmentRequired
    || input.sovereigntyState === "COLLAPSING"
    || input.sovereigntyState === "CONTAINMENT_ACTIVE"
    || input.freezeActive;

  return {
    emergencyLockActive,
    containmentApplied,
    escalationTriggered: emergencyLockActive || input.sovereigntyState === "COLLAPSING",
  };
}
