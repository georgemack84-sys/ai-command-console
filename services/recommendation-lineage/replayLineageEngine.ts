import type {
  RecommendationLineageError,
  RecommendationLineageInput,
  ReplayLineageRecord,
} from "./recommendationLineageStateTypes";
import { hashReplayLineage } from "./replayLineageHasher";
import { validateHistoricalReplayLineage } from "./historicalReplayLineageValidator";
import { detectReplayLineageDrift } from "./replayLineageDriftDetector";

export function buildReplayLineage(input: RecommendationLineageInput): {
  record: ReplayLineageRecord;
  errors: readonly RecommendationLineageError[];
} {
  const record: ReplayLineageRecord = Object.freeze({
    replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    replayDependencies: Object.freeze([
      input.constitutionalReplayResult.record.replayId,
      input.constitutionalReadinessResult.record.replayId,
      input.decisionIntentBoundaryResult.artifact.intentId,
    ]),
    replayCertified: input.constitutionalCertificationResult.record.replaySafe
      && input.constitutionalReadinessResult.record.replaySafe
      && input.constitutionalReplayResult.record.replayDeterministic,
    replayDivergenceDetected: input.metadata?.replayDivergence === true,
    replayReconstructionState: input.constitutionalReplayResult.record.replayDeterministic
      ? "historical_only"
      : "disputed",
    deterministicHash: hashReplayLineage({
      replayId: input.constitutionalReplayResult.record.replayId,
      replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
      replaySafe: input.constitutionalCertificationResult.record.replaySafe,
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze([
      ...validateHistoricalReplayLineage(input),
      ...(!record.replayCertified ? [{
        code: "RECOMMENDATION_LINEAGE_REPLAY_INVALID" as const,
        message: "Replay lineage could not be historically certified.",
        path: "replaySnapshotId",
      }] : []),
      ...detectReplayLineageDrift({ lineageInput: input, record }),
    ]),
  });
}
