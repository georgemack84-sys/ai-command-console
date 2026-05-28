export type ApprovalInheritanceRecord = Readonly<{
  inheritanceId: string;
  sourceApprovalId: string;
  targetApprovalId: string;
  inherited: boolean;
  valid: boolean;
  reason: string;
  immutableHash: string;
}>;
