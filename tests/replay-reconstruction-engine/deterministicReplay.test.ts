import { describe, expect, it } from "vitest";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildReplayFixture } from "./helpers";

describe("deterministic replay", () => {
  it("produces identical replay reconstruction for identical input", () => {
    const fixture = buildReplayFixture();

    const left = buildReplayReconstruction(fixture.input);
    const right = buildReplayReconstruction(fixture.input);

    expect(right).toEqual(left);
    expect(right.reconstructionHash).toBe(left.reconstructionHash);
  });
});
