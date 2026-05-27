export function resolveContractApprovalFlow(input: {
  approved: boolean;
  approvedBy?: string;
}) {
  return {
    required: true,
    approved: input.approved,
    approvedBy: input.approvedBy,
  };
}
