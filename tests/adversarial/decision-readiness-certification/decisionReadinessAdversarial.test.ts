import { describe, expect, it } from "vitest";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decision readiness adversarial", () => {
  it("freezes hidden scheduler injection", () => {
    const fixture = buildDecisionReadinessCertificationFixture({
      hiddenExecutionDetectionResult: {
        ...buildDecisionReadinessCertificationFixture().input.hiddenExecutionDetectionResult,
        report: {
          ...buildDecisionReadinessCertificationFixture().input.hiddenExecutionDetectionResult.report,
          blocked: true,
          scanPassed: false,
          scanStatus: "blocked",
          detectedVectors: ["scheduler_registration"],
          blockReasons: ["hidden_execution_detected", "scheduler_registration"],
        },
      },
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("DECISION_READINESS_HIDDEN_EXECUTION");
  });

  it("freezes authority escalation attempts", () => {
    const fixture = buildDecisionReadinessCertificationFixture({
      metadata: Object.freeze({ dynamicAuthorityInheritance: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("DECISION_READINESS_ANTI_EMERGENCE");
  });
});
