import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("adversarial constraints", () => {
  it("fails closed when replay lineage is missing", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        replayAuthority: Object.freeze({
          ...fixture.input.governanceView.replayAuthority,
          replayLineageHash: "",
          lineageValid: false,
          decision: "DENY",
        }),
      }),
    });

    expect(profile.derivedState).toBe("forbidden");
    expect(profile.errors.some((error) => error.code === "AUTONOMY_REPLAY_UNBOUND")).toBe(true);
  });

  it("denies unknown capability inference through drift detection", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        autonomyBoundary: Object.freeze({
          ...fixture.input.governanceView.autonomyBoundary,
          currentLevel: "A1",
        }),
      }),
      source: Object.freeze({
        ...fixture.input.source,
        consoleView: Object.freeze({
          ...fixture.input.source.consoleView,
          autonomy: Object.freeze({
            ...fixture.input.source.consoleView.autonomy,
            autonomyLevel: "A5",
          }),
        }),
      }),
    });

    expect(profile.capabilityDriftDetected).toBe(true);
    expect(profile.disputes.some((entry) => entry.code === "AUTONOMY_CAPABILITY_DRIFT")).toBe(true);
  });
});
