import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit adversarial", () => {
  it("fails closed on lineage fabrication and synthetic authority injection", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        lineageFabrication: true,
        syntheticAuthorityInjection: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_LINEAGE_CORRUPTION");
    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_SYNTHETIC_AUTHORITY");
    expect(fixture.result.record.episodeState).toBe("blocked");
  });
});
