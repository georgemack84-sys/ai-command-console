export type ProposalState =
  | "draft"
  | "validated"
  | "governance_review"
  | "approved"
  | "denied"
  | "prepared_handoff"
  | "archived"
  | "revoked";

export type ProposalTransition =
  | "validate"
  | "submit_governance_review"
  | "approve"
  | "deny"
  | "prepare_handoff"
  | "archive"
  | "revoke";
