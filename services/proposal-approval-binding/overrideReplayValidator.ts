import type {
  OperatorOverrideBinding,
  ProposalApprovalBindingError,
} from "./types/proposalApprovalBindingTypes";
import type { ProposalReplayResult } from "@/services/proposal-replay/replayTypes";

export function validateOverrideReplayBinding(input: {
  overrideBinding?: OperatorOverrideBinding;
  proposalReplayResult: ProposalReplayResult;
}): readonly ProposalApprovalBindingError[] {
  if (!input.overrideBinding) {
    return Object.freeze([]);
  }

  if (input.proposalReplayResult.status === "FAILED_CLOSED") {
    return Object.freeze([{
      code: "PROPOSAL_APPROVAL_BINDING_OVERRIDE_CORRUPTED",
      message: "Operator override replay cannot bind against a failed-closed replay result.",
      path: "proposalReplayResult.status",
    } satisfies ProposalApprovalBindingError]);
  }

  return Object.freeze([]);
}
