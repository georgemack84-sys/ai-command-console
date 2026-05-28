import { describe, expect, it } from "vitest";

import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("authority graph validator", () => {
  it("blocks rollback governance weaker than forward", () => {
    const fixture = buildExecutionCompatibilityFixture();
    fixture.normalizedPlan.steps[1]!.inputs.isDestructive = true;
    const compatibility = fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>;
    compatibility.rollback = {
      required: true,
      checkpointRequired: true,
      compensationRequired: true,
    };
    compatibility.approval = {
      required: false,
      requiredRole: "operator",
      scope: {
        actionScope: ["deploy"],
        resourceScope: ["service"],
        environmentScope: ["local"],
        tenantScope: ["single-tenant"],
        toolScope: ["planner"],
      },
    };

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_ROLLBACK_GOVERNANCE_WEAKER_THAN_FORWARD")).toBe(true);
  });

  it("blocks cyclic authority graph", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const first = fixture.normalizedPlan.steps[0]!.inputs.compatibility as Record<string, unknown>;
    const second = fixture.normalizedPlan.steps[1]!.inputs.compatibility as Record<string, unknown>;
    first.authority = { parents: ["step-validate"] };
    second.authority = { parents: ["step-read"] };
    const firstApproval = first.approval as Record<string, unknown>;
    firstApproval.scope = {
      actionScope: ["read-config"],
      resourceScope: ["service:config"],
      environmentScope: ["local", "staging"],
      tenantScope: ["single-tenant"],
      toolScope: ["planner"],
    };
    const secondApproval = second.approval as Record<string, unknown>;
    secondApproval.scope = {
      actionScope: ["validate-config"],
      resourceScope: ["service:config"],
      environmentScope: ["production"],
      tenantScope: ["single-tenant"],
      toolScope: ["planner"],
    };

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((violation) => violation.code === "PLAN_AUTHORITY_GRAPH_INVALID")).toBe(true);
  });
});
