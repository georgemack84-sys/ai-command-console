import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { ProposalReplayBinding } from "@/types/proposal-lifecycle-engine";
import { hashProposalLifecycleValue } from "./proposalLifecycleHasher";

export function bindProposalReplay(input: {
  replay: ReplayReconstructionResult;
  readinessHash: string;
  snapshotLineageHash: string;
}): ProposalReplayBinding {
  return Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    replaySnapshotHash: input.replay.lineage.replaySnapshotHash,
    replayLineageHash: hashProposalLifecycleValue("proposal-replay-lineage", {
      replayBindingHash: input.replay.lineage.replayBindingHash,
      treatyId: input.replay.lineage.treatyId,
      validatorBindings: input.replay.lineage.validatorBindings,
    }),
    readinessHash: input.readinessHash,
    snapshotLineageHash: input.snapshotLineageHash,
    deterministic: input.replay.status === "RECONSTRUCTED" && input.replay.integrity.valid,
    valid: input.replay.status === "RECONSTRUCTED" && input.replay.lineage.valid && input.replay.integrity.valid,
    disputed: input.replay.status !== "RECONSTRUCTED" || !input.replay.lineage.valid || !input.replay.integrity.valid,
  });
}
