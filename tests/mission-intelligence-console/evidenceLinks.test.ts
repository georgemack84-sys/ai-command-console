import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("evidence links", () => {
  it("binds every domain to upstream evidence links", () => {
    const fixture = buildMissionConsoleFixture();

    expect(fixture.view.timeline.evidenceLinks.length).toBeGreaterThan(0);
    expect(fixture.view.replay.evidenceLinks.length).toBeGreaterThan(0);
    expect(fixture.view.snapshots.evidenceLinks.length).toBeGreaterThan(0);
  });
});
