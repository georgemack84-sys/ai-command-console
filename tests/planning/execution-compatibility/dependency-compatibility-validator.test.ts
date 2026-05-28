import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("dependency compatibility validator", () => {
  it("blocks rollback dependency conflict", () => {
    const fixture = buildExecutionCompatibilityFixture();
    fixture.normalizedPlan.steps[0]!.inputs.isDestructive = true;
    fixture.normalizedPlan.steps[1]!.inputs.isDestructive = true;

    (fixture.normalizedPlan.steps[0]!.inputs.compatibility as Record<string, unknown>).rollback = {
      required: true,
      rollbackOrder: 0,
      checkpointRequired: true,
      compensationRequired: false,
    };
    (fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>).rollback = {
      required: true,
      rollbackOrder: 1,
      checkpointRequired: true,
      compensationRequired: false,
    };

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_ROLLBACK_DEPENDENCY_CONFLICT")).toBe(true);
  });
});
