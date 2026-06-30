import { EdgeBookError } from "../errors";

export type PhaseBlockedAction =
  | "GENERATE_PICK"
  | "RANK_BET"
  | "CALCULATE_EDGE"
  | "CREATE_RECOMMENDATION"
  | "AUTO_WAGER"
  | "CREATE_PREDICTION"
  | "CALCULATE_EXPECTED_VALUE";

export const phaseOneBlockedActions: ReadonlySet<PhaseBlockedAction> = new Set([
  "GENERATE_PICK",
  "RANK_BET",
  "CALCULATE_EDGE",
  "CREATE_RECOMMENDATION",
  "AUTO_WAGER",
  "CREATE_PREDICTION",
  "CALCULATE_EXPECTED_VALUE",
]);

export function assertPhaseOneActionAllowed(action: string): { status: "VALID" } {
  if (phaseOneBlockedActions.has(action as PhaseBlockedAction)) {
    throw new EdgeBookError(
      "PHASE_BOUNDARY_VIOLATION",
      `Action ${action} is blocked during EdgeBook Phase 1.0.`,
      "action",
    );
  }

  return { status: "VALID" };
}

export function evaluatePhaseOneAction(action: string):
  | { status: "VALID" }
  | { status: "REJECTED"; code: "PHASE_BOUNDARY_VIOLATION"; reason: string } {
  if (phaseOneBlockedActions.has(action as PhaseBlockedAction)) {
    return {
      status: "REJECTED",
      code: "PHASE_BOUNDARY_VIOLATION",
      reason: `Action ${action} is blocked during EdgeBook Phase 1.0.`,
    };
  }

  return { status: "VALID" };
}
