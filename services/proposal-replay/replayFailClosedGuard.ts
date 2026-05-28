import type { ProposalReplayError, ProposalReplayResult, ProposalReplayStatus } from "./replayTypes";

export function resolveProposalReplayStatus(input: {
  errors: readonly ProposalReplayError[];
}): ProposalReplayStatus {
  if (input.errors.some((error) => (
    error.code === "PROPOSAL_REPLAY_FAIL_CLOSED"
    || error.code === "PROPOSAL_REPLAY_MISSING_PROPOSAL_SNAPSHOT"
    || error.code === "PROPOSAL_REPLAY_MISSING_GOVERNANCE_SNAPSHOT"
    || error.code === "PROPOSAL_REPLAY_MISSING_POLICY_SNAPSHOT"
    || error.code === "PROPOSAL_REPLAY_MISSING_REPLAY_CONTRACT"
    || error.code === "PROPOSAL_REPLAY_VALIDATOR_VERSION_UNAVAILABLE"
    || error.code === "PROPOSAL_REPLAY_DETERMINISM_UNPROVEN"
    || error.code === "PROPOSAL_REPLAY_DEPENDENCY_SNAPSHOT_MISSING"
    || error.code === "PROPOSAL_REPLAY_APPROVAL_SNAPSHOT_MISSING"
    || error.code === "PROPOSAL_REPLAY_AUTHORITY_SNAPSHOT_MISSING"
  ))) {
    return "FAILED_CLOSED";
  }

  if (
    input.errors.some((error) => (
      error.code === "PROPOSAL_REPLAY_FROZEN"
      || error.code === "PROPOSAL_REPLAY_REVOKED"
      || error.code === "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH"
      || error.code === "PROPOSAL_REPLAY_VALIDATOR_MISMATCH"
      || error.code === "PROPOSAL_REPLAY_DEPENDENCY_MISMATCH"
      || error.code === "PROPOSAL_REPLAY_APPROVAL_MISMATCH"
      || error.code === "PROPOSAL_REPLAY_AUTHORITY_MISMATCH"
      || error.code === "PROPOSAL_REPLAY_AUDIT_HASH_MISMATCH"
    ))
  ) {
    return "FROZEN";
  }

  if (input.errors.length > 0) {
    return "FAILED_CLOSED";
  }

  return "COMPLETED";
}

export function replayStatusAllowsDeterministicTruth(status: ProposalReplayResult["status"]): boolean {
  return status === "COMPLETED" || status === "FROZEN";
}
