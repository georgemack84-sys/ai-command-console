import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildDecisionIntentBoundaryFixture();
    const second = buildDecisionIntentBoundaryFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.artifact.deterministicHash).toBe(second.result.artifact.deterministicHash);
    expect(first.result.aggregation.deterministicHash).toBe(second.result.aggregation.deterministicHash);
  });

  it("never exposes execution, orchestration, or scheduling authority", () => {
    const fixture = buildDecisionIntentBoundaryFixture();

    expect(fixture.result.artifact.executionAuthorized).toBe(false);
    expect(fixture.result.artifact.orchestrationAllowed).toBe(false);
    expect(fixture.result.artifact.schedulerRegistrationAllowed).toBe(false);
    expect(fixture.result.artifact.runtimeMutationAllowed).toBe(false);
  });
});
