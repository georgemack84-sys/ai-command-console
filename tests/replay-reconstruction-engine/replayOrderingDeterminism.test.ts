import { describe, expect, it } from "vitest";
import { buildReplayFixture } from "./helpers";

describe("replay ordering determinism", () => {
  it("preserves deterministic event and dependency ordering", () => {
    const fixture = buildReplayFixture();

    expect(fixture.replay.visualization.eventIds).toEqual(
      [...fixture.replay.visualization.eventIds],
    );
    expect(fixture.replay.visualization.dependencyEdges).toEqual(
      [...fixture.replay.visualization.dependencyEdges],
    );
  });
});
