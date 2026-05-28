import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("autonomy simulation classifier", () => {
  it("keeps A3-A5 as future-bound simulation-only concepts", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        autonomyBoundary: Object.freeze({
          ...fixture.input.governanceView.autonomyBoundary,
          currentLevel: "A3",
          ceilingLevel: "A3",
        }),
      }),
      source: Object.freeze({
        ...fixture.input.source,
        consoleView: Object.freeze({
          ...fixture.input.source.consoleView,
          autonomy: Object.freeze({
            ...fixture.input.source.consoleView.autonomy,
            autonomyLevel: "A3",
          }),
        }),
      }),
    });

    expect(profile.simulationClassification.classification).toBe("future_bound_concept");
    expect(profile.simulationClassification.executing).toBe(false);
    expect(profile.simulationClassification.orchestrationAllowed).toBe(false);
  });

  it("forbids A5 orchestration attempts", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        autonomyBoundary: Object.freeze({
          ...fixture.input.governanceView.autonomyBoundary,
          currentLevel: "A5",
          ceilingLevel: "A5",
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

    expect(profile.simulationClassification.classification).toBe("future_bound_concept");
    expect(profile.errors.some((error) => error.code === "AUTONOMY_ORCHESTRATION_FORBIDDEN")).toBe(false);
  });
});
