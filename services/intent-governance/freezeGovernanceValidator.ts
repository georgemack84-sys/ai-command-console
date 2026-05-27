import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";

export function validateFreezeGovernance(operationalIntent: OperationalIntentResolutionResult) {
  return {
    freezeSafe: !operationalIntent.semanticGovernance.freezeActive,
    blockedReasons: operationalIntent.semanticGovernance.freezeActive ? ["FREEZE_STATE_ACTIVE"] : [],
  };
}
