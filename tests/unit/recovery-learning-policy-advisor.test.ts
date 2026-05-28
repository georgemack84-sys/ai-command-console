import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { recommendRecoveryPolicyAdjustments } = require("../../services/recoveryLearningPolicyAdvisor.js");

describe("recovery learning policy advisor", () => {
  it("recommends stricter policy for repeated UNKNOWN outcomes", () => {
    const result = recommendRecoveryPolicyAdjustments({
      learningSignals: {
        totals: { verified: 0, failed: 0, unknown: 3, partial: 0, noMutationConfirmed: 0 },
        byRecoveryMode: {},
        bySignalType: {},
        byClassification: {},
        warnings: [],
      },
      modes: {},
    });

    expect(result.ok).toBe(true);
    expect(result.data.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: "advisory_policy",
          severity: "HIGH",
          reason: "repeated_unknown_outcomes_detected",
        }),
      ]),
    );
  });

  it("recommends reduced autonomy for repeated failures and allowlist review for repeated verified resumes", () => {
    const result = recommendRecoveryPolicyAdjustments({
      learningSignals: {
        totals: { verified: 4, failed: 3, unknown: 0, partial: 0, noMutationConfirmed: 0 },
        byRecoveryMode: {
          resume: { total: 4, verified: 4, failed: 0, unknown: 0 },
          retry_safe_steps: { total: 3, verified: 0, failed: 3, unknown: 0 },
        },
        bySignalType: {},
        byClassification: {},
        warnings: [],
      },
      modes: {},
    });

    expect(result.ok).toBe(true);
    expect(result.data.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: "autonomy_policy",
          reason: "repeated_failed_recoveries_detected",
        }),
        expect.objectContaining({
          target: "execution_policy",
          reason: "verified_low_risk_resume_pattern_detected",
        }),
      ]),
    );
    for (const entry of result.data.recommendations) {
      expect(entry.confidence).toBeGreaterThanOrEqual(0);
      expect(entry.confidence).toBeLessThanOrEqual(1);
    }
  });
});
