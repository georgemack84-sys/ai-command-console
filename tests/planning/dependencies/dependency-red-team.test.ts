import { describe, expect, it } from "vitest";

import { validateSequentialDependencies } from "@/services/planning/dependencies";

import { buildNormalizedPlan } from "./helpers";

describe("dependency red team", () => {
  it("fails closed on hidden dependency injection, failure-branch misuse, and missing external side-effect metadata", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps[1] = {
      ...normalizedPlan.steps[1]!,
      inputs: {
        ...normalizedPlan.steps[1]!.inputs,
        dynamicDependencyRef: "${runtime.jump}",
        branchType: "failure",
        hasExternalSideEffect: true,
      },
    };
    normalizedPlan.steps.push({
      ...normalizedPlan.steps[1]!,
      id: "step-followup",
      sourceId: "step-followup",
      index: 2,
      inputs: {},
      dependencies: [normalizedPlan.steps[1]!.id],
      hash: `${normalizedPlan.steps[1]!.hash}-followup`,
    });

    const result = validateSequentialDependencies(normalizedPlan);

    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "PLAN_FAILURE_BRANCH_USED_AS_SUCCESS_PATH",
      "PLAN_DEPENDENCY_POLICY_VIOLATION",
    ]));
  });
});
