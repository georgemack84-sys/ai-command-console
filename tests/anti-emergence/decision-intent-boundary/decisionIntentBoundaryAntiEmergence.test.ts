import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary anti-emergence", () => {
  it("rejects hidden dispatch and capability crossover markers", () => {
    const fixture = buildDecisionIntentBoundaryFixture({
      metadata: Object.freeze({
        runtimeBinding: true,
        capabilityMutation: true,
        authorityGrant: true,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "DECISION_INTENT_RUNTIME_BINDING")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "DECISION_INTENT_CAPABILITY_MUTATION")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "DECISION_INTENT_AUTHORITY_EXPANSION")).toBe(true);
  });
});
