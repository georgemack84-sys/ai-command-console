import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { explainRecoveryExecutionDecision } = require("../../services/recoveryExecutionExplainer.js");

describe("recovery execution explainer", () => {
  it("explains commit and block decisions deterministically", () => {
    expect(
      explainRecoveryExecutionDecision({
        recoveryRequest: { recoveryRequestId: "recovery_1", executionId: "exec_1" },
        policy: { action: "commit_approved", reason: "approved_safe_resume" },
        gate: { allowed: true, reason: "execution_gate_passed" },
        commitResult: { ok: true },
      }),
    ).toEqual({
      summary: expect.stringContaining("exec_1"),
      actionTaken: "committed",
      reason: "approved_safe_resume",
      safetyNotes: expect.any(Array),
    });
  });
});
