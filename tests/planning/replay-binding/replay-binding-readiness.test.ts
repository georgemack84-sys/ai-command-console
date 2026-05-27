import { describe, expect, it } from "vitest";

import { buildReplayBindingReadiness } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("replay binding readiness", () => {
  it("returns identical readiness for identical input", () => {
    const fixture = buildReplayBindingFixture();
    expect(buildReplayBindingReadiness(fixture)).toEqual(buildReplayBindingReadiness(fixture));
  });

  it("emits derived replay binding only", () => {
    const fixture = buildReplayBindingFixture();
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.replayBindingHash).toBeTruthy();
    expect(readiness.binding.executionTruthHash).toBe(fixture.admissionReadiness.context.lineage.executionTruthHash);
    expect(readiness.binding.executionCompatibilityHash).toBe(fixture.admissionReadiness.context.lineage.executionCompatibilityHash);
    expect(readiness.binding.replaySnapshotHash).toBe(fixture.admissionReadiness.context.lineage.replaySnapshotHash);
  });

  it("fails closed on expected replay binding hash mismatch", () => {
    const fixture = buildReplayBindingFixture({
      expectedReplayBindingHash: "forged",
    });
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "REPLAY_BINDING_DRIFT")).toBe(true);
  });
});
