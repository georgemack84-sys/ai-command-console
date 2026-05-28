import type {
  OperatorOverrideBinding,
  OverrideLineage,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function buildOverrideLineage(input: {
  engineInput: ProposalApprovalBindingInput;
  overrideBinding?: OperatorOverrideBinding;
}): OverrideLineage {
  const proposalId = input.engineInput.proposalIntegrityResult.proposal.proposalId;
  const overrideBindingIds = input.overrideBinding
    ? [input.overrideBinding.overrideBindingId]
    : [];

  const lineageCore = {
    lineageId: `override-lineage:${proposalId}`,
    proposalId,
    overrideBindingIds: Object.freeze(overrideBindingIds),
    createdAt: input.engineInput.existingOverrideLineage?.createdAt ?? input.engineInput.evaluatedAt,
    updatedAt: input.engineInput.evaluatedAt,
  };

  return Object.freeze({
    ...lineageCore,
    lineageHash: hashApprovalValue("approval-override-lineage", lineageCore),
  });
}
