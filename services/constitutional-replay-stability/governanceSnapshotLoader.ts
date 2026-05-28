import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  HistoricalGovernanceSnapshot,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function loadHistoricalGovernanceSnapshot(input: ConstitutionalReplayStabilityInput): {
  snapshot: HistoricalGovernanceSnapshot;
  errors: readonly ConstitutionalReplayStabilityError[];
} {
  const boundary = input.constitutionalAuthorityBoundaryResult;
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (!boundary.record.governanceSnapshotId) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_GOVERNANCE_MISSING",
      message: "Historical governance snapshot is missing from authority boundary evidence.",
      path: "constitutionalAuthorityBoundaryResult.record.governanceSnapshotId",
    }));
  }
  const snapshot: HistoricalGovernanceSnapshot = Object.freeze({
    governanceSnapshotId: boundary.record.governanceSnapshotId,
    replaySnapshotId: boundary.record.replaySnapshotId,
    authorityBoundaryId: boundary.record.boundaryId,
    validatorVersionId: input.validatorVersionId,
    governanceHash: hashReplayStabilityValue("constitutional-replay-stability-governance-snapshot", {
      governanceSnapshotId: boundary.record.governanceSnapshotId,
      replaySnapshotId: boundary.record.replaySnapshotId,
      boundaryId: boundary.record.boundaryId,
      validatorVersionId: input.validatorVersionId,
    }),
  });
  return Object.freeze({
    snapshot,
    errors: Object.freeze(errors),
  });
}
