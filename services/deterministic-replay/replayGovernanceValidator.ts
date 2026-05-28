import type { DeterministicReplayError, DeterministicReplayInput, ReplayGovernanceBinding } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function validateReplayGovernance(input: DeterministicReplayInput): {
  binding: ReplayGovernanceBinding;
  errors: readonly DeterministicReplayError[];
} {
  const request = input.request;
  const governanceValidated =
    input.metadata?.governanceDrift !== true
    && input.metadata?.governanceBypass !== true
    &&
    request.governanceSnapshotId === input.recommendationValidationResult.result.governanceSnapshotId
    && request.governanceSnapshotId === input.operatorAuthorityResult.action.governanceSnapshotId
    && input.constitutionalReplayResult.replayBinding.governanceBound
    && input.humanSupremacyResult.record.governanceBound;

  const binding = Object.freeze({
    governanceSnapshotId: request.governanceSnapshotId,
    governanceValidated,
    policySnapshotIds: Object.freeze([...request.policySnapshotIds]),
    validatorSnapshotIds: Object.freeze([...request.validatorSnapshotIds]),
    governanceHash: hashReplayValue("replay-governance-binding", {
      governanceSnapshotId: request.governanceSnapshotId,
      policySnapshotIds: request.policySnapshotIds,
      validatorSnapshotIds: request.validatorSnapshotIds,
      governanceValidated,
    }),
  }) satisfies ReplayGovernanceBinding;

  return Object.freeze({
    binding,
    errors: governanceValidated
      ? Object.freeze([])
      : Object.freeze([{
        code: "DETERMINISTIC_REPLAY_GOVERNANCE_MISMATCH" as const,
        message: "Replay governance binding diverged from historical governance truth.",
        path: "request.governanceSnapshotId",
      }]),
  });
}
