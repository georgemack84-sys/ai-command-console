export type CoordinationReadinessCertificationState =
  | "PENDING"
  | "VALIDATING"
  | "CERTIFIED"
  | "ESCALATED"
  | "CONDITIONALLY_BLOCKED"
  | "FAIL_CLOSED";
