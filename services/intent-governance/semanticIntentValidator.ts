import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";

export function validateSemanticIntentRuntime(operationalIntent: OperationalIntentResolutionResult) {
  const blockedReasons = [
    ...(operationalIntent.semanticGovernance.semanticallyValid ? [] : ["SEMANTIC_VALIDATION_FAILED"]),
    ...(operationalIntent.semanticGovernance.ambiguityDetected ? ["AMBIGUOUS_OPERATIONAL_INTENT"] : []),
    ...(operationalIntent.contextualResolution.conflictingContext.length > 0 ? operationalIntent.contextualResolution.conflictingContext : []),
  ];

  return {
    semanticValid: blockedReasons.length === 0,
    blockedReasons,
  };
}
