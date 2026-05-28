import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit determinism", () => {
  it("produces identical hashes for identical episodes", () => {
    const first = buildDecisionAuditEpisodeFixture();
    const second = buildDecisionAuditEpisodeFixture();
    expect(first.result.episode.auditHash).toBe(second.result.episode.auditHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
