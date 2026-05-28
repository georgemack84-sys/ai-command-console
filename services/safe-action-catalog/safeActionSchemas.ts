import type { SafeActionDefinition, SafeActionError } from "@/types/safe-action-catalog";

export function validateSafeActionDefinition(definition: SafeActionDefinition): readonly SafeActionError[] {
  const errors: SafeActionError[] = [];

  if (definition.executionAllowed) {
    errors.push({
      code: "SAFE_ACTION_EXECUTION_FORBIDDEN",
      message: "Safe action definitions may never permit execution.",
      path: "executionAllowed",
    });
  }
  if (definition.selfApprovalAllowed) {
    errors.push({
      code: "SAFE_ACTION_SELF_APPROVAL_FORBIDDEN",
      message: "Safe action definitions may never permit self-approval.",
      path: "selfApprovalAllowed",
    });
  }
  if (definition.policyMutationAllowed) {
    errors.push({
      code: "SAFE_ACTION_POLICY_MUTATION_FORBIDDEN",
      message: "Safe action definitions may never permit policy mutation.",
      path: "policyMutationAllowed",
    });
  }
  if (definition.mutating) {
    errors.push({
      code: "SAFE_ACTION_MUTATION_FORBIDDEN",
      message: "Safe action definitions must remain read-only.",
      path: "mutating",
    });
  }

  return Object.freeze(errors);
}
