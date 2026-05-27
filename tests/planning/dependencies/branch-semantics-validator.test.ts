import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "@/services/planning/dependencies";
import { validateBranchSemantics } from "@/services/planning/dependencies/branch-semantics-validator";

import { buildNormalizedPlan } from "./helpers";

describe("branch semantics validator", () => {
  it("fails closed on rollback and failure branches reused as success path", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps[0] = {
      ...normalizedPlan.steps[0]!,
      inputs: { ...normalizedPlan.steps[0]!.inputs, branchType: "rollback" },
    };

    const graph = buildDependencyGraph(normalizedPlan);
    const result = validateBranchSemantics(normalizedPlan, graph);

    expect(result.errors[0]?.code).toBe("PLAN_ROLLBACK_ORDER_INVALID");
  });
});
