export type CoordinationState =
  | "proposed"
  | "validated"
  | "governed"
  | "bounded"
  | "reviewed"
  | "escalated"
  | "frozen"
  | "revoked"
  | "archived";

export type CoordinationTransition =
  | "validate"
  | "govern"
  | "bound"
  | "review"
  | "escalate"
  | "freeze"
  | "revoke"
  | "archive";
