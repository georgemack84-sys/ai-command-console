import type { ApprovalDependencyGraphInput, ApprovalLifecycleError } from "@/types/approval-dependency-graph";

export function validateApprovalDependencySchema(input: ApprovalDependencyGraphInput): readonly ApprovalLifecycleError[] {
  const errors: ApprovalLifecycleError[] = [];
  if (!input.proposal.proposalId || !input.proposal.missionId || !input.generatedAt) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_SCHEMA_INVALID",
      message: "Proposal identity and generatedAt are required for approval graph derivation.",
      path: "input",
    });
  }
  return Object.freeze(errors);
}
