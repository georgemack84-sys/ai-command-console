import { describe, expect, it } from "vitest";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

describe("recommendation constraint engine", () => {
  it("keeps the certified happy path bounded and non-executing", () => {
    const fixture = buildRecommendationConstraintFixture();

    expect(fixture.result.freeze.frozen).toBe(false);
    expect(fixture.result.constrainedRecommendations).toHaveLength(1);
    expect(fixture.result.constrainedRecommendations[0]?.constrainedRecommendation.executionAuthorized).toBe(false);
  });

  it("records immutable audit entries for each enforcement phase", () => {
    const fixture = buildRecommendationConstraintFixture();

    expect(fixture.result.auditRecords.length).toBeGreaterThan(0);
    expect(fixture.result.auditLedger.length).toBe(fixture.result.auditRecords.length);
  });
});
