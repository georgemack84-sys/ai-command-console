import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "@/services/planning/dependencies";
import { validateGateInheritance } from "@/services/planning/dependencies/gate-inheritance-validator";

import { buildNormalizedPlan } from "./helpers";

describe("gate inheritance validator", () => {
  it("fails closed on approval bypass and missing preflight", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps[1] = {
      ...normalizedPlan.steps[1]!,
      approvalMode: "REQUIRED",
      inputs: {
        ...normalizedPlan.steps[1]!.inputs,
        isDestructive: true,
      },
    };

    const graph = buildDependencyGraph(normalizedPlan);
    const result = validateGateInheritance(normalizedPlan, graph);

    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "PLAN_APPROVAL_GATE_BYPASSED",
      "PLAN_PREFLIGHT_REQUIRED",
    ]));
  });
});
