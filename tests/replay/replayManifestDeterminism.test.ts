import { describe, expect, it } from "vitest";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay manifest determinism", () => {
  it("builds identical replay manifests for identical historical inputs", () => {
    const first = buildReplayBundle();
    const second = buildReplayBundle();

    expect(first.manifest?.manifestHash).toBe(second.manifest?.manifestHash);
    expect(first.manifest?.snapshotHash).toBe(second.manifest?.snapshotHash);
    expect(first.ledger.map((event) => event.eventHash)).toEqual(second.ledger.map((event) => event.eventHash));
  });
});
