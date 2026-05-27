import type { LifecycleError, LifecycleTransitionRequest } from "@/types/lifecycle";
import { createLifecycleError } from "./lifecycleBoundaryGuards";

export function validateLifecycleStateRequest(request: LifecycleTransitionRequest): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];

  if (request.currentState !== request.currentRecord.resultingState) {
    errors.push(createLifecycleError(
      "LIFECYCLE_GOVERNANCE_MISMATCH",
      "Lifecycle request current state must match the current immutable lifecycle record.",
      "currentState",
    ));
  }

  if (request.proposal.proposalId !== request.currentRecord.proposalId) {
    errors.push(createLifecycleError(
      "LIFECYCLE_GOVERNANCE_MISMATCH",
      "Proposal identity mismatch between transition request and current lifecycle record.",
      "proposalId",
    ));
  }

  return Object.freeze(errors);
}
