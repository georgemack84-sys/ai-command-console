import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("simulation is read only", () => {
  it("surfaces branch outcomes without enabling execution", () => {
    const fixture = buildMissionConsoleFixture();

    expect(fixture.view.simulation.data.readOnly).toBe(true);
    expect(fixture.view.operatorActions.every((action) => action.requestOnly)).toBe(true);
  });
});
