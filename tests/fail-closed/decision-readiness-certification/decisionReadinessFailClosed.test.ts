import { describe, expect, it } from "vitest";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decision readiness fail-closed", () => {
  it("freezes on replay corruption", () => {
    const fixture = buildDecisionReadinessCertificationFixture({
      metadata: Object.freeze({ replayCorruption: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("DECISION_READINESS_REPLAY_MISMATCH");
  });

  it("freezes on missing lineage", () => {
    const fixture = buildDecisionReadinessCertificationFixture({
      decisionAuditEpisodeResult: {
        ...buildDecisionReadinessCertificationFixture().input.decisionAuditEpisodeResult,
        lineage: Object.freeze({
          entries: Object.freeze([]),
          lineageHash: "",
        }),
      },
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("DECISION_READINESS_MISSING_LINEAGE");
  });
});
