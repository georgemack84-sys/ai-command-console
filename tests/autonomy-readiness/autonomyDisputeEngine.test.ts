import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("autonomy dispute engine", () => {
  it("converts ambiguous readiness into disputed state", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        state: "ESCALATE",
      }),
    });

    expect(profile.derivedState).toBe("disputed");
    expect(profile.disputes.some((entry) => entry.code === "AUTONOMY_DISPUTED")).toBe(true);
  });
});
