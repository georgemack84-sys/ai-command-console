import { describe, expect, it } from "vitest";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildReplayFixture } from "./helpers";

describe("unknown replay state fails closed", () => {
  it("marks missing replay lineage as invalid or uninspectable", () => {
    const fixture = buildReplayFixture();
    const replay = buildReplayReconstruction({
      ...fixture.input,
      treaty: Object.freeze({
        ...fixture.input.treaty,
        manifest: Object.freeze({
          ...fixture.input.treaty.manifest,
          replaySnapshotHash: "",
          replayBindingHash: "",
        }),
      }),
    });

    expect(["INVALID", "UNINSPECTABLE", "DRIFT_DETECTED"]).toContain(replay.status);
    expect(replay.errors).toContain("REPLAY_SNAPSHOT_MISSING");
  });
});
