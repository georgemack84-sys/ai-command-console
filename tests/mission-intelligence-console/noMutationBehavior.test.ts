import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture, buildMissionConsoleView } from "./helpers";

describe("no mutation behavior", () => {
  it("does not mutate upstream source artifacts while composing the console", () => {
    const fixture = buildMissionConsoleFixture();
    const before = JSON.stringify(fixture.input);

    buildMissionConsoleView(fixture.input);

    expect(JSON.stringify(fixture.input)).toBe(before);
  });
});
