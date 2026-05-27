import type { LifecycleError, LifecycleTransitionRequest } from "@/types/lifecycle";
import { createLifecycleError } from "@/services/lifecycle/lifecycleBoundaryGuards";

export function validateGovernanceTransitionRequest(request: LifecycleTransitionRequest): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];

  if (!request.governanceValidation.asserted || request.governanceValidation.governanceSnapshotHash !== request.proposal.governanceBinding.policySnapshotHash) {
    errors.push(createLifecycleError(
      "LIFECYCLE_GOVERNANCE_MISMATCH",
      "Explicit governance validation must match the immutable proposal governance snapshot.",
      "governanceValidation",
    ));
  }

  if (!request.replayValidation.asserted || request.replayValidation.replaySnapshotHash !== request.proposal.replayBinding.replaySnapshotHash) {
    errors.push(createLifecycleError(
      "LIFECYCLE_REPLAY_MISMATCH",
      "Explicit replay validation must match the immutable proposal replay snapshot.",
      "replayValidation",
    ));
  }

  if (!request.escalationValidation.asserted || request.escalationValidation.escalationId !== request.escalation.recommendation.escalationId) {
    errors.push(createLifecycleError(
      "LIFECYCLE_ESCALATION_MISMATCH",
      "Explicit escalation validation must reference the immutable escalation recommendation.",
      "escalationValidation",
    ));
  }

  if (!request.approvalValidation.asserted) {
    errors.push(createLifecycleError(
      "LIFECYCLE_APPROVAL_MISMATCH",
      "Explicit approval validation is required for every lifecycle transition request.",
      "approvalValidation",
    ));
  }

  if (request.currentState === "review" && request.nextState === "approved" && !request.proposal.approval.valid) {
    errors.push(createLifecycleError(
      "LIFECYCLE_APPROVAL_MISMATCH",
      "Review to approved requires upstream explicit valid approval.",
      "proposal.approval",
    ));
  }

  return Object.freeze(errors);
}
