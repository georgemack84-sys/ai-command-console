import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "@/services/planning/dependencies";
import { detectDependencyCycles } from "@/services/planning/dependencies/cycle-detector";

import { buildNormalizedPlan } from "./helpers";

describe("cycle detector", () => {
  it("fails closed on direct and multi-step cycles with path", () => {
    const direct = buildNormalizedPlan();
    direct.steps[0] = { ...direct.steps[0]!, dependencies: [direct.steps[1]!.id] };
    const directCycle = detectDependencyCycles(buildDependencyGraph(direct));
    expect(directCycle.errors[0]?.code).toBe("PLAN_DEPENDENCY_CYCLE_DETECTED");
    expect(directCycle.cyclePath).toBeDefined();

    const multi = buildNormalizedPlan();
    multi.steps.push({
      ...multi.steps[1]!,
      id: "step-c",
      sourceId: "step-c",
      index: 2,
      dependencies: [multi.steps[0]!.id],
    });
    multi.steps[1] = { ...multi.steps[1]!, id: "step-b", sourceId: "step-b", dependencies: ["step-c"] };
    multi.steps[0] = { ...multi.steps[0]!, dependencies: ["step-b"] };
    const multiCycle = detectDependencyCycles(buildDependencyGraph(multi));
    expect(multiCycle.errors[0]?.code).toBe("PLAN_DEPENDENCY_CYCLE_DETECTED");
    expect(multiCycle.cyclePath?.length).toBeGreaterThan(2);
  });
});
