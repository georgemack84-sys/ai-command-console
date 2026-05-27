export type StepStatus =
  | "planned"
  | "ready"
  | "staged"
  | "awaiting_review"
  | "approved"
  | "running"
  | "completed"
  | "failed"
  | "deferred"
  | "blocked"
  | "timeout";
