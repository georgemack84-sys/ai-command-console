import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { explainRecoveryLearningReport } = require("../../services/recoveryLearningExplainer.js");

describe("recovery learning explainer", () => {
  it("produces deterministic operator-facing learning reports", () => {
    const result = explainRecoveryLearningReport({
      learningSignals: {
        totals: { verified: 2, failed: 1, unknown: 1, partial: 0, noMutationConfirmed: 0 },
        warnings: ["missing_automation_history"],
      },
      recommendations: [
        {
          target: "advisory_policy",
          recommendation: "Review unknown outcomes.",
          severity: "HIGH",
          confidence: 0.9,
          reason: "repeated_unknown_outcomes_detected",
        },
      ],
    });

    expect(result).toEqual({
      summary: expect.stringContaining("advisory only"),
      keyFindings: expect.any(Array),
      recommendations: expect.any(Array),
      safetyNotes: expect.any(Array),
    });
  });
});
