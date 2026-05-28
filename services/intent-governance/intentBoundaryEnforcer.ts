import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";

export function enforceIntentBoundary(operationalIntent: OperationalIntentResolutionResult) {
  const blockedReasons = Array.from(new Set([
    ...operationalIntent.clarification.blockingReasons,
    ...operationalIntent.plannerAdmission.denialReasons,
    ...(operationalIntent.contextualResolution.contextSufficient ? [] : ["BOUNDARY_VIOLATION"]),
    ...(operationalIntent.contextualResolution.unsafeAssumptions.length > 0 ? ["UNSAFE_ASSUMPTION_DETECTED"] : []),
  ]));

  return {
    boundarySafe: blockedReasons.length === 0,
    blockedReasons,
  };
}
