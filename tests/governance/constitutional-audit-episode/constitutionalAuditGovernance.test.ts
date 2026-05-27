import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit governance", () => {
  it("enters dispute on governance mismatch", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        latestGovernanceState: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_CURRENT_STATE_SUBSTITUTION");
    expect(fixture.result.disputes.length).toBeGreaterThan(0);
  });
});
