import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring containment", () => {
  it("rejects weakened containment and increased authority pressure", () => {
    const base = buildConstitutionalReadinessScoringFixture();
    const fixture = buildConstitutionalReadinessScoringFixture({
      antiEmergenceResult: {
        ...base.input.antiEmergenceResult,
        record: {
          ...base.input.antiEmergenceResult.record,
          classification: "elevated",
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_READINESS_CONTAINMENT_WEAKENED")).toBe(true);
  });
});
