import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutionalEnforcementEngine", () => {
  it("approves bounded non-executing recommendations", () => {
    const fixture = buildConstitutionalEnforcementFixture();

    expect(fixture.result.status).toBe("COMPLETED");
    expect(fixture.result.verdict.status).toBe("APPROVED");
    expect(fixture.result.verdict.executionAuthorized).toBe(false);
    expect(fixture.result.auditRecords.some((record) => record.eventType === "recommendation.approved")).toBe(true);
  });

  it("rejects ambiguous recommendation semantics", () => {
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
                      summary: "Maybe review the containment posture if possible.",
                      rationale: "This could potentially merit additional human review where appropriate.",
                    }),
                  })),
          ),
        }),
      }),
    });

    expect(fixture.result.verdict.status).toBe("REJECTED");
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_AMBIGUITY_DETECTED")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });

  it("never changes constitutional authority flags", () => {
    const fixture = buildConstitutionalEnforcementFixture();

    expect(fixture.result.verdict.runtimeMutationOccurred).toBe(false);
    expect(fixture.result.verdict.scheduledActionCreated).toBe(false);
    expect(fixture.result.verdict.authorityChanged).toBe(false);
  });
});
