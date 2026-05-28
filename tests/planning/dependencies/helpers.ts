import { normalizeValidatedPlan } from "@/services/planning/normalization";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";
import type { CanonicalPlan } from "@/services/planning/contracts/plan-types";
import { buildCanonicalPlan } from "@/tests/planning/validation/helpers";

export function buildNormalizedPlan(planOverrides: Partial<CanonicalPlan> = {}) {
  const plan = buildCanonicalPlan(planOverrides);
  const validationResult = validatePlanStructure(plan);

  if (!validationResult.ok) {
    throw new Error(`Expected helper plan to pass structural validation, got ${validationResult.errors.map((error) => error.code).join(", ")}`);
  }

  const normalized = normalizeValidatedPlan({
    validatedPlan: plan,
    validationResult,
    replaySnapshot: validationResult.evidence.replaySnapshot,
    graphHash: validationResult.graphHash,
    validationHash: validationResult.validationHash,
    normalizationVersion: "4.2C",
  });

  if (!normalized.ok) {
    throw new Error(`Expected helper plan to normalize, got ${normalized.error.code}`);
  }

  return JSON.parse(JSON.stringify(normalized.normalizedPlan));
}
