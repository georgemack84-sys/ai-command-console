import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification containment", () => {
  it("rejects containment when it no longer dominates capability growth", () => {
    const base = buildConstitutionalCertificationFixture();
    const fixture = buildConstitutionalCertificationFixture({
      constitutionalRuntimeSimulationResult: {
        ...base.input.constitutionalRuntimeSimulationResult,
        report: {
          ...base.input.constitutionalRuntimeSimulationResult.report,
          containmentPressureScore: 0.98,
        },
      },
      constitutionalReadinessResult: {
        ...base.input.constitutionalReadinessResult,
        containmentCertification: {
          ...base.input.constitutionalReadinessResult.containmentCertification,
          score: 0.4,
        },
      },
    });

    expect(fixture.result.report.decision).toBe("CONTAINMENT_FAILURE");
  });
});
