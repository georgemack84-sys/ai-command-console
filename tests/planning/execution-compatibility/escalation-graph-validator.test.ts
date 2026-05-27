import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("escalation graph validator", () => {
  it("blocks cyclic escalation graph", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const first = fixture.normalizedPlan.steps[0]!.inputs.compatibility as Record<string, unknown>;
    const second = fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>;
    first.escalation = { targets: ["step-validate"], terminal: false };
    second.escalation = { targets: ["step-read"], terminal: false };

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_ESCALATION_GRAPH_INVALID")).toBe(true);
  });
});
