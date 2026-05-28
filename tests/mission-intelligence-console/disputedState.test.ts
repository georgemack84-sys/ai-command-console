import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("disputed state", () => {
  it("renders replay and drift disputes explicitly instead of hiding them", () => {
    const fixture = buildMissionConsoleFixture();

    expect(fixture.view.state).toBe("DISPUTED");
    expect(fixture.view.replay.state).toBe("DISPUTED");
    expect(fixture.view.drift.state).toBe("DISPUTED");
  });
});
