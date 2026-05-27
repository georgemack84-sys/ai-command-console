import type { BoundedIntentLifecycleState, LifecycleError, LifecycleTransitionRequest } from "@/types/lifecycle";
import { createLifecycleError } from "@/services/lifecycle/lifecycleBoundaryGuards";

const ALLOWED_TRANSITIONS: Readonly<Record<BoundedIntentLifecycleState, readonly BoundedIntentLifecycleState[]>> = Object.freeze({
  observe: Object.freeze(["interpret"] as const),
  interpret: Object.freeze(["recommend"] as const),
  recommend: Object.freeze(["propose"] as const),
  propose: Object.freeze(["review"] as const),
  review: Object.freeze(["approved", "denied", "blocked"] as const),
  approved: Object.freeze(["revalidate"] as const),
  denied: Object.freeze([] as const),
  revalidate: Object.freeze(["bounded_coordination", "blocked", "expired"] as const),
  bounded_coordination: Object.freeze(["bounded_handoff"] as const),
  bounded_handoff: Object.freeze([] as const),
  blocked: Object.freeze(["review"] as const),
  expired: Object.freeze([] as const),
});

export function resolveLifecycleStateTransition(
  request: LifecycleTransitionRequest,
  errorsPresent: boolean,
): Readonly<{
  resultingState: BoundedIntentLifecycleState;
  errors: readonly LifecycleError[];
}> {
  const errors: LifecycleError[] = [];
  const allowed = ALLOWED_TRANSITIONS[request.currentState];

  if (!allowed.includes(request.nextState)) {
    errors.push(createLifecycleError(
      "LIFECYCLE_INVALID_TRANSITION",
      `Transition ${request.currentState} -> ${request.nextState} is not allowed.`,
      "nextState",
    ));
  }

  if (request.currentState === "review" && request.nextState === "approved" && request.approvalValidation.approvalState !== "valid") {
    errors.push(createLifecycleError(
      "LIFECYCLE_APPROVAL_MISMATCH",
      "Approval transition requires explicit valid approval evidence.",
      "approvalValidation",
    ));
  }

  return Object.freeze({
    resultingState: errorsPresent || errors.length > 0 ? request.currentState : request.nextState,
    errors: Object.freeze(errors),
  });
}
