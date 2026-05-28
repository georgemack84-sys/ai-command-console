import type { ApprovalConflictError, ApprovalConflictState } from "@/types/approval-conflict";

export function resolveApprovalConflictState(input: {
  errors: readonly ApprovalConflictError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): ApprovalConflictState {
  if (input.inheritedFailClosed || !input.governanceLinked || !input.replayDeterministic) {
    return "FAIL_CLOSED";
  }
  if (input.errors.some((item) =>
    item.code.includes("CIRCULAR")
    || item.code.includes("ISOLATION")
    || item.code.includes("RUNTIME")
    || item.code.includes("GOVERNANCE")
  )) {
    return "FAIL_CLOSED";
  }
  if (input.errors.length > 0) {
    return "ESCALATED";
  }
  return "SIMULATED";
}
