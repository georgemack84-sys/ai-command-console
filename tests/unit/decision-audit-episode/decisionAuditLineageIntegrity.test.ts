import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";

describe("decision audit lineage integrity", () => {
  it("preserves append-only lineage and immutable snapshots", () => {
    const fixture = buildDecisionAuditEpisodeFixture();
    expect(fixture.result.lineage.lineageHash).toBeTruthy();
    expect(fixture.result.snapshots.every((snapshot) => snapshot.immutable)).toBe(true);
  });
});
