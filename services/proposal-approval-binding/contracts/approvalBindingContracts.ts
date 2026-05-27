export const APPROVAL_AUDIT_EVENT_TYPES = Object.freeze([
  "approval.bound",
  "approval.validated",
  "approval.invalidated",
  "approval.revoked",
  "approval.replayed",
  "approval.rejected",
  "override.bound",
  "override.replayed",
  "override.escalated",
  "admissibility.denied",
  "replay.rejected",
] as const);

export const APPROVAL_BINDING_CONTAINMENT_TERMS = Object.freeze([
  "execute",
  "execution",
  "schedule",
  "scheduler",
  "orchestration",
  "orchestrate",
  "runtime.mutate",
  "mutation",
  "escalate",
  "authority",
] as const);
