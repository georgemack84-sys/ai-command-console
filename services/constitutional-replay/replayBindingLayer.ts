import type { ConstitutionalReplayBinding } from "@/types/constitutional-coordination";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { CoordinationContainmentRecord } from "@/types/coordination-containment";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function bindReplayLineage(input: {
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  containmentRecord: CoordinationContainmentRecord;
  createdAt: string;
}): ConstitutionalReplayBinding {
  const binding: ConstitutionalReplayBinding = Object.freeze({
    replaySnapshotId: hashContainmentValue("constitutional-replay-snapshot-id", {
      proposalId: input.proposal.proposalId,
      replaySnapshotHash: input.proposal.replayBinding.replaySnapshotHash,
    }),
    replaySnapshotHash: input.proposal.replayBinding.replaySnapshotHash,
    replayLineageId: input.proposal.replayBinding.replayLineageHash,
    lifecycleHash: input.lifecycle.record.lifecycleHash,
    containmentReplayHash: input.containmentRecord.replay.replayHash,
    valid:
      input.proposal.replayBinding.valid
      && input.proposal.replayBinding.deterministic
      && input.containmentRecord.validation.replaySafe,
    deterministic: input.proposal.replayBinding.deterministic,
    createdAt: input.createdAt,
    bindingHash: "",
  });
  return Object.freeze({
    ...binding,
    bindingHash: hashContainmentValue("constitutional-replay-binding", binding),
  });
}
