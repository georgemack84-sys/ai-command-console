import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit boundary", () => {
  it("enters dispute on operator ambiguity and validator drift", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture({
      metadata: {
        operatorAmbiguity: true,
        validatorDrift: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_OPERATOR_AMBIGUITY");
    expect(fixture.result.errors.map((item) => item.code)).toContain("CONSTITUTIONAL_AUDIT_VALIDATOR_DRIFT");
    expect(fixture.result.disputes.length).toBeGreaterThan(0);
  });
});
