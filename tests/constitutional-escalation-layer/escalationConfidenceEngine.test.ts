import { describe, expect, it } from "vitest";
import { evaluateEscalationConfidence } from "@/services/constitutional-escalation-layer";
import { buildConstitutionalEscalationFixture } from "./helpers";

describe("evaluateEscalationConfidence", () => {
  it("increases caution when confidence drops", () => {
    const { input } = buildConstitutionalEscalationFixture({
      confidenceScore: 0.25,
      previousConfidenceScore: 0.75,
    });
    const result = evaluateEscalationConfidence({
      monitoringModel: input.monitoringModel,
      generatedAt: input.generatedAt,
    });

    expect(result.confidenceTooLow).toBe(true);
    expect(result.suggestedMinimumSeverity).toBe("E2");
  });
});
