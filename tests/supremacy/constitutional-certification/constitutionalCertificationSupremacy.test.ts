import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification supremacy", () => {
  it("fails closed when override propagation degrades", () => {
    const base = buildConstitutionalCertificationFixture();
    const fixture = buildConstitutionalCertificationFixture({
      humanSupremacyResult: {
        ...base.input.humanSupremacyResult,
        overridePropagation: {
          ...base.input.humanSupremacyResult.overridePropagation,
          globallyPropagated: false,
          propagationState: "partial",
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_CERTIFICATION_OVERRIDE_FAILURE")).toBe(true);
  });
});
