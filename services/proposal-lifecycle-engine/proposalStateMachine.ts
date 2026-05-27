import type { ProposalLifecycleError, ProposalState, ProposalTransition } from "@/types/proposal-lifecycle-engine";

const TRANSITIONS: Readonly<Record<ProposalState, Partial<Record<ProposalTransition, ProposalState>>>> = Object.freeze({
  draft: Object.freeze({ validate: "validated" }),
  validated: Object.freeze({ submit_governance_review: "governance_review" }),
  governance_review: Object.freeze({ approve: "approved", deny: "denied" }),
  approved: Object.freeze({ prepare_handoff: "prepared_handoff", revoke: "revoked" }),
  denied: Object.freeze({ archive: "archived" }),
  prepared_handoff: Object.freeze({ archive: "archived", revoke: "revoked" }),
  archived: Object.freeze({}),
  revoked: Object.freeze({ archive: "archived" }),
});

export function resolveProposalTransition(input: {
  currentState: ProposalState;
  requestedTransition: ProposalTransition;
  approvalValid: boolean;
  revoked: boolean;
  futureBound: boolean;
  errorsPresent: boolean;
}): { resultingState: ProposalState; errors: readonly ProposalLifecycleError[] } {
  const errors: ProposalLifecycleError[] = [];

  if (input.currentState === "archived") {
    errors.push({
      code: "PROPOSAL_ARCHIVED_IMMUTABLE",
      message: "Archived proposals are immutable.",
      path: "state",
    });
    return { resultingState: "archived", errors: Object.freeze(errors) };
  }
  if (input.revoked) {
    if (input.requestedTransition !== "archive") {
      errors.push({
        code: "PROPOSAL_REVOKED",
        message: "Revoked proposals may only be archived.",
        path: "revocation",
      });
    }
  }
  if (input.futureBound && (input.requestedTransition === "approve" || input.requestedTransition === "prepare_handoff")) {
    errors.push({
      code: "PROPOSAL_FUTURE_BOUND_ESCALATION",
      message: "Future-bound autonomy semantics may not escalate into approval or handoff.",
      path: "safeActionBinding",
    });
  }
  if ((input.requestedTransition === "approve" || input.requestedTransition === "prepare_handoff") && !input.approvalValid) {
    errors.push({
      code: "PROPOSAL_APPROVAL_REQUIRED",
      message: "Explicit valid approval is required for this transition.",
      path: "approval",
    });
  }
  if (input.errorsPresent) {
    return { resultingState: input.currentState, errors: Object.freeze(errors) };
  }

  const resultingState = TRANSITIONS[input.currentState][input.requestedTransition];
  if (!resultingState) {
    errors.push({
      code: "PROPOSAL_STATE_TRANSITION_INVALID",
      message: `Transition ${input.requestedTransition} is invalid from ${input.currentState}.`,
      path: "requestedTransition",
    });
    return { resultingState: input.currentState, errors: Object.freeze(errors) };
  }

  return {
    resultingState,
    errors: Object.freeze(errors),
  };
}
