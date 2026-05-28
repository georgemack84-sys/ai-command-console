import { describe, expect, it } from "vitest";
import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";

describe("recommendation lineage approval unit", () => {
  it("tracks approval ancestry and operator interventions", () => {
    const fixture = buildRecommendationLineageFixture();
    expect(fixture.result.approvalLineage.approvalDependencies.length).toBeGreaterThan(0);
    expect(fixture.result.approvalLineage.operatorInterventions.length).toBeGreaterThan(0);
  });
});
