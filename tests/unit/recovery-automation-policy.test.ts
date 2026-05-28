import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateAutomationPolicy } = require("../../services/recoveryAutomationPolicy.js");

describe("recovery automation policy", () => {
  it("suppresses unknown signals", () => {
    expect(
      evaluateAutomationPolicy({
        advisory: { executionId: "exec_1" },
        recommendation: { recommendation: "none", confidence: 0, requiresOperator: true, reason: "unknown_recovery_signal" },
        modes: {},
        automationState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "suppress",
      requiresOperator: true,
      reason: "unknown_recovery_signal",
      policyCode: "SUPPRESS_UNKNOWN",
    });
  });

  it("suppresses none recommendations", () => {
    expect(
      evaluateAutomationPolicy({
        advisory: { executionId: "exec_1" },
        recommendation: { recommendation: "none", confidence: 0.3, requiresOperator: true, reason: "no_action" },
        modes: {},
        automationState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "suppress",
      requiresOperator: true,
      reason: "no_action",
      policyCode: "SUPPRESS_NONE",
    });
  });

  it("keeps operator recovery advisory-only", () => {
    expect(
      evaluateAutomationPolicy({
        advisory: { executionId: "exec_1" },
        recommendation: { recommendation: "operator_recovery", confidence: 0.9, requiresOperator: true, reason: "manual_review" },
        modes: {},
        automationState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "advisory_only",
      requiresOperator: true,
      reason: "manual_review",
      policyCode: "ADVISORY_ONLY_OPERATOR_RECOVERY",
    });
  });

  it("allows high-confidence resume when automation mode permits it", () => {
    expect(
      evaluateAutomationPolicy({
        advisory: { executionId: "exec_1" },
        recommendation: { recommendation: "resume", confidence: 0.95, requiresOperator: false, reason: "safe_resume" },
        modes: { automationAllowResume: true, automationMinConfidence: 0.9 },
        automationState: { paused: false },
      }),
    ).toEqual({
      allowed: true,
      action: "create_request",
      requiresOperator: false,
      reason: "safe_resume",
      policyCode: "ALLOW_CREATE_REQUEST",
    });
  });

  it("fails closed when required data is missing", () => {
    expect(
      evaluateAutomationPolicy({
        advisory: null,
        recommendation: null,
        modes: {},
        automationState: {},
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      requiresOperator: true,
      reason: "missing_automation_policy_input",
      policyCode: "BLOCKED_UNSAFE_RECOVERY_AUTOMATION",
    });
  });
});
