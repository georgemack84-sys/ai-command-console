import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("compensation validator", () => {
  it("fails closed when irreversible action lacks compensation", () => {
    const fixture = buildExecutionCompatibilityFixture();
    fixture.normalizedPlan.steps[1]!.inputs.irreversible = true;
    const compatibility = fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>;
    compatibility.compensation = {
      irreversible: true,
      requiresApproval: true,
    };

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_COMPENSATION_REQUIRED")).toBe(true);
  });
});
