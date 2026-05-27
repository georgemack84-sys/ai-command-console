export function evaluateReviewPolicies(input: {
  hasGovernanceContext: boolean;
  replayMismatchUnresolved: boolean;
  coordinationFreezeActive: boolean;
  disputed: boolean;
}) {
  const blockedReasons = [
    ...(input.hasGovernanceContext ? [] : ["CONTROL_PLANE_CONTEXT_MISSING"]),
    ...(input.replayMismatchUnresolved ? ["REPLAY_MISMATCH_UNRESOLVED"] : []),
    ...(input.coordinationFreezeActive ? ["COORDINATION_FREEZE_ACTIVE"] : []),
    ...(input.disputed ? ["CONSTITUTIONAL_ENFORCEMENT_FAILED"] : []),
  ];

  return {
    reviewAllowed: blockedReasons.length === 0,
    blockedReasons,
  };
}
