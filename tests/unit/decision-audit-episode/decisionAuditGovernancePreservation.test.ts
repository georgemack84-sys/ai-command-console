import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit governance preservation", () => {
  it("preserves governance snapshot bindings", () => {
    const fixture = buildDecisionAuditEpisodeFixture();
    expect(fixture.result.episode.governanceSnapshotId)
      .toBe(fixture.input.recommendationValidationResult.result.governanceSnapshotId);
  });
});
