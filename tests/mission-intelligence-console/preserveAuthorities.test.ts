import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("preserve authorities", () => {
  it("keeps upstream authority ownership visible in the console view", () => {
    const fixture = buildMissionConsoleFixture();

    expect(fixture.view.sourceAuthorities).toContain("4.4A.validation-core");
    expect(fixture.view.sourceAuthorities).toContain("4.4E.replay-reconstruction-engine");
    expect(fixture.view.sourceAuthorities).toContain("4.4F.deterministic-snapshot-engine");
  });
});
