import { buildCanonicalPlan } from "@/tests/planning/validation/helpers";
import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

export function buildValidatedNormalizationInput() {
  const validatedPlan = buildCanonicalPlan();
  const validationResult = validatePlanStructure(validatedPlan);

  if (!validationResult.ok) {
    throw new Error("Expected helper plan to pass structural validation.");
  }

  return {
    validatedPlan,
    validationResult,
    replaySnapshot: validationResult.evidence.replaySnapshot,
    graphHash: validationResult.graphHash,
    validationHash: validationResult.validationHash,
    normalizationVersion: "4.2C",
  };
}

