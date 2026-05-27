export type AuditOutcomeState =
  | "approved"
  | "denied"
  | "frozen"
  | "revoked"
  | "superseded"
  | "expired"
  | "escalated"
  | "archived";

export type AuditOutcome = Readonly<{
  outcomeId: string;
  state: AuditOutcomeState;
  summary: string;
  evidenceHashes: readonly string[];
  createdAt: string;
}>;
