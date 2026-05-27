import type {
  OverrideContractError,
  OverrideEvent,
  OverrideReplayBinding,
} from "@/types/human-override-contract";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { hashOverrideValue } from "./overrideHasher";

export function bindOverrideReplay(input: {
  event: OverrideEvent;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  replay: ReplayReconstructionResult;
  lineageHash: string;
}): { replayBinding: OverrideReplayBinding; errors: readonly OverrideContractError[] } {
  const valid =
    input.proposal.replayBinding.valid
    && input.approvalGraph.replay.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.lineage.valid
    && input.replay.integrity.valid;

  const replayBinding: OverrideReplayBinding = Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    replaySnapshotHash: input.replay.lineage.replaySnapshotHash,
    replayLineageHash: input.approvalGraph.replay.replayLineageHash,
    approvalGraphHash: input.approvalGraph.graphHash,
    proposalHash: input.proposal.proposalHash,
    overrideLineageHash: input.lineageHash,
    deterministic: input.approvalGraph.replay.deterministic && input.proposal.replayBinding.deterministic,
    valid,
    disputed: !valid,
  });

  const errors: OverrideContractError[] = [];
  if (!valid) {
    errors.push({
      code: "OVERRIDE_REPLAY_MISMATCH",
      message: "Override replay binding is missing or disputed.",
      path: "replay",
    });
  }

  return {
    replayBinding,
    errors: Object.freeze(errors),
  };
}
