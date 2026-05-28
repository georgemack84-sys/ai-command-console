import type { IntentLifecycleState } from "@/types/intentContracts";

export const INTENT_TRANSITION_MATRIX: Record<IntentLifecycleState, readonly IntentLifecycleState[]> = {
  RECEIVED: ["NORMALIZING", "FROZEN"],
  NORMALIZING: ["CLASSIFYING", "REJECTED", "FROZEN"],
  CLASSIFYING: ["VALIDATING", "AMBIGUOUS", "FROZEN"],
  VALIDATING: ["ACCEPTED", "REJECTED", "CLARIFICATION_REQUIRED", "DISPUTED", "FROZEN"],
  AMBIGUOUS: ["CLARIFICATION_REQUIRED", "REJECTED", "FROZEN"],
  CLARIFICATION_REQUIRED: ["VALIDATING", "REJECTED", "FROZEN"],
  ACCEPTED: ["FROZEN"],
  REJECTED: ["FROZEN"],
  DISPUTED: ["VALIDATING", "FROZEN"],
  FROZEN: ["DISPUTED"],
};

export function isAllowedIntentTransition(fromState: IntentLifecycleState, toState: IntentLifecycleState) {
  return fromState === toState || INTENT_TRANSITION_MATRIX[fromState].includes(toState);
}
