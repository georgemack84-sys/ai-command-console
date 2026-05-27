export function evaluateEmergencyStabilization(input: {
  survivabilityState: string;
  constitutionalState: string;
  containmentRequired: boolean;
  emergencyLockActive: boolean;
  governanceAllowed: boolean;
}) {
  const required =
    input.emergencyLockActive
    || input.containmentRequired
    || ["COLLAPSING", "EMERGENCY_STABILIZATION", "CRITICAL"].includes(input.survivabilityState);

  return {
    required,
    bypassAllowed: false as const,
    stabilizationState: required ? "EMERGENCY_STABILIZATION" : "STABLE",
    blockedReasons: required
      ? Array.from(new Set([
          ...(input.governanceAllowed ? [] : ["governance_not_safe_for_override"]),
          ...(input.emergencyLockActive ? ["emergency_lock_active"] : []),
          ...(input.containmentRequired ? ["containment_required"] : []),
          ...(input.constitutionalState === "LOCKED" ? ["constitutional_lock_preserved"] : []),
        ]))
      : [],
  };
}
