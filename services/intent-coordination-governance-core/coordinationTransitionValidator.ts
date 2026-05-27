import type { CoordinationGovernanceError, CoordinationState, CoordinationTransition } from "@/types/intent-coordination-governance-core";
import { createCoordinationGovernanceError } from "./coordinationErrors";

const TRANSITIONS: Readonly<Record<CoordinationState, readonly CoordinationTransition[]>> = Object.freeze({
  proposed: ["validate", "revoke"] as const,
  validated: ["govern", "revoke"] as const,
  governed: ["bound", "revoke"] as const,
  bounded: ["review", "freeze", "revoke"] as const,
  reviewed: ["escalate", "freeze", "archive", "revoke"] as const,
  escalated: ["freeze", "archive", "revoke"] as const,
  frozen: ["archive", "revoke"] as const,
  revoked: ["archive"] as const,
  archived: [] as const,
});

const RESULTING_STATE: Readonly<Record<CoordinationTransition, CoordinationState>> = Object.freeze({
  validate: "validated",
  govern: "governed",
  bound: "bounded",
  review: "reviewed",
  escalate: "escalated",
  freeze: "frozen",
  revoke: "revoked",
  archive: "archived",
});

export function resolveCoordinationTransition(input: {
  currentState: CoordinationState;
  requestedTransition: CoordinationTransition;
  errorsPresent: boolean;
  escalationActive: boolean;
}): Readonly<{
  resultingState: CoordinationState;
  errors: readonly CoordinationGovernanceError[];
}> {
  const allowed = TRANSITIONS[input.currentState];
  const errors: CoordinationGovernanceError[] = [];
  if (!allowed.includes(input.requestedTransition)) {
    errors.push(createCoordinationGovernanceError(
      "INVALID_COORDINATION_TRANSITION",
      `Transition ${input.requestedTransition} is not allowed from ${input.currentState}.`,
      "requestedTransition",
    ));
  }
  if (input.currentState === "reviewed" && input.requestedTransition === "escalate" && !input.escalationActive) {
    errors.push(createCoordinationGovernanceError(
      "ESCALATION_CONTAINMENT_VIOLATION",
      "Escalation transition requires active upstream escalation recommendation evidence.",
      "requestedTransition",
    ));
  }
  const resultingState = errors.length > 0 || input.errorsPresent
    ? input.currentState
    : RESULTING_STATE[input.requestedTransition];

  return Object.freeze({
    resultingState,
    errors: Object.freeze(errors),
  });
}
