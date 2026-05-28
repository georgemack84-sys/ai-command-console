import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  HistoricalGovernanceSnapshot,
} from "./replayStateTypes";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function validateReplaySnapshot(input: {
  replayInput: ConstitutionalReplayStabilityInput;
  snapshot: HistoricalGovernanceSnapshot;
}): readonly ConstitutionalReplayStabilityError[] {
  const normalized = normalizeReplayStabilityMetadata(input.replayInput.metadata);
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (!input.snapshot.replaySnapshotId) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_LINEAGE_BREAK",
      message: "Replay snapshot identifier is missing.",
      path: "snapshot.replaySnapshotId",
    }));
  }
  if (normalized.includes("stalesnapshot") || normalized.includes("governancesubstitution")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_GOVERNANCE_MISSING",
      message: "Stale snapshot or governance substitution markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
