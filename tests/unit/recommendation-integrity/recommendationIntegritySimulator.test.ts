import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation integrity simulator", () => {
  it("reconstructs deterministic recommendation output", () => {
    const first = buildRecommendationIntegrityFixture();
    const second = buildRecommendationIntegrityFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("simulates healthy recommendations without adding authority", () => {
    const fixture = buildRecommendationIntegrityFixture();
    expect(fixture.result.record.recommendationState).toBe("SIMULATED");
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
  });
});
