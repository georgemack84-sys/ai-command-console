import { describe, expect, it } from "vitest";
import { buildPolicyDecisionExplanation } from "@/services/policy-decision-explainer";
import { buildPolicyDecisionFixture } from "./helpers";

describe("deterministic explanation hashing", () => {
  it("produces identical explanations for identical input", () => {
    const fixture = buildPolicyDecisionFixture();

    const left = buildPolicyDecisionExplanation(fixture.request);
    const right = buildPolicyDecisionExplanation(fixture.request);

    expect(right).toEqual(left);
    expect(right.explanationHash).toBe(left.explanationHash);
  });
});
