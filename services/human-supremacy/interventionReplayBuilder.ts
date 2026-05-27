import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayInspection } from "@/types/human-supremacy";
import { hashInterventionValue } from "./interventionHasher";

export function buildInterventionReplayInspection(input: {
  coordinationId: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  escalationRecord: GovernanceAwareEscalationRecord;
}): ReplayInspection {
  const replayHashes = Object.freeze([
    input.proposal.replayBinding.replayLineageHash,
    input.proposal.replayBinding.reconstructionHash,
    input.proposal.replayBinding.replaySnapshotHash,
    input.lifecycle.record.replayBinding.reconstructionHash,
    input.escalationRecord.replayGraph.graphHash,
  ].sort((left, right) => left.localeCompare(right)));
  return Object.freeze({
    replayLineageId: hashInterventionValue("human-supremacy-replay-lineage-id", {
      coordinationId: input.coordinationId,
      replayHashes,
    }),
    coordinationId: input.coordinationId,
    replayHashes,
    replaySafe: input.proposal.replayBinding.valid
      && input.lifecycle.record.replayBinding.valid
      && input.escalationRecord.decision.replaySafe,
    inspectionHash: hashInterventionValue("human-supremacy-replay-inspection", {
      coordinationId: input.coordinationId,
      replayHashes,
    }),
  });
}
