import type {
  ApprovalRevocation,
  OperatorOverrideBinding,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function propagateApprovalRevocation(
  input: ProposalApprovalBindingInput,
  overrideBinding?: OperatorOverrideBinding,
): ApprovalRevocation | undefined {
  const revoked = input.proposalRevocationResult.status === "REVOKED"
    || input.proposalRevocationResult.status === "CASCADE_IN_PROGRESS"
    || input.proposalRevocationResult.status === "CASCADE_COMPLETED"
    || overrideBinding?.disposition === "REVOKE";

  if (!revoked) {
    return undefined;
  }

  const revocationCore = {
    revocationId: `approval-revocation:${input.proposalIntegrityResult.proposal.proposalId}:${hashApprovalValue("approval-revocation-id", {
      proposalId: input.proposalIntegrityResult.proposal.proposalId,
      revocationId: input.proposalRevocationResult.revocationId,
      overrideId: overrideBinding?.overrideBindingId ?? null,
    }).slice(0, 12)}`,
    proposalId: input.proposalIntegrityResult.proposal.proposalId,
    revokedApprovalIds: Object.freeze(input.approvals.map((approval) => approval.approvalId)),
    propagatedFromProposalRevocationId: input.proposalRevocationResult.revocationId,
    reason: overrideBinding?.disposition === "REVOKE"
      ? `OPERATOR_OVERRIDE:${overrideBinding.reason}`
      : input.proposalRevocationResult.request.revocationReason,
    revokedAt: input.evaluatedAt,
    immutable: true as const,
  };

  return Object.freeze({
    ...revocationCore,
    revocationHash: hashApprovalValue("approval-revocation", revocationCore),
  });
}
