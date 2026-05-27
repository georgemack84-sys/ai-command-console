import { describe, expect, it } from "vitest";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decision readiness replay", () => {
  it("binds to original replay-certified artifacts only", () => {
    const fixture = buildDecisionReadinessCertificationFixture();

    expect(fixture.result.replayRecord.replayHash).toBe(fixture.input.deterministicReplayResult.result.replayHash);
    expect(fixture.result.replayRecord.replayCertified).toBe(true);
  });
});
