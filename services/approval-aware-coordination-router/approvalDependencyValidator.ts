import type { ApprovalAwareRoutingInput } from "@/types/approval-aware-coordination-router";

export function validateApprovalDependency(input: ApprovalAwareRoutingInput): readonly string[] {
  const errors: string[] = [];
  if (!input.approvalState.explicit) {
    errors.push("approval:not-explicit");
  }
  if (!input.approvalState.valid) {
    errors.push("approval:invalid");
  }
  if (input.approvalState.status !== "approved") {
    errors.push(`approval-status:${input.approvalState.status}`);
  }
  if (!input.approvalState.scopeHash) {
    errors.push("approval:missing-scope");
  }
  if (!input.approvalState.governanceDecisionHash) {
    errors.push("approval:missing-governance-hash");
  }
  return Object.freeze(errors);
}
