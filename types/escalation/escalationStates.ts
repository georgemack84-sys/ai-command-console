export type EscalationState =
  | "normal"
  | "review"
  | "restricted"
  | "paused"
  | "frozen"
  | "critical"
  | "fail_closed";

export type EscalationSeverity =
  | "low"
  | "moderate"
  | "high"
  | "severe"
  | "critical";
