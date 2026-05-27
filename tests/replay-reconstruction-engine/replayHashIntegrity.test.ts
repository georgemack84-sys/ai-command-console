import { describe, expect, it } from "vitest";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildReplayFixture } from "./helpers";

describe("replay hash integrity", () => {
  it("changes reconstruction hash when meaningful replay evidence changes", () => {
    const fixture = buildReplayFixture();
    const left = buildReplayReconstruction(fixture.input);
    const right = buildReplayReconstruction({
      ...fixture.input,
      comparisonArtifact: {
        ...(fixture.input.comparisonArtifact as Record<string, unknown>),
        replayHash: "sha256:mutated-replay-hash",
      },
    });

    expect(right.reconstructionHash).not.toBe(left.reconstructionHash);
  });
});
