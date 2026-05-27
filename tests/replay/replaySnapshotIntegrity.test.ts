import { describe, expect, it } from "vitest";
import { validateHistoricalReplaySnapshot } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay snapshot integrity", () => {
  it("accepts an intact historical replay snapshot", () => {
    const bundle = buildReplayBundle();
    expect(bundle.snapshot).toBeDefined();
    expect(validateHistoricalReplaySnapshot(bundle.snapshot!)).toEqual([]);
  });

  it("fails closed when historical replay snapshot hashes are mutated", () => {
    const bundle = buildReplayBundle();
    const failures = validateHistoricalReplaySnapshot({
      ...bundle.snapshot!,
      bindingHash: `mutated-${bundle.snapshot!.bindingHash}`,
    });

    expect(failures.some((failure) => failure.code === "REPLAY_BINDING_INCOMPLETE" || failure.code === "REPLAY_HASH_MISMATCH")).toBe(true);
  });
});
