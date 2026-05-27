import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  HistoricalGovernanceSnapshot,
  ReplayBindingRecord,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function validateReplayBinding(input: {
  replayInput: ConstitutionalReplayStabilityInput;
  snapshot: HistoricalGovernanceSnapshot;
}): {
  binding: ReplayBindingRecord;
  errors: readonly ConstitutionalReplayStabilityError[];
} {
  const boundary = input.replayInput.constitutionalAuthorityBoundaryResult;
  const approvalBound = boundary.lineageValidation.approvalLineageBound;
  const escalationBound = boundary.lineageValidation.escalationLineageBound;
  const governanceBound = boundary.record.governanceBound;
  const replayBound = boundary.record.replaySafe;
  const errors: ConstitutionalReplayStabilityError[] = [];

  if (!approvalBound || !escalationBound || !governanceBound || !replayBound) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_LINEAGE_BREAK",
      message: "Historical binding could not preserve approval, escalation, governance, or replay lineage.",
      path: "constitutionalAuthorityBoundaryResult.lineageValidation",
    }));
  }

  const binding: ReplayBindingRecord = Object.freeze({
    bindingId: hashReplayStabilityValue("constitutional-replay-stability-binding-id", input.replayInput.replayId),
    governanceBound,
    replayBound,
    approvalBound,
    escalationBound,
    deterministicHash: hashReplayStabilityValue("constitutional-replay-stability-binding", {
      replayId: input.replayInput.replayId,
      governanceBound,
      replayBound,
      approvalBound,
      escalationBound,
      governanceHash: input.snapshot.governanceHash,
    }),
  });

  return Object.freeze({
    binding,
    errors: Object.freeze(errors),
  });
}
