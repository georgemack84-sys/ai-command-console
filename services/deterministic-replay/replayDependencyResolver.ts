import type {
  DeterministicReplayError,
  DeterministicReplayInput,
} from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export type ReplayDependencyResolution = Readonly<{
  dependencyHashes: readonly string[];
  resolutionHash: string;
}>;

export function resolveReplayDependencies(input: DeterministicReplayInput): {
  resolution: ReplayDependencyResolution;
  errors: readonly DeterministicReplayError[];
} {
  const errors: DeterministicReplayError[] = [];
  const request = input.request;
  if (request.evidenceSnapshotIds.length === 0 || request.validatorSnapshotIds.length === 0) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_MISSING_DEPENDENCY",
      message: "Replay dependencies are incomplete.",
      path: "request",
    });
  }

  const dependencyHashes = Object.freeze([
    ...request.evidenceSnapshotIds.map((snapshotId) => hashReplayValue("replay-evidence-dependency", snapshotId)),
    ...request.policySnapshotIds.map((snapshotId) => hashReplayValue("replay-policy-dependency", snapshotId)),
    ...request.validatorSnapshotIds.map((snapshotId) => hashReplayValue("replay-validator-dependency", snapshotId)),
    ...request.approvalDependencyIds.map((dependencyId) => hashReplayValue("replay-approval-dependency", dependencyId)),
    hashReplayValue("replay-scoring-dependency", request.scoringSnapshotId),
    hashReplayValue("replay-confidence-dependency", request.confidenceSnapshotId),
    ...request.suppressionSnapshotIds.map((snapshotId) => hashReplayValue("replay-suppression-dependency", snapshotId)),
  ]);

  return Object.freeze({
    resolution: Object.freeze({
      dependencyHashes,
      resolutionHash: hashReplayValue("replay-dependency-resolution", dependencyHashes),
    }),
    errors: Object.freeze(errors),
  });
}
