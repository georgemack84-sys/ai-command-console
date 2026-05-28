export type GovernanceDriftState =
  | "PENDING"
  | "VALIDATING"
  | "SIMULATED"
  | "ESCALATED"
  | "CONDITIONALLY_BLOCKED"
  | "FAIL_CLOSED";

export type GovernanceDriftCategory =
  | "GOVERNANCE_DRIFT"
  | "REPLAY_DRIFT"
  | "CONFIDENCE_DRIFT"
  | "ESCALATION_DRIFT"
  | "DEPENDENCY_DRIFT"
  | "RECOMMENDATION_DRIFT";
