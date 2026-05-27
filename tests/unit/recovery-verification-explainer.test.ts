import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { explainRecoveryVerification } = require("../../services/recoveryVerificationExplainer.js");

describe("recovery verification explainer", () => {
  it("produces deterministic operator-facing verification output", () => {
    const result = explainRecoveryVerification({
      recoveryRequest: { recoveryRequestId: "recovery_1", executionId: "exec_1" },
      executionResult: { outcomeType: "COMMITTED" },
      verification: {
        outcome: "VERIFIED",
        confidence: 0.92,
        reason: "recovery_resume_verified",
        evidence: ["post_state_running"],
      },
    });

    expect(result).toEqual({
      summary: expect.stringContaining("exec_1"),
      outcome: "VERIFIED",
      confidence: 0.92,
      reason: "recovery_resume_verified",
      evidenceSummary: expect.stringContaining("post_state_running"),
      safetyNotes: expect.any(Array),
    });
  });
});
