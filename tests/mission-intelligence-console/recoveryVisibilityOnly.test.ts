import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("recovery visibility only", () => {
  it("uses recovery as visibility/request surface rather than direct recovery", () => {
    const fixture = buildMissionConsoleFixture();
    const recoveryAction = fixture.view.operatorActions.find((action) => action.authority === "console.operator-recovery");

    expect(recoveryAction?.delegated).toBe(true);
    expect(recoveryAction?.method).toBe("GET");
    expect(recoveryAction?.requestOnly).toBe(true);
  });
});
