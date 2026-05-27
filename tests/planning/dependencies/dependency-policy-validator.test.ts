import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "@/services/planning/dependencies";
import { validateDependencyPolicies } from "@/services/planning/dependencies/dependency-policy-validator";

import { buildNormalizedPlan } from "./helpers";

describe("dependency policy validator", () => {
  it("fails closed on production mutation without approval, destructive action without preflight, and missing idempotency", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps[1] = {
      ...normalizedPlan.steps[1]!,
      inputs: {
        ...normalizedPlan.steps[1]!.inputs,
        targetEnvironment: "production",
        isDestructive: true,
        hasExternalSideEffect: true,
      },
    };

    const graph = buildDependencyGraph(normalizedPlan);
    const result = validateDependencyPolicies(normalizedPlan, graph);

    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "PLAN_APPROVAL_GATE_BYPASSED",
      "PLAN_PREFLIGHT_REQUIRED",
      "PLAN_DEPENDENCY_POLICY_VIOLATION",
    ]));
  });
});
