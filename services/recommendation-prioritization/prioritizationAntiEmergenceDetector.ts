import type { PrioritizationError, RecommendationPriorityInput } from "./types/prioritizationTypes";

export function detectPrioritizationAntiEmergence(input: RecommendationPriorityInput): PrioritizationError[] {
  const errors: PrioritizationError[] = [];
  const haystack = [
    input.confidenceLevel,
    input.uncertaintyLevel,
    input.approvalDependencyState,
    input.operatorVisibilityRequirement,
  ].join(" ").toLowerCase();

  if (haystack.includes("approval") && haystack.includes("automatic")) {
    errors.push({
      code: "PRIORITIZATION_ANTI_EMERGENCE",
      message: "Priority may not imply automatic approval.",
      path: `inputs.${input.recommendationId}`,
    });
  }
  if (haystack.includes("permission") || haystack.includes("authorize")) {
    errors.push({
      code: "PRIORITIZATION_AUTHORITY_EXPANSION",
      message: "Priority may not be coupled to authority, permission, or authorization.",
      path: `inputs.${input.recommendationId}`,
    });
  }
  if (haystack.includes("self-priorit")) {
    errors.push({
      code: "PRIORITIZATION_ANTI_EMERGENCE",
      message: "Recursive self-prioritization is forbidden.",
      path: `inputs.${input.recommendationId}`,
    });
  }
  if (haystack.includes("capability") && haystack.includes("expand")) {
    errors.push({
      code: "PRIORITIZATION_ANTI_EMERGENCE",
      message: "Dynamic capability expansion is forbidden.",
      path: `inputs.${input.recommendationId}`,
    });
  }

  return errors;
}
