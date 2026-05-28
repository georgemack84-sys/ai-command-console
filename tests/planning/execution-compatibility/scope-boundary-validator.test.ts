import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("scope boundary validator", () => {
  it("blocks wildcard scope", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const compatibility = fixture.normalizedPlan.steps[0]!.inputs.compatibility as Record<string, unknown>;
    const approval = compatibility.approval as Record<string, unknown>;
    const scope = approval.scope as Record<string, unknown>;
    scope.resourceScope = ["*"];

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_SCOPE_BOUNDARY_INVALID")).toBe(true);
  });

  it("blocks dynamic tenant scope", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const compatibility = fixture.normalizedPlan.steps[0]!.inputs.compatibility as Record<string, unknown>;
    const approval = compatibility.approval as Record<string, unknown>;
    const scope = approval.scope as Record<string, unknown>;
    scope.tenantScope = ["${tenantId}"];

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
