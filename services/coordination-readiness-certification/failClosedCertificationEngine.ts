import type { CoordinationReadinessCertificationError, CoordinationReadinessCertificationState } from "@/types/coordination-readiness-certification";

export function resolveCoordinationReadinessState(input: {
  errors: readonly CoordinationReadinessCertificationError[];
  replaySafe: boolean;
  governanceLinked: boolean;
}): CoordinationReadinessCertificationState {
  if (input.errors.some((item) =>
    item.code.includes("HIDDEN_EXECUTION")
    || item.code.includes("HIDDEN_SCHEDULING")
    || item.code.includes("RECURSIVE_ORCHESTRATION")
    || item.code.includes("AUTHORITY_EXPANSION")
    || item.code.includes("REPLAY")
    || item.code.includes("GOVERNANCE")
    || item.code.includes("FAIL_CLOSED"))) {
    return "FAIL_CLOSED";
  }
  if (!input.governanceLinked || !input.replaySafe) {
    return "CONDITIONALLY_BLOCKED";
  }
  if (input.errors.length > 0) {
    return "ESCALATED";
  }
  return "CERTIFIED";
}
