import { dedupeReasons } from "./validationPolicies";
import type { ApprovalValidationResult, PlanStepDraft, PlannerToolRegistryEntry } from "./validationContracts";

export function validateApprovalRequirements(input: {
  steps: readonly PlanStepDraft[];
  registry: Record<string, PlannerToolRegistryEntry>;
}) : ApprovalValidationResult {
  const reasons: string[] = [];
  const approvalSteps: string[] = [];

  for (const step of input.steps) {
    const entry = input.registry[step.tool];
    if (!entry) {
      continue;
    }
    if (step.safety.requiresApproval || entry.requiresApproval) {
      approvalSteps.push(step.id);
      reasons.push(`approval_required:${step.id}`);
    }
    if (entry.destructive) {
      reasons.push(`destructive_operation:${step.id}`);
    }
    if (entry.externalMutation) {
      reasons.push(`external_mutation:${step.id}`);
    }
    if (entry.privileged) {
      reasons.push(`privileged_action:${step.id}`);
    }
  }

  return {
    approvalRequired: approvalSteps.length > 0,
    blocking: approvalSteps.length > 0,
    approvalReasons: dedupeReasons(reasons),
    approvalSteps: Array.from(new Set(approvalSteps)).sort(),
  };
}
