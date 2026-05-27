import type { PrioritizationError, RecommendationPriorityInput } from "./types/prioritizationTypes";

const FORBIDDEN_TERMS = [
  "execute",
  "dispatch",
  "schedule",
  "approve automatically",
  "revoke automatically",
  "mutate runtime",
  "call worker",
  "call queue",
  "invoke orchestrator",
  "trigger adapter",
  "create cron",
  "register future action",
];

export function detectPrioritizationHiddenExecution(input: RecommendationPriorityInput): PrioritizationError[] {
  const haystack = [
    input.confidenceLevel,
    input.uncertaintyLevel,
    input.approvalDependencyState,
    input.operatorVisibilityRequirement,
  ].join(" ").toLowerCase();
  const errors: PrioritizationError[] = [];
  for (const term of FORBIDDEN_TERMS) {
    if (haystack.includes(term)) {
      errors.push({
        code: term.includes("schedule") || term.includes("cron")
          ? "PRIORITIZATION_SCHEDULER_REFERENCE"
          : term.includes("mutate runtime")
            ? "PRIORITIZATION_RUNTIME_MUTATOR_REFERENCE"
            : term.includes("orchestrator") || term.includes("worker") || term.includes("queue") || term.includes("adapter")
              ? "PRIORITIZATION_ORCHESTRATION_REFERENCE"
              : "PRIORITIZATION_HIDDEN_EXECUTION",
        message: `Forbidden execution-adjacent prioritization term detected: ${term}.`,
        path: `inputs.${input.recommendationId}`,
      });
    }
  }
  return errors;
}
