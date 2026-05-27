import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "@/tests/planning/execution-compatibility/helpers";

export function buildReplayAuditFixture() {
  const compatibilityFixture = buildExecutionCompatibilityFixture();
  const compatibility = validateExecutionCompatibility({
    executionTruthHash: compatibilityFixture.executionTruthPackage.executionTruthHash,
    normalizedPlan: compatibilityFixture.normalizedPlan,
    executionTruth: compatibilityFixture.executionTruthPackage,
    dependencyValidation: compatibilityFixture.dependencyValidation,
  });
  if (!compatibility.ok) {
    throw new Error("Expected execution compatibility fixture to validate.");
  }

  return {
    normalizedPlan: structuredClone(compatibilityFixture.normalizedPlan),
    executionTruthPackage: structuredClone(compatibilityFixture.executionTruthPackage),
    executionCompatibilityContract: structuredClone(compatibility.contract),
  };
}
