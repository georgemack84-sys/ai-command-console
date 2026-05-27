import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("rollback contract normalizer", () => {
  it("fails closed when rollback contract is missing for mutation", () => {
    const fixture = buildExecutionCompatibilityFixture();
    fixture.normalizedPlan.steps[1]!.inputs.isDestructive = true;
    const compatibility = fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>;
    delete compatibility.rollback;

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_ROLLBACK_CONTRACT_MISSING")).toBe(true);
  });
});
