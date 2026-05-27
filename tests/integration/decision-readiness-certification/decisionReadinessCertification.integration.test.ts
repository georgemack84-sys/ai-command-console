import { describe, expect, it } from "vitest";
import { buildDecisionReadinessCertificationFixture } from "./helpers";

describe("decision readiness certification integration", () => {
  it("reuses upstream replay, transition, and audit outputs", () => {
    const fixture = buildDecisionReadinessCertificationFixture();

    expect(fixture.result.replayRecord.replayHash).toBe(
      fixture.input.deterministicReplayResult.result.replayHash,
    );
    expect(fixture.result.governanceRecord.governanceHash).toBe(
      fixture.input.constitutionalTransitionResult.transition.governanceHash,
    );
    expect(fixture.result.certification.executionAuthorized).toBe(false);
  });
});
