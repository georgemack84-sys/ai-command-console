export type RecommendationIntegrityState =
  | "PENDING"
  | "VALIDATING"
  | "SIMULATED"
  | "ESCALATED"
  | "CONDITIONALLY_BLOCKED"
  | "FAIL_CLOSED";

export type RecommendationWeaknessSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "CONSTITUTIONAL_BLOCKER";
