export const RECOVERY_ACTION_TYPES = [
  "replay",
  "reassignment",
  "escalation",
  "rollback",
  "pause",
  "quarantine",
  "operator_intervention",
  "terminate",
  "retry",
  "controlled_continuation",
] as const;

export type RecoveryActionType = (typeof RECOVERY_ACTION_TYPES)[number];
