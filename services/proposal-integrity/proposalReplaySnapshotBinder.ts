import type { ProposalIntegrityInput, ProposalReplayBinding } from "./proposalIntegrityStateTypes";
import { hashProposalReplayValue } from "./proposalReplayHashEngine";

export function bindProposalReplaySnapshot(input: ProposalIntegrityInput): ProposalReplayBinding {
  return Object.freeze({
    replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    replayHash: hashProposalReplayValue("snapshot", {
      replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
      replayId: input.constitutionalReplayResult.record.replayId,
      recommendationReplayHash: input.recommendationLineageResult.artifact.replayHash,
    }),
    replayBound: input.constitutionalCertificationResult.record.replaySafe
      && input.constitutionalReadinessResult.record.replaySafe
      && input.recommendationLineageResult.replayLineage.replayCertified,
    historicalOnly: input.metadata?.presentStateSubstitution !== true && input.metadata?.replayRepair !== true,
    deterministicHash: hashProposalReplayValue("binding", {
      replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
      replayBound: input.constitutionalCertificationResult.record.replaySafe,
    }),
  });
}
