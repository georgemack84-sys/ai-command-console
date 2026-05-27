import { describe, expect, it } from "vitest";

import { bindSafeActionReplay, getSafeActionDefinition } from "@/services/safe-action-catalog";
import { buildSafeActionFixture } from "./helpers";

describe("safeActionReplayBinder", () => {
  it("preserves replay and snapshot lineage for catalog entries", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const replay = bindSafeActionReplay(readinessProfile, getSafeActionDefinition("safe-action:observe")!);
    expect(replay.readinessHash).toBe(readinessProfile.readinessHash);
    expect(replay.reconstructionHash).toBe(readinessProfile.replayBinding.reconstructionHash);
    expect(replay.snapshotLineageHash.length).toBeGreaterThan(0);
    expect(replay.valid).toBe(true);
  });
});
