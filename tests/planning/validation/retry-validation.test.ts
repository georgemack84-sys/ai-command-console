import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("retry validation", () => {
  it("rejects an infinite retry topology", () => {
    const plan = buildCanonicalPlan({
      execution: {
        ...buildCanonicalPlan().execution,
        retryPolicy: {
          maxAttempts: 999,
          backoffMs: 1000,
        },
      },
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_RETRY_LOOP")).toBe(true);
  });

  it("rejects a retry loop", () => {
    const plan = buildCanonicalPlan();
    plan.steps[1].action.parameters = {
      retryTargetStepId: "step-b",
    };

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_RETRY_LOOP")).toBe(true);
  });
});

