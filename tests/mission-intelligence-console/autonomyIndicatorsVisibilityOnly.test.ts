import { describe, expect, it } from "vitest";
import { buildMissionConsoleFixture } from "./helpers";

describe("autonomy indicators", () => {
  it("remain visibility-only and preserve the constitutional no-bypass rule", () => {
    const fixture = buildMissionConsoleFixture();

    expect(fixture.view.autonomy.visibilityOnly).toBe(true);
    expect(fixture.view.autonomy.constitutionalRule).toBe("NO_AUTONOMOUS_DECISION_MAY_BYPASS_GOVERNANCE");
  });
});
