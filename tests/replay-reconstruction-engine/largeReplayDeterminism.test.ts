import { describe, expect, it } from "vitest";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildReplayFixture } from "./helpers";

describe("large replay determinism", () => {
  it("remains deterministic with larger comparison artifacts", () => {
    const fixture = buildReplayFixture();
    const expandedArtifact = Object.freeze({
      ...(fixture.input.comparisonArtifact as Record<string, unknown>),
      steps: Object.freeze([
        ...((fixture.input.comparisonArtifact as Record<string, unknown>).steps as readonly unknown[]),
        ...((fixture.input.comparisonArtifact as Record<string, unknown>).steps as readonly unknown[]),
      ]),
      evidenceRefs: Object.freeze([
        ...((fixture.input.comparisonArtifact as Record<string, unknown>).evidenceRefs as readonly string[]),
        "unknown-extra-evidence",
      ]),
    });

    const left = buildReplayReconstruction({
      ...fixture.input,
      comparisonArtifact: expandedArtifact,
    });
    const right = buildReplayReconstruction({
      ...fixture.input,
      comparisonArtifact: expandedArtifact,
    });

    expect(right).toEqual(left);
  });
});
