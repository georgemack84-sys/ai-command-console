import { describe, expect, it } from "vitest";
import { buildPolicyDecisionExplanation } from "@/services/policy-decision-explainer";
import { buildPolicyDecisionFixture } from "./helpers";

describe("missing reasoning fails closed", () => {
  it("does not infer missing governance, approval, risk, or replay reasoning", () => {
    const fixture = buildPolicyDecisionFixture();
    const explanation = buildPolicyDecisionExplanation({
      ...fixture.request,
      traceView: Object.freeze({
        ...fixture.request.traceView!,
        governanceOverlay: undefined,
        replayView: undefined,
      }),
      treatyEvidence: undefined,
      options: { strict: true },
    });

    expect(explanation.finalDecision).toBe("unknown");
    expect(explanation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "POLICY_REASONING_UNAVAILABLE",
        "POLICY_APPROVAL_REASONING_MISSING",
        "POLICY_REPLAY_REASONING_UNAVAILABLE",
      ]),
    );
  });
});
