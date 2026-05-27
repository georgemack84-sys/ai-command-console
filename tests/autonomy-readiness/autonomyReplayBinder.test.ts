import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture } from "./helpers";

describe("autonomy replay binder", () => {
  it("preserves replay lineage and reconstruction hashes", () => {
    const { input, profile } = buildAutonomyReadinessFixture();

    expect(profile.replayBinding.replaySnapshotHash).toBe(input.source.treaty.manifest.replaySnapshotHash);
    expect(profile.replayBinding.replayLineageHash).toBe(input.source.treaty.evidence.replayLineageHash);
    expect(profile.replayBinding.reconstructionHash).toBe(input.source.replay.reconstructionHash);
  });
});
