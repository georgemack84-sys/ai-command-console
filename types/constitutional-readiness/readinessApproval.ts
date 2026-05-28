export type ApprovalReadinessRecord = Readonly<{
  readinessId: string;
  approvalInstabilityScore: number;
  approvalDeterministic: boolean;
  verificationHash: string;
}>;
