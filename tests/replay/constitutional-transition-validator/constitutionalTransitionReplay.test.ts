import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { ConstitutionalTransitionErrorCode } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

describe("constitutional transition replay", () => {
  it("uses only original replay-certified snapshots", () => {
    const fixture = buildConstitutionalTransitionFixture();
    expect(fixture.result.replayRecord.replaySnapshotId).toBe(fixture.input.replaySnapshotId);
    expect(fixture.result.replayRecord.replayHash).toBe(
      fixture.input.deterministicReplayResult.result.replayHash,
    );
  });

  it("freezes on replay drift", () => {
    const fixture = buildConstitutionalTransitionFixture({
      metadata: Object.freeze({ replayDrift: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.REPLAY_DRIFT_DETECTED,
    );
  });
});
