import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "@/services/planning/dependencies";
import { stableTopologicalSort } from "@/services/planning/dependencies/stable-topological-sorter";

import { buildNormalizedPlan } from "./helpers";

describe("stable topological sorter", () => {
  it("is deterministic and preserves authored order tie-breaks", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps[1] = { ...normalizedPlan.steps[1]!, id: "step-b1", sourceId: "step-b1", index: 1 };
    normalizedPlan.steps.push({
      ...normalizedPlan.steps[1]!,
      id: "step-b2",
      sourceId: "step-b2",
      index: 2,
      hash: `${normalizedPlan.steps[1]!.hash}-b2`,
    });

    const graph = buildDependencyGraph(normalizedPlan);
    const first = stableTopologicalSort(graph);
    const second = stableTopologicalSort(graph);

    expect(first.errors).toHaveLength(0);
    expect(first.orderedStepIds).toEqual(second.orderedStepIds);
    expect(first.orderedStepIds).toEqual([normalizedPlan.steps[0]!.id, "step-b1", "step-b2"]);
  });
});
