import type { ApprovalConflictAuthorityContract } from "@/types/approval-conflict";

export function buildApprovalConflictAuthorityContract(): ApprovalConflictAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    workflowContinuation: false,
  });
}
