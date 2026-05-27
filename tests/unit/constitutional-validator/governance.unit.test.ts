import { describe, expect, it } from "vitest";
import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";

describe("constitutional recommendation governance unit", () => {
  it("binds to governance snapshots", () => {
    const fixture = buildConstitutionalRecommendationValidationFixture();
    expect(fixture.result.result.governanceSnapshotId).toBeTruthy();
    expect(fixture.result.result.governanceValidated).toBe(true);
  });
});
