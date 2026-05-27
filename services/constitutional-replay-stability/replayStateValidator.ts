import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  HistoricalGovernanceSnapshot,
  ReplayStateRecord,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function validateReplayState(input: {
  replayInput: ConstitutionalReplayStabilityInput;
  snapshot: HistoricalGovernanceSnapshot;
}): {
  state: ReplayStateRecord;
  errors: readonly ConstitutionalReplayStabilityError[];
} {
  const boundary = input.replayInput.constitutionalAuthorityBoundaryResult;
  const certification = boundary.record.certificationState;
  const recommendationState = certification === "CERTIFIED" ? "bounded" : "frozen";
  const escalationState = certification === "CERTIFIED" ? "stable" : certification === "DISPUTED" ? "disputed" : "frozen";
  const approvalState = boundary.lineageValidation.approvalLineageBound ? "stable" : "disputed";
  const overrideState = boundary.authorityClasses.some((item) => item.authorityClass === "A4") ? "preserved" : "frozen";
  const errors: ConstitutionalReplayStabilityError[] = [];

  if (approvalState !== "stable") {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_INFERRED_RECONSTRUCTION",
      message: "Replay state would require inferred approval reconstruction.",
      path: "constitutionalAuthorityBoundaryResult.lineageValidation.approvalLineageBound",
    }));
  }

  const state: ReplayStateRecord = Object.freeze({
    replayId: input.replayInput.replayId,
    recommendationState,
    escalationState,
    approvalState,
    overrideState,
    governanceSnapshotId: input.snapshot.governanceSnapshotId,
    replaySnapshotId: input.snapshot.replaySnapshotId,
    deterministicHash: hashReplayStabilityValue("constitutional-replay-stability-state", {
      replayId: input.replayInput.replayId,
      recommendationState,
      escalationState,
      approvalState,
      overrideState,
      governanceSnapshotId: input.snapshot.governanceSnapshotId,
      replaySnapshotId: input.snapshot.replaySnapshotId,
    }),
  });

  return Object.freeze({
    state,
    errors: Object.freeze(errors),
  });
}
