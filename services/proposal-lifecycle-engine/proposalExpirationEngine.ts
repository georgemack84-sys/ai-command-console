import type { ProposalApproval } from "@/types/proposal-lifecycle-engine";

export function isProposalApprovalExpired(approval: ProposalApproval, timestamp: string): boolean {
  return Boolean(approval.expiresAt && approval.expiresAt < timestamp);
}
