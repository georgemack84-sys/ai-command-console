import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("autonomy validator", () => {
  it("denies A6 as permanently forbidden", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        autonomyBoundary: Object.freeze({
          ...fixture.input.governanceView.autonomyBoundary,
          currentLevel: "A6",
          ceilingLevel: "A6",
        }) as unknown as typeof fixture.input.governanceView.autonomyBoundary,
      }),
      source: Object.freeze({
        ...fixture.input.source,
        consoleView: Object.freeze({
          ...fixture.input.source.consoleView,
          autonomy: Object.freeze({
            ...fixture.input.source.consoleView.autonomy,
            autonomyLevel: "A6" as never,
          }),
        }),
      }),
    });

    expect(profile.derivedState).toBe("forbidden");
    expect(profile.errors.some((error) => error.code === "AUTONOMY_FORBIDDEN")).toBe(true);
  });

  it("rejects execution path implication from A2", () => {
    const fixture = buildAutonomyReadinessFixture();
    expect(fixture.profile.errors.some((error) => error.code === "AUTONOMY_EXECUTION_FORBIDDEN")).toBe(true);
  });
});
