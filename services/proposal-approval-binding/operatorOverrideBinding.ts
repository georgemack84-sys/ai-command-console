import type {
  OperatorOverrideBinding,
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function bindOperatorOverride(
  input: ProposalApprovalBindingInput,
): {
  overrideBinding?: OperatorOverrideBinding;
  errors: readonly ProposalApprovalBindingError[];
} {
  const request = input.operatorOverrideRequest;
  if (!request) {
    return { errors: Object.freeze([]) };
  }

  const errors: ProposalApprovalBindingError[] = [];

  if (!request.supersedesAutomation) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_OVERRIDE_CORRUPTED",
      message: "Operator overrides must explicitly supersede automation to preserve constitutional clarity.",
      path: "operatorOverrideRequest.supersedesAutomation",
    });
  }

  const core = {
    overrideBindingId: request.overrideId,
    proposalId: input.proposalIntegrityResult.proposal.proposalId,
    operatorId: request.operatorId,
    disposition: request.disposition,
    reason: request.reason,
    governanceSnapshotId: input.proposalGovernanceBindingResult.binding.governanceSnapshotId,
    replayId: input.proposalReplayResult.replay.replayId,
    supersedesAutomation: true as const,
    immutable: true as const,
    boundAt: request.boundAt,
  };

  return {
    overrideBinding: Object.freeze({
      ...core,
      overrideHash: hashApprovalValue("approval-operator-override", core),
    }),
    errors: Object.freeze(errors),
  };
}
