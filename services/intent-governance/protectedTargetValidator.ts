import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";

export function validateProtectedTargets(operationalIntent: OperationalIntentResolutionResult) {
  const protectedTargetValidated =
    !operationalIntent.semanticGovernance.protectedTargetDetected
    && !operationalIntent.plannerAdmission.escalationRequired;

  return {
    protectedTargetValidated,
    blockedReasons: protectedTargetValidated ? [] : ["PROTECTED_TARGET_BLOCKED"],
  };
}
