import { classifyPlanRiskSeed } from "./validationPolicies";
import { classifyCumulativeRisk } from "./cumulativeRisk";
import type { ApprovalValidationResult, PlanStepDraft, PlannerToolRegistryEntry } from "./validationContracts";

export function classifyPlanRisk(input: {
  steps: readonly PlanStepDraft[];
  registry: Record<string, PlannerToolRegistryEntry>;
  approval: ApprovalValidationResult;
  governanceBlocked: boolean;
}) {
  const stepRisks = input.steps.map((step) => input.registry[step.tool]?.riskLevel ?? "critical");
  const containsExternalMutation = input.steps.some((step) => input.registry[step.tool]?.externalMutation);
  const containsDestructive = input.steps.some((step) => input.registry[step.tool]?.destructive);

  const baseRisk = classifyPlanRiskSeed({
    stepRisks,
    containsExternalMutation,
    containsDestructive,
    approvalRequired: input.approval.approvalRequired,
    governanceBlocked: input.governanceBlocked,
  });

  return classifyCumulativeRisk({
    steps: input.steps,
    registry: input.registry,
    baseRisk,
    governanceUncertain: input.governanceBlocked,
    approvalRequired: input.approval.approvalRequired,
  });
}
