export function evaluateExecutiveConstraints(input: {
  deterministicSimulation: boolean;
  disputedTruthPresent: boolean;
  containmentRequired: boolean;
  emergencyLockActive: boolean;
  blockedReasons: string[];
}) {
  const blockedReasons = [
    ...(input.deterministicSimulation ? [] : ["executive_simulation_not_deterministic"]),
    ...(input.disputedTruthPresent ? ["executive_disputed_truth_present"] : []),
    ...(input.containmentRequired ? ["executive_containment_required"] : []),
    ...(input.emergencyLockActive ? ["executive_emergency_lock_active"] : []),
    ...input.blockedReasons,
  ];

  return {
    governanceSafe: blockedReasons.length === 0,
    blockedReasons: Array.from(new Set(blockedReasons)).sort(),
  };
}
