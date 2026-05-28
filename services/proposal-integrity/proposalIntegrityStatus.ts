export type ProposalIntegrityStatus =
  | "draft"
  | "validating"
  | "sealed"
  | "replay_verified"
  | "replay_failed"
  | "frozen"
  | "revoked"
  | "superseded";
