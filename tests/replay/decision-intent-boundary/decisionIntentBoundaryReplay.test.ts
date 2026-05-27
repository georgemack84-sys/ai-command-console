import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary replay", () => {
  it("fails closed when replay determinism degrades", () => {
    const base = buildDecisionIntentBoundaryFixture();
    const fixture = buildDecisionIntentBoundaryFixture({
      constitutionalReplayResult: {
        ...base.input.constitutionalReplayResult,
        record: {
          ...base.input.constitutionalReplayResult.record,
          replayDeterministic: false,
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "DECISION_INTENT_REPLAY_INVALID")).toBe(true);
  });
});
