import { describe, expect, it } from "vitest";

import { validateIntentCoordinationTopology } from "@/services/intent-coordination-governance-core/coordinationTopologyValidator";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("coordination topology validator", () => {
  it("accepts a bounded linear topology", () => {
    const { input } = buildIntentCoordinationGovernanceFixture();
    const result = validateIntentCoordinationTopology({
      topology: input.topology,
      boundaryContract: input.boundaryContract,
    });
    expect(result.errors).toEqual([]);
    expect(result.stats.maxDepthObserved).toBe(3);
  });

  it("rejects recursive relationships", () => {
    const base = buildIntentCoordinationGovernanceFixture();
    const { input } = buildIntentCoordinationGovernanceFixture({
      topology: Object.freeze({
        ...base.input.topology,
        relationships: Object.freeze([
          ...base.input.topology.relationships,
          Object.freeze({
            relationshipId: "rel-recursive",
            parentIntentId: "intent-child-2",
            childIntentId: "intent-root",
            relationshipType: "escalation" as const,
            governanceBindings: Object.freeze([base.input.governanceView.constitutionalDecisionHash]),
            replaySafe: true as const,
            executionAuthority: false as const,
          }),
        ]),
      }),
    });
    const result = validateIntentCoordinationTopology({
      topology: input.topology,
      boundaryContract: input.boundaryContract,
    });
    expect(result.errors.some((error) => error.code === "COORDINATION_RECURSION_DETECTED")).toBe(true);
  });
});
