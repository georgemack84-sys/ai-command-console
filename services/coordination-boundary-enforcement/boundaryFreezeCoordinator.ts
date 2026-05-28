import type {
  CoordinationBoundaryState,
  CoordinationBoundaryVerdict,
} from "@/types/coordination-boundary-enforcement";

export function resolveBoundaryVerdict(input: {
  hasExecution: boolean;
  hasRecursive: boolean;
  hasScheduling: boolean;
  hasAuthorityExpansion: boolean;
  hasReplayBreak: boolean;
  hasGovernanceGap: boolean;
  hasDrift: boolean;
  failClosed: boolean;
}): CoordinationBoundaryVerdict {
  if (input.hasExecution) {
    return "INVALID_EXECUTION_SEMANTICS";
  }
  if (input.hasRecursive) {
    return "INVALID_RECURSIVE_ORCHESTRATION";
  }
  if (input.hasScheduling) {
    return "INVALID_HIDDEN_SCHEDULING";
  }
  if (input.hasAuthorityExpansion) {
    return "INVALID_AUTHORITY_EXPANSION";
  }
  if (input.hasReplayBreak) {
    return "INVALID_REPLAY_LINEAGE";
  }
  if (input.hasGovernanceGap) {
    return "INVALID_GOVERNANCE_LINKAGE";
  }
  if (input.hasDrift) {
    return "INVALID_ORCHESTRATION_DRIFT";
  }
  if (input.failClosed) {
    return "FAIL_CLOSED";
  }
  return "VALID_BOUND_COORDINATION";
}

export function resolveBoundaryState(input: {
  verdict: CoordinationBoundaryVerdict;
  inheritedContainment: string;
}): CoordinationBoundaryState {
  if (input.verdict === "FAIL_CLOSED") {
    return "fail_closed";
  }
  if (input.inheritedContainment === "frozen" || input.inheritedContainment === "blocked" || input.inheritedContainment === "disputed") {
    return "frozen";
  }
  if (input.verdict === "VALID_BOUND_COORDINATION") {
    return input.inheritedContainment === "restricted" ? "restricted" : "bounded";
  }
  if (input.verdict === "INVALID_GOVERNANCE_LINKAGE" || input.verdict === "INVALID_REPLAY_LINEAGE") {
    return "fail_closed";
  }
  return "frozen";
}
