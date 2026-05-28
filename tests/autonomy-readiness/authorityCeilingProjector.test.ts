import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("authority ceiling projector", () => {
  it("enforces constitutional ceilings for future-bound autonomy levels", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        autonomyBoundary: Object.freeze({
          ...fixture.input.governanceView.autonomyBoundary,
          currentLevel: "A5",
          ceilingLevel: "A2",
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

    expect(profile.authorityCeiling.ceilingLevel).toBe("A2");
    expect(profile.derivedState).toBe("forbidden");
    expect(profile.errors.some((error) => error.code === "AUTONOMY_SCOPE_EXCEEDED")).toBe(true);
  });
});
