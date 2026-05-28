import type { PersistedPlanState } from "./planContracts";

export const PLAN_TRANSITION_MATRIX: Record<PersistedPlanState, PersistedPlanState[]> = {
  DRAFT: ["VALIDATING", "FROZEN"],
  VALIDATING: ["VALIDATED", "FAILED", "FROZEN"],
  VALIDATED: ["AWAITING_APPROVAL", "QUEUED", "FROZEN"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED", "FROZEN"],
  APPROVED: ["QUEUED", "FROZEN"],
  REJECTED: ["FROZEN"],
  QUEUED: ["EXECUTING", "CANCELLED", "FROZEN"],
  EXECUTING: ["COMPLETED", "FAILED", "PAUSED", "CANCELLED", "FROZEN"],
  PAUSED: ["QUEUED", "CANCELLED", "FROZEN"],
  COMPLETED: ["FROZEN"],
  FAILED: ["DISPUTED", "FROZEN"],
  CANCELLED: ["FROZEN"],
  FROZEN: ["DISPUTED", "FROZEN"],
  DISPUTED: ["VALIDATING", "FROZEN"],
};

export function isAllowedPlanTransition(fromState: PersistedPlanState, toState: PersistedPlanState) {
  return PLAN_TRANSITION_MATRIX[fromState]?.includes(toState) ?? false;
}
