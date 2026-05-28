import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit fail closed", () => {
  it("fails closed on missing proposal snapshot", () => {
    const fixture = buildDecisionAuditEpisodeFixture({
      proposalIntegrityResult: Object.freeze({
        ...buildDecisionAuditEpisodeFixture().input.proposalIntegrityResult,
        snapshot: Object.freeze({
          ...buildDecisionAuditEpisodeFixture().input.proposalIntegrityResult.snapshot,
          snapshotId: "",
        }),
      }),
    });
    expect(fixture.result.errors.some((error) => error.code === "DECISION_AUDIT_EPISODE_MISSING_PROPOSAL_SNAPSHOT")).toBe(true);
  });
});
