import { describe, expect, it } from "vitest";
import { buildPolicyDecisionFixture, projectPolicyReplayReasoning } from "./helpers";

describe("policy replay projection", () => {
  it("renders replay reasoning from existing replay artifacts only", () => {
    const fixture = buildPolicyDecisionFixture();

    const projected = projectPolicyReplayReasoning({
      traceView: fixture.traceFixture.view,
    });

    expect(projected.reasoning.unavailable).toBe(false);
    expect(projected.reasoning.replayHash).toBe(
      fixture.traceFixture.view.replayView?.replayHash,
    );
  });
});
