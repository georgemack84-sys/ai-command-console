import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "./helpers";

describe("constitutional recommendation validator integration", () => {
  it("emits immutable lineage and audit records", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture();
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.auditLedger.length).toBe(2);
    expect(fixture.result.evidence.evidenceHash).toBeTruthy();
  });
});
