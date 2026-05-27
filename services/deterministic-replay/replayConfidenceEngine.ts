import type { DeterministicReplayError, DeterministicReplayInput, ReplayConfidenceRecord } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function reconstructReplayConfidence(input: DeterministicReplayInput): {
  confidence: ReplayConfidenceRecord;
  errors: readonly DeterministicReplayError[];
} {
  const artifactConfidence = input.decisionIntentBoundaryResult.artifact.confidence;
  const confidence = Object.freeze({
    confidenceSnapshotId: input.request.confidenceSnapshotId,
    confidenceScore: artifactConfidence.score,
    confidenceReasoning: Object.freeze([...artifactConfidence.reasoning]),
    uncertaintyFactors: Object.freeze([...artifactConfidence.uncertaintyFactors]),
    confidenceHash: hashReplayValue("replay-confidence", {
      confidenceSnapshotId: input.request.confidenceSnapshotId,
      confidenceScore: artifactConfidence.score,
      confidenceReasoning: artifactConfidence.reasoning,
      uncertaintyFactors: artifactConfidence.uncertaintyFactors,
    }),
  }) satisfies ReplayConfidenceRecord;

  const expectedConfidenceSnapshotId = `confidence:${input.decisionIntentBoundaryResult.artifact.intentId}`;
  return Object.freeze({
    confidence,
    errors: input.request.confidenceSnapshotId === expectedConfidenceSnapshotId
      ? Object.freeze([])
      : Object.freeze([{
        code: "DETERMINISTIC_REPLAY_CONFIDENCE_MISMATCH" as const,
        message: "Replay confidence snapshot diverged from historical confidence ancestry.",
        path: "request.confidenceSnapshotId",
      }]),
  });
}
