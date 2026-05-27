import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit adversarial", () => {
  it("fails closed on synthetic replay detection", () => {
    const fixture = buildDecisionAuditEpisodeFixture({
      metadata: Object.freeze({ syntheticReplay: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "DECISION_AUDIT_EPISODE_SYNTHETIC_REPLAY")).toBe(true);
  });
});
