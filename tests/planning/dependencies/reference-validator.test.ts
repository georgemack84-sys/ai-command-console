import { describe, expect, it } from "vitest";

import { validateDependencyReferences } from "@/services/planning/dependencies/reference-validator";

import { buildNormalizedPlan } from "./helpers";

describe("reference validator", () => {
  it("fails closed on missing dependency, duplicate id, self dependency, and duplicate dependency", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps.push({ ...normalizedPlan.steps[1]!, id: normalizedPlan.steps[0]!.id, sourceId: "dup", index: 2 });
    normalizedPlan.steps[1] = {
      ...normalizedPlan.steps[1]!,
      dependencies: [normalizedPlan.steps[1]!.id, "missing-step", normalizedPlan.steps[0]!.id, normalizedPlan.steps[0]!.id],
    };

    const result = validateDependencyReferences(normalizedPlan);
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "PLAN_DUPLICATE_STEP_ID",
      "PLAN_SELF_DEPENDENCY_BLOCKED",
      "PLAN_DEPENDENCY_REFERENCE_NOT_FOUND",
      "PLAN_DUPLICATE_DEPENDENCY_FOUND",
    ]));
  });
});
