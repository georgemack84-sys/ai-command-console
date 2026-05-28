import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("execution compatibility red team", () => {
  it("blocks cross-tenant containment violation", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const compatibility = fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>;
    const approval = compatibility.approval as Record<string, unknown>;
    approval.scope = {
      actionScope: ["deploy"],
      resourceScope: ["cluster"],
      environmentScope: ["production"],
      tenantScope: ["dynamic-tenant"],
      toolScope: ["planner"],
    };

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_SCOPE_BOUNDARY_INVALID")).toBe(true);
  });
});
