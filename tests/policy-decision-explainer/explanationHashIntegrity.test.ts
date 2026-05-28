import { describe, expect, it } from "vitest";
import { buildPolicyDecisionExplanation } from "@/services/policy-decision-explainer";
import { buildPolicyDecisionFixture } from "./helpers";

describe("explanation hash integrity", () => {
  it("changes when meaningful visible evidence changes", () => {
    const fixture = buildPolicyDecisionFixture();
    const left = buildPolicyDecisionExplanation(fixture.request);
    const right = buildPolicyDecisionExplanation({
      ...fixture.request,
      traceView: Object.freeze({
        ...fixture.request.traceView!,
        warnings: Object.freeze([{
          code: "trace-governance-warning" as const,
          message: "operator-visible-warning",
        }]),
      }),
    });

    expect(right.explanationHash).not.toBe(left.explanationHash);
  });
});
