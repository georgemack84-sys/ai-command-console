import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceLineageRecord,
  DeterministicConfidenceInput,
  DeterministicConfidenceScore,
} from "./types/confidenceTypes";

export function buildConfidenceLineage(input: {
  engineInput: DeterministicConfidenceInput;
  score: DeterministicConfidenceScore;
}): ConfidenceLineageRecord {
  const core = {
    lineageId: `confidence-lineage:${input.score.confidenceId}`,
    confidenceId: input.score.confidenceId,
    proposalId: input.score.proposalId,
    proposalLineageId: input.engineInput.proposalStateEngineResult.lineage.lineageId,
    replayLineageId: input.engineInput.proposalReplayResult.lineage.replayLineageHash,
    governanceSnapshotId: input.score.governanceSnapshotId,
    evidenceSnapshotId: input.score.evidenceSnapshotId,
  };

  return Object.freeze({
    ...core,
    lineageHash: hashConfidenceValue("confidence-lineage", core),
  });
}
