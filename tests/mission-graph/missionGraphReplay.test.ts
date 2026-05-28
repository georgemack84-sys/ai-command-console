import { describe, expect, it } from "vitest";

import { buildMissionGraphFixture } from "./helpers";

describe("mission coordination graph replay", () => {
  it("reconstructs deterministic replay-safe visibility", () => {
    const first = buildMissionGraphFixture();
    const second = buildMissionGraphFixture();

    expect(first.snapshot.graphHash).toBe(second.snapshot.graphHash);
    expect(first.snapshot.replayPaths).toEqual(second.snapshot.replayPaths);
    expect(first.snapshot.visibilityState).toBe("visible");
  });
});
