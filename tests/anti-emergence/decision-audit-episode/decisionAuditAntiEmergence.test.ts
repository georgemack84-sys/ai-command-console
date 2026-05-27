import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit anti-emergence", () => {
  it("blocks recursive replay chains", () => {
    const fixture = buildDecisionAuditEpisodeFixture({
      metadata: Object.freeze({ recursiveReplay: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "DECISION_AUDIT_EPISODE_RECURSIVE_REPLAY")).toBe(true);
  });
});
