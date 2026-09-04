import type { StrategyBudget, StrategyDefinition, StrategyEligibility } from "../../types/learning-constitution/strategyRegistry";

/** Filters strategies against stated context, prerequisites, resources, and governance before any advisory ranking occurs. */
export class StrategyEligibilityService {
  assess(input: Readonly<{ strategy: StrategyDefinition; context: StrategyDefinition["applicableContexts"][number]; establishedPrerequisites: readonly string[]; budget: StrategyBudget; requiredResources: readonly string[]; availableResources: readonly string[] }>): StrategyEligibility {
    const reasons: string[] = [];
    if (input.strategy.lifecycle !== "ACTIVE") reasons.push("STRATEGY_NOT_ACTIVE");
    if (!input.strategy.applicableContexts.includes(input.context)) reasons.push("CONTEXT_INCOMPATIBLE");
    const unmetPrerequisites = input.strategy.prerequisites.filter((item) => !input.establishedPrerequisites.includes(item));
    if (unmetPrerequisites.length) reasons.push("PREREQUISITES_UNMET");
    if (input.requiredResources.some((item) => !input.availableResources.includes(item))) reasons.push("RESOURCES_UNAVAILABLE");
    const estimatedMinutes = value(input.strategy, "timeMinutes"); const estimatedTokens = value(input.strategy, "tokenBudget"); const teacherRequired = input.strategy.parameters.some((item) => item.name === "teacherRequired" && item.value === true);
    const budgetFit = (estimatedMinutes === null || estimatedMinutes <= input.budget.timeMinutes) && (estimatedTokens === null || estimatedTokens <= input.budget.tokenBudget) && (!teacherRequired || input.budget.teacherAvailability !== "NONE");
    if (!budgetFit) reasons.push("BUDGET_OR_TEACHER_CONSTRAINT");
    const governanceFit = input.strategy.learningEffect === "NONE" && input.strategy.authorityEffect === "UNCHANGED" && !input.strategy.executionPermissionGranted;
    if (!governanceFit) reasons.push("CONSTITUTIONAL_BOUNDARY_FAILURE");
    return { strategyId: input.strategy.strategyId, eligible: !reasons.length, reasons, unmetPrerequisites, budgetFit, governanceFit, projectionOnly: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
  }
}
const value = (strategy: StrategyDefinition, name: string): number | null => { const item = strategy.parameters.find((candidate) => candidate.name === name); return item && typeof item.value === "number" ? item.value : null; };
