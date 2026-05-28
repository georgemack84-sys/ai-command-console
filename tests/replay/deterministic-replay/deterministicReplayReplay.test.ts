import { describe, expect, it } from "vitest";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";

describe("deterministic replay replay", () => {
  it("reproduces identical replay hashes for identical input", () => {
    const first = buildDeterministicReplayFixture();
    const second = buildDeterministicReplayFixture();
    expect(first.result.result.replayHash).toBe(second.result.result.replayHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
