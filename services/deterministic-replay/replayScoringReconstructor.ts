import type { DeterministicReplayError, DeterministicReplayInput, ReplayScoringRecord } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function reconstructReplayScoring(input: DeterministicReplayInput): {
  scoring: ReplayScoringRecord;
  errors: readonly DeterministicReplayError[];
} {
  const scoringLineage = input.recommendationLineageResult.scoringLineage;
  const reconstructedScore = Number(input.decisionIntentBoundaryResult.aggregation.proposalScore.toFixed(6));
  const scoring = Object.freeze({
    scoringSnapshotId: input.request.scoringSnapshotId,
    scoreFactors: Object.freeze([...scoringLineage.scoringFactors]),
    scoreWeights: scoringLineage.scoringWeights,
    reconstructedScore,
    scoringHash: hashReplayValue("replay-scoring", {
      scoringSnapshotId: input.request.scoringSnapshotId,
      scoringFactors: scoringLineage.scoringFactors,
      scoringWeights: scoringLineage.scoringWeights,
      reconstructedScore,
    }),
  }) satisfies ReplayScoringRecord;

  return Object.freeze({
    scoring,
    errors: input.request.scoringSnapshotId === input.recommendationLineageResult.artifact.scoringSnapshotId
      ? Object.freeze([])
      : Object.freeze([{
        code: "DETERMINISTIC_REPLAY_SCORING_MISMATCH" as const,
        message: "Replay scoring snapshot diverged from historical scoring ancestry.",
        path: "request.scoringSnapshotId",
      }]),
  });
}
