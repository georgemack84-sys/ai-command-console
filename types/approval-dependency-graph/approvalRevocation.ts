export type ApprovalRevocationPropagation = Readonly<{
  propagationId: string;
  sourceApprovalId: string;
  affectedApprovalIds: readonly string[];
  revokedAt?: string;
  valid: boolean;
  immutableHash: string;
}>;
