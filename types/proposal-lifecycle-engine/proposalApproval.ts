export type ProposalApprovalStatus =
  | "required"
  | "approved"
  | "expired"
  | "denied"
  | "revoked";

export type ProposalApproval = Readonly<{
  approvalId: string;
  status: ProposalApprovalStatus;
  explicit: boolean;
  approvers: readonly string[];
  approvedAt?: string;
  expiresAt?: string;
  scopeHash: string;
  governanceDecisionHash: string;
  valid: boolean;
}>;
