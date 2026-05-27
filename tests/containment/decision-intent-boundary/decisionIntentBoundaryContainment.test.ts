import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary containment", () => {
  it("fails closed when certification containment is already broken", () => {
    const base = buildDecisionIntentBoundaryFixture();
    const fixture = buildDecisionIntentBoundaryFixture({
      constitutionalCertificationResult: {
        ...base.input.constitutionalCertificationResult,
        report: {
          ...base.input.constitutionalCertificationResult.report,
          failClosed: true,
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "DECISION_INTENT_CONTAINMENT_FAILURE")).toBe(true);
  });
});
