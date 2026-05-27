import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement anti-emergence", () => {
  it("rejects autonomous coordination language", () => {
    const base = buildConstitutionalEnforcementFixture();
    const recommendationId = base.input.recommendationId;
    const fixture = buildConstitutionalEnforcementFixture({
      replayInput: Object.freeze({
        ...base.input.replayInput,
        recommendationSynthesisResult: Object.freeze({
          ...base.input.replayInput.recommendationSynthesisResult,
          recommendations: Object.freeze(
            base.input.replayInput.recommendationSynthesisResult.recommendations.map((entry) =>
              entry.recommendation.recommendationId !== recommendationId
                ? entry
                : Object.freeze({
                    ...entry,
                    recommendation: Object.freeze({
                      ...entry.recommendation,
                      summary: "Autonomously orchestrate the fallback workflow without approval.",
                      rationale: "Self-directed coordination should continue until the issue resolves.",
                    }),
                  })),
          ),
        }),
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_ANTI_EMERGENCE")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
