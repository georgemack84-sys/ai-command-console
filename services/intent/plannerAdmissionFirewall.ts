export function evaluatePlannerAdmissionFirewall(input: {
  semanticValid: boolean;
  governanceApproved: boolean;
  ambiguityDetected: boolean;
  clarificationRequired: boolean;
  protectedTargetDetected: boolean;
  replayDriftDetected: boolean;
  freezeActive: boolean;
  capabilityMatch: boolean;
  plannerEligible: boolean;
  semanticConflicts: string[];
  contextSufficient?: boolean;
  conflictingContext?: string[];
  unsafeAssumptions?: string[];
}) {
  const plannerBlockReasons = Array.from(new Set([
    ...(input.semanticValid ? [] : ["SEMANTIC_MEANING_INVALID"]),
    ...(input.governanceApproved ? [] : ["SEMANTIC_GOVERNANCE_DENIED"]),
    ...(input.ambiguityDetected ? ["SEMANTIC_AMBIGUITY_DETECTED"] : []),
    ...(input.clarificationRequired ? ["REQUEST_CLARIFICATION"] : []),
    ...(input.protectedTargetDetected ? ["PROTECTED_TARGET_ESCALATION_REQUIRED"] : []),
    ...(input.replayDriftDetected ? ["REPLAY_DRIFT_DETECTED"] : []),
    ...(input.freezeActive ? ["FROZEN_INTENT_BLOCKED"] : []),
    ...(input.capabilityMatch ? [] : ["SEMANTIC_CAPABILITY_DRIFT"]),
    ...(input.plannerEligible ? [] : ["PLANNER_ADMISSION_DENIED"]),
    ...(input.contextSufficient === false ? ["CONTEXT_INSUFFICIENT"] : []),
    ...(input.conflictingContext?.length ? input.conflictingContext : []),
    ...(input.unsafeAssumptions?.length ? input.unsafeAssumptions : []),
    ...input.semanticConflicts,
  ]));

  return {
    plannerAdmissible: plannerBlockReasons.length === 0,
    plannerBlockReasons,
  };
}
