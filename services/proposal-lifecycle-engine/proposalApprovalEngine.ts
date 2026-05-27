import type { ProposalApproval, ProposalLifecycleError } from "@/types/proposal-lifecycle-engine";

export function evaluateProposalApproval(input: {
  approval?: ProposalApproval;
  governanceDecisionHash: string;
  timestamp: string;
}): { approval: ProposalApproval; errors: readonly ProposalLifecycleError[] } {
  if (!input.approval) {
    return {
      approval: Object.freeze({
        approvalId: "approval-required",
        status: "required",
        explicit: false,
        approvers: Object.freeze([]),
        scopeHash: "",
        governanceDecisionHash: input.governanceDecisionHash,
        valid: false,
      }),
      errors: Object.freeze([]),
    };
  }

  const expired = Boolean(input.approval.expiresAt && input.approval.expiresAt < input.timestamp);
  const approval = Object.freeze({
    ...input.approval,
    status: expired ? "expired" as const : input.approval.status,
    valid: input.approval.explicit && input.approval.status === "approved" && !expired,
  });

  const errors: ProposalLifecycleError[] = [];
  if (expired) {
    errors.push({
      code: "PROPOSAL_APPROVAL_EXPIRED",
      message: "Proposal approval has expired.",
      path: "approval.expiresAt",
    });
  }

  return {
    approval,
    errors: Object.freeze(errors),
  };
}
