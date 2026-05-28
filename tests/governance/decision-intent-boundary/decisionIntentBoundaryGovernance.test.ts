import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary governance", () => {
  it("fails closed when governance binding breaks", () => {
    const base = buildDecisionIntentBoundaryFixture();
    const fixture = buildDecisionIntentBoundaryFixture({
      constitutionalCertificationResult: {
        ...base.input.constitutionalCertificationResult,
        record: {
          ...base.input.constitutionalCertificationResult.record,
          governanceBound: false,
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "DECISION_INTENT_GOVERNANCE_VIOLATION")).toBe(true);
  });
});
