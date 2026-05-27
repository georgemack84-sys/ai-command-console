export type ApprovalConflictState =
  | "PENDING"
  | "VALIDATING"
  | "SIMULATED"
  | "ESCALATED"
  | "CONDITIONALLY_BLOCKED"
  | "FAIL_CLOSED";

export type ApprovalConflictWeaknessSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "CONSTITUTIONAL_BLOCKER";
