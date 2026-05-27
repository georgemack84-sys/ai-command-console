import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification determinism", () => {
  it("produces identical decisions and scores for identical inputs", () => {
    const first = buildConstitutionalCertificationFixture();
    const second = buildConstitutionalCertificationFixture();

    expect(first.result.report.decision).toBe(second.result.report.decision);
    expect(first.result.aggregation.aggregateScore).toBe(second.result.aggregation.aggregateScore);
    expect(first.result.policy.policyHash).toBe(second.result.policy.policyHash);
  });
});
