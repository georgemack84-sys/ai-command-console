import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildRecommendationLineageFixture();
    const second = buildRecommendationLineageFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.artifact.lineageHash).toBe(second.result.artifact.lineageHash);
  });

  it("never exposes execution or orchestration authority", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.artifact.executionAuthorized).toBe(false);
    expect(fixture.result.artifact.orchestrationAllowed).toBe(false);
    expect(fixture.result.artifact.runtimeMutationAllowed).toBe(false);
  });
});
