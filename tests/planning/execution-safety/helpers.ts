import { buildSafeExecutionTruthPlan } from "@/tests/planning/execution-truth/helpers";
import { validateExecutionTruth } from "@/services/planning/execution-truth";

export function buildExecutionSafetyFixture() {
  const normalizedPlan = buildSafeExecutionTruthPlan();
  const truth = validateExecutionTruth(normalizedPlan);
  if (!truth.ok) {
    throw new Error("Expected execution truth fixture to validate.");
  }

  return {
    normalizedPlan: JSON.parse(JSON.stringify(normalizedPlan)),
    executionTruthPackage: JSON.parse(JSON.stringify(truth.executionTruthPackage)),
  };
}
