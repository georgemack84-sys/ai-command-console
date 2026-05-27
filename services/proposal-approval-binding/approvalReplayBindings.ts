import type {
  ApprovalReplayBinding,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function buildApprovalReplayBinding(
  input: ProposalApprovalBindingInput,
  replayable: boolean,
): ApprovalReplayBinding {
  const replay = input.proposalReplayResult.replay;
  const core = {
    replayBindingId: `approval-replay-binding:${replay.replayId}`,
    proposalId: replay.proposalId,
    replayId: replay.replayId,
    replayHash: replay.replayHash,
    replayLineageHash: input.proposalReplayResult.lineage.replayLineageHash,
    admissible: replayable,
    frozen: input.proposalFreezeResult.status !== "ACTIVE",
    revoked: input.proposalRevocationResult.status !== "NOT_REVOKED",
    immutable: true as const,
  };

  return Object.freeze({
    ...core,
    bindingHash: hashApprovalValue("approval-replay-binding", core),
  });
}
