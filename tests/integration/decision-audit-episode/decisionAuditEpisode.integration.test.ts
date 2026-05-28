import { describe, expect, it } from "vitest";
import { buildDecisionAuditEpisodeFixture } from "./helpers";

describe("decision audit episode integration", () => {
  it("emits immutable lineage and audit records", () => {
    const fixture = buildDecisionAuditEpisodeFixture();
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.auditLedger.length).toBe(2);
    expect(fixture.result.exportRecord.exportHash).toBeTruthy();
  });
});
