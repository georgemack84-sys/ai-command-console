import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { explainAutonomyDecision } = require("../../services/recoveryAutonomyExplainer.js");

describe("recovery autonomy explainer", () => {
  it("produces deterministic autonomy explanations", () => {
    const result = explainAutonomyDecision({
      recoveryRequest: { executionId: "exec_1", recoveryMode: "resume" },
      policy: { action: "auto_approve", reason: "safe_resume_supervised" },
      riskScore: { riskLevel: "LOW", score: 0.1, reasons: ["safe_replay_candidate"] },
      gate: { allowed: true, reason: "autonomy_gate_passed" },
    });

    expect(result).toEqual({
      summary: expect.stringContaining("exec_1"),
      actionTaken: "auto_approve",
      riskSummary: expect.stringContaining("LOW"),
      reason: "safe_resume_supervised",
      safetyNotes: expect.any(Array),
    });
  });
});
