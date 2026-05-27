import { describe, expect, it } from "vitest";
import { buildPolicyDecisionExplanation } from "@/services/policy-decision-explainer";
import { buildPolicyDecisionFixture } from "./helpers";

describe("no mutation behavior", () => {
  it("never mutates source input objects", () => {
    const fixture = buildPolicyDecisionFixture();
    const before = JSON.stringify(fixture.request);

    buildPolicyDecisionExplanation(fixture.request);

    expect(JSON.stringify(fixture.request)).toBe(before);
  });
});
