import { describe, expect, it } from "vitest";
import { buildSnapshotFixture, buildConstitutionalSnapshot } from "./helpers";

describe("snapshot replay binding", () => {
  it("binds to upstream replay output without reconstructing replay", () => {
    const fixture = buildSnapshotFixture();
    const mutatedReplay = Object.freeze({
      ...fixture.input.sourceArtifacts.replay!,
      reconstructionHash: "replay-hash-override",
    });

    const snapshot = buildConstitutionalSnapshot({
      ...fixture.input,
      sourceArtifacts: Object.freeze({
        ...fixture.input.sourceArtifacts,
        replay: mutatedReplay,
      }),
    });

    expect(snapshot.replayHash).not.toBe(fixture.snapshot.replayHash);
    expect(snapshot.replayHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
