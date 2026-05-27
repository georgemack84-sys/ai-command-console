import type { DeterministicReplayError, DeterministicReplayInput } from "../types/deterministicReplayTypes";

export function validateDeterministicReplaySchema(
  input: DeterministicReplayInput,
): readonly DeterministicReplayError[] {
  const request = input.request;
  const valid =
    !!request.replayId
    && !!request.recommendationId
    && !!request.replaySnapshotId
    && !!request.governanceSnapshotId
    && request.validatorSnapshotIds.length > 0
    && request.policySnapshotIds.length > 0
    && request.approvalDependencyIds.length > 0
    && request.evidenceSnapshotIds.length > 0
    && !!request.scoringSnapshotId
    && !!request.confidenceSnapshotId
    && request.suppressionSnapshotIds.length > 0
    && !!request.requestedBy;

  return valid
    ? Object.freeze([])
    : Object.freeze([{
      code: "DETERMINISTIC_REPLAY_SCHEMA_INVALID" as const,
      message: "Replay request is incomplete for deterministic historical reconstruction.",
      path: "request",
    }]);
}
