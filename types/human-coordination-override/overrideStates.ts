export type CoordinationOverrideType =
  | "pause"
  | "deny"
  | "freeze"
  | "revoke";

export type HumanCoordinationOverrideState =
  | "paused"
  | "denied"
  | "frozen"
  | "revoked"
  | "fail_closed";

export type OverrideAuditEventType =
  | "coordination.paused"
  | "coordination.denied"
  | "routing.revoked"
  | "orchestration.frozen"
  | "override.reviewed"
  | "override.replayed"
  | "escalation.inspected"
  | "governance.audit.performed";
