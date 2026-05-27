import type { ApprovalDependencyGraphInput, ApprovalReplayBinding } from "@/types/approval-dependency-graph";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

export function bindApprovalReplay(input: ApprovalDependencyGraphInput): ApprovalReplayBinding {
  const graphSeedHash = hashApprovalGraphValue("approval-graph-seed", {
    proposalHash: input.proposal.proposalHash,
    proposalReplayHash: input.proposal.replayBinding.reconstructionHash,
    generatedAt: input.generatedAt,
  });
  const valid =
    input.proposal.replayBinding.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.lineage.valid
    && input.replay.integrity.valid;

  return Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    replaySnapshotHash: input.replay.lineage.replaySnapshotHash,
    replayLineageHash: input.proposal.replayBinding.replayLineageHash,
    proposalHash: input.proposal.proposalHash,
    graphSeedHash,
    deterministic: input.proposal.replayBinding.deterministic && input.replay.integrity.valid,
    valid,
    disputed: !valid,
  });
}
