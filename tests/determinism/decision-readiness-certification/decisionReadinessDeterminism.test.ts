import { describe, expect, it } from "vitest";
import { certifyDecisionReadiness } from "@/services/decision-readiness-certification/decisionReadinessCertificationEngine";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decision readiness determinism", () => {
  it("produces identical hashes for identical inputs", () => {
    const fixture = buildDecisionReadinessCertificationFixture();
    const second = certifyDecisionReadiness(fixture.input);

    expect(second.certification.evidenceHash).toBe(fixture.result.certification.evidenceHash);
    expect(second.deterministicHash).toBe(fixture.result.deterministicHash);
  });
});
