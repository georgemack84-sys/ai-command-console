import type {
  DeterministicReplayError,
  DeterministicReplayInput,
  ImmutableReplaySnapshot,
} from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

function buildSnapshot(input: {
  snapshotId: string;
  snapshotType: string;
  createdAt: string;
  lineageHash: string;
  dependencyHashes: readonly string[];
}): ImmutableReplaySnapshot {
  return Object.freeze({
    snapshotId: input.snapshotId,
    snapshotType: input.snapshotType,
    snapshotHash: hashReplayValue(`replay-snapshot:${input.snapshotType}`, input),
    createdAt: input.createdAt,
    immutable: true as const,
    lineageHash: input.lineageHash,
    dependencyHashes: [...input.dependencyHashes],
  });
}

export function loadReplaySnapshots(input: DeterministicReplayInput): {
  snapshots: readonly ImmutableReplaySnapshot[];
  errors: readonly DeterministicReplayError[];
} {
  const request = input.request;
  const recommendationId = input.recommendationValidationResult.result.recommendationId;
  const missingErrors: DeterministicReplayError[] = [];

  if (request.recommendationId !== recommendationId) {
    missingErrors.push({
      code: "DETERMINISTIC_REPLAY_MISSING_SNAPSHOT",
      message: "Replay request recommendation binding diverged from historical validation state.",
      path: "request.recommendationId",
    });
  }
  if (request.replaySnapshotId !== input.recommendationValidationResult.result.replaySnapshotId) {
    missingErrors.push({
      code: "DETERMINISTIC_REPLAY_MISSING_SNAPSHOT",
      message: "Replay snapshot binding is missing or mismatched.",
      path: "request.replaySnapshotId",
    });
  }
  if (request.governanceSnapshotId !== input.recommendationValidationResult.result.governanceSnapshotId) {
    missingErrors.push({
      code: "DETERMINISTIC_REPLAY_MISSING_SNAPSHOT",
      message: "Governance snapshot binding is missing or mismatched.",
      path: "request.governanceSnapshotId",
    });
  }

  const snapshots = Object.freeze([
    buildSnapshot({
      snapshotId: request.replaySnapshotId,
      snapshotType: "replay",
      createdAt: request.createdAt,
      lineageHash: input.recommendationValidationResult.lineage.lineageHash,
      dependencyHashes: Object.freeze([
        input.recommendationValidationResult.result.validationHash,
        input.recommendationLineageResult.artifact.replayHash,
      ]),
    }),
    buildSnapshot({
      snapshotId: request.governanceSnapshotId,
      snapshotType: "governance",
      createdAt: request.createdAt,
      lineageHash: input.recommendationLineageResult.governanceLineage.deterministicHash,
      dependencyHashes: Object.freeze([
        input.recommendationValidationResult.result.validationHash,
        input.operatorAuthorityResult.action.auditHash,
      ]),
    }),
    buildSnapshot({
      snapshotId: request.scoringSnapshotId,
      snapshotType: "scoring",
      createdAt: request.createdAt,
      lineageHash: input.recommendationLineageResult.scoringLineage.deterministicHash,
      dependencyHashes: Object.freeze([
        input.decisionIntentBoundaryResult.aggregation.deterministicHash,
      ]),
    }),
    buildSnapshot({
      snapshotId: request.confidenceSnapshotId,
      snapshotType: "confidence",
      createdAt: request.createdAt,
      lineageHash: input.decisionIntentBoundaryResult.lineage.lineageHash,
      dependencyHashes: Object.freeze([
        input.decisionIntentBoundaryResult.artifact.deterministicHash,
        input.recommendationLineageResult.scoringLineage.deterministicHash,
      ]),
    }),
    ...request.suppressionSnapshotIds.map((snapshotId) =>
      buildSnapshot({
        snapshotId,
        snapshotType: "suppression",
        createdAt: request.createdAt,
        lineageHash: input.operatorAuthorityResult.lineage.lineageHash,
        dependencyHashes: Object.freeze([
          input.operatorAuthorityResult.action.replayHash,
          input.operatorAuthorityResult.action.auditHash,
        ]),
      })),
  ]);

  return Object.freeze({
    snapshots,
    errors: Object.freeze(missingErrors),
  });
}
