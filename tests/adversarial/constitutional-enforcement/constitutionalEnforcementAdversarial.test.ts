import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement adversarial", () => {
  it("blocks hidden execution phrases", () => {
    const base = buildConstitutionalEnforcementFixture();
    const recommendationId = base.input.recommendationId;
    const fixture = buildConstitutionalEnforcementFixture({
      replayInput: Object.freeze({
        ...base.input.replayInput,
        recommendationConstraintResult: Object.freeze({
          ...base.input.replayInput.recommendationConstraintResult,
          constrainedRecommendations: Object.freeze(
            base.input.replayInput.recommendationConstraintResult.constrainedRecommendations.map((entry) =>
              entry.constrainedRecommendation.recommendationId !== recommendationId
                ? entry
                : Object.freeze({
                    ...entry,
                    constrainedRecommendation: Object.freeze({
                      ...entry.constrainedRecommendation,
                      summary: "Automatically restart failed monitor and queue replay validation every 5 minutes.",
                      rationale: "Dispatch the fallback adapter until successful.",
                    }),
                    sanitizationRecord: Object.freeze({
                      ...entry.sanitizationRecord,
                      sanitizedSummary: "Automatically restart failed monitor and queue replay validation every 5 minutes.",
                      sanitizedRationale: "Dispatch the fallback adapter until successful.",
                    }),
                  })),
          ),
        }),
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_EXECUTION_DETECTED")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_SCHEDULING_DETECTED")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
