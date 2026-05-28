import type { PlanStepDraft, PlannerToolRegistryEntry, PlanStepRisk } from "./validationContracts";

const ORDER: PlanStepRisk[] = ["low", "medium", "high", "critical"];

function maxRisk(left: PlanStepRisk, right: PlanStepRisk): PlanStepRisk {
  return ORDER[Math.max(ORDER.indexOf(left), ORDER.indexOf(right))] ?? "critical";
}

export function classifyCumulativeRisk(input: {
  steps: readonly PlanStepDraft[];
  registry: Record<string, PlannerToolRegistryEntry>;
  baseRisk: PlanStepRisk;
  governanceUncertain: boolean;
  approvalRequired: boolean;
}) {
  let risk = input.baseRisk;
  const mediumMutationSteps = input.steps.filter((step) => {
    const entry = input.registry[step.tool];
    return entry?.riskLevel === "medium" && entry.externalMutation;
  }).length;
  const highRiskSteps = input.steps.filter((step) => input.registry[step.tool]?.riskLevel === "high").length;
  const hasDestructive = input.steps.some((step) => input.registry[step.tool]?.destructive);
  const hasExternalMutation = input.steps.some((step) => input.registry[step.tool]?.externalMutation);

  if (mediumMutationSteps >= 2) {
    risk = maxRisk(risk, "high");
  }
  if (highRiskSteps >= 2) {
    risk = maxRisk(risk, "critical");
  }
  if (hasDestructive && hasExternalMutation) {
    risk = "critical";
  }
  if (input.governanceUncertain) {
    risk = "critical";
  }
  if (input.approvalRequired && hasExternalMutation) {
    risk = maxRisk(risk, "high");
  }

  return risk;
}
