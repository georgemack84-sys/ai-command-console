import { describe, expect, it } from "vitest";
import { evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";

describe("failure propagation and cascade suppression", () => {
  it("propagates failures deterministically", () => {
    const first = evaluateFailureFixture({
      additionalSignals: [
        {
          domain: "execution",
          type: "CASCADE_RISK_DETECTED",
          code: "FAILURE_CASCADE_SUPPRESSED",
          message: "cascade risk",
        },
      ],
    });
    const second = evaluateFailureFixture({
      additionalSignals: [
        {
          domain: "execution",
          type: "CASCADE_RISK_DETECTED",
          code: "FAILURE_CASCADE_SUPPRESSED",
          message: "cascade risk",
        },
      ],
    });

    expect(first.propagation.propagationHash).toBe(second.propagation.propagationHash);
    expect(first.cascadeSuppression.suppressed).toBe(true);
    expect(first.cascadeSuppression.activeFreeze).toBe(true);
  });
});

