import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture, buildMissionConsoleView } from "./helpers";

describe("large mission determinism", () => {
  it("keeps the normalized console model stable for larger snapshot sets", () => {
    const fixture = buildMissionConsoleFixture();
    const expanded = buildMissionConsoleView({
      ...fixture.input,
      snapshots: Object.freeze([...fixture.input.snapshots, ...fixture.input.snapshots]),
    });
    const repeated = buildMissionConsoleView({
      ...fixture.input,
      snapshots: Object.freeze([...fixture.input.snapshots, ...fixture.input.snapshots]),
    });

    expect(repeated.consoleHash).toBe(expanded.consoleHash);
  });
});
