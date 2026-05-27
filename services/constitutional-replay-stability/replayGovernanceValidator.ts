import type { ConstitutionalReplayStabilityError, HistoricalGovernanceSnapshot } from "./replayStateTypes";

export function validateReplayGovernance(snapshot: HistoricalGovernanceSnapshot): readonly ConstitutionalReplayStabilityError[] {
  if (!snapshot.governanceSnapshotId) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_GOVERNANCE_MISSING",
      message: "Replay governance validation requires immutable historical governance snapshots.",
      path: "snapshot.governanceSnapshotId",
    })]);
  }
  return Object.freeze([]);
}
