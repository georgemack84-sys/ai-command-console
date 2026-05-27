import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture, buildMissionConsoleView } from "./helpers";

describe("fail closed missing evidence", () => {
  it("returns a disputed fail-closed console when required source authority is missing", () => {
    const fixture = buildMissionConsoleFixture();
    const view = buildMissionConsoleView({
      ...fixture.input,
      replay: undefined as never,
    });

    expect(view.state).toBe("DISPUTED");
    expect(view.errors[0]?.code).toBe("MISSION_CONSOLE_SOURCE_AUTHORITY_MISSING");
  });
});
