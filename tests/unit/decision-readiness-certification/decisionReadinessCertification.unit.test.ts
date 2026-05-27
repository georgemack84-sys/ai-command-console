import { describe, expect, it } from "vitest";
import { certifyDecisionReadiness } from "@/services/decision-readiness-certification/decisionReadinessCertificationEngine";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decisionReadinessCertification", () => {
  it("certifies a deterministic, non-executing readiness bundle", () => {
    const fixture = buildDecisionReadinessCertificationFixture();

    expect(fixture.result.certification.executionAuthorized).toBe(false);
    expect(fixture.result.freeze.frozen).toBe(false);
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.certification.certificationHash).toHaveLength(64);
  });

  it("keeps identical inputs hash-stable", () => {
    const fixture = buildDecisionReadinessCertificationFixture();
    const second = certifyDecisionReadiness(fixture.input);

    expect(second.certification.certificationHash).toBe(fixture.result.certification.certificationHash);
    expect(second.deterministicHash).toBe(fixture.result.deterministicHash);
  });
});
