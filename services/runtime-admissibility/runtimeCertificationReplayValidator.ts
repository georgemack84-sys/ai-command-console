import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeCertificationReplay(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const replay = input.constitutionalReplayResult;
  const sameReplaySnapshot = replay.record.replaySnapshotId === replay.historicalGovernance.replaySnapshotId;
  if (sameReplaySnapshot && replay.record.replayDeterministic) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_REPLAY_MISMATCH",
    message: "Runtime certification requires stable historical replay snapshots with no present-state substitution.",
    path: "constitutionalReplayResult.record.replaySnapshotId",
  })]);
}
