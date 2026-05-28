import { describe, expect, it } from "vitest";
import { restoreReplayContainment } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay containment restoration", () => {
  it("restores historical replay containment without modification", () => {
    const bundle = buildReplayBundle();
    const restoration = restoreReplayContainment(bundle.snapshot!);

    expect(restoration.restored).toBe(true);
    expect(restoration.sandboxProfileHash).toBe(bundle.snapshot?.sandboxProfileHash);
    expect(restoration.replayContainmentHash).toBe(bundle.snapshot?.replayContainmentHash);
    expect(restoration.runtimeAuthorityLockHash).toBe(bundle.snapshot?.runtimeAuthorityLockHash);
  });

  it("fails closed when historical containment cannot be restored exactly", () => {
    const bundle = buildReplayBundle();
    const restoration = restoreReplayContainment({
      ...bundle.snapshot!,
      runtimeAuthorityLockHash: `drift-${bundle.snapshot!.runtimeAuthorityLockHash}`,
    });

    expect(restoration.restored).toBe(false);
    expect(restoration.failures[0]?.code).toBe("REPLAY_CONTAINMENT_RESTORATION_FAILED");
  });
});
