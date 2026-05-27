import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governance drift adversarial markers", () => {
  it("escalates on dependency mutation and topology corruption", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ dependencyTopologyCorruption: true }),
    }).result;

    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_DEPENDENCY_CORRUPTION")).toBe(true);
    expect(result.topology.topologyFrozen).toBe(true);
  });

  it("escalates on recommendation divergence", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ governanceDetachedRecommendation: true }),
    }).result;

    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_RECOMMENDATION_DIVERGENCE")).toBe(true);
  });
});
