import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateAutonomyPolicy } = require("../../services/recoveryAutonomyPolicy.js");

describe("recovery autonomy policy", () => {
  it("defaults to manual approval unless supervised approval is enabled", () => {
    expect(
      evaluateAutonomyPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        advisory: null,
        automationDecision: null,
        modes: {},
        autonomyState: { level: "OFF", paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "manual_approval_required",
      reason: "autonomy_level_not_supervised",
      policyCode: "MANUAL_APPROVAL_REQUIRED",
    });
  });

  it("blocks unknown and corrupted recovery classes", () => {
    expect(
      evaluateAutonomyPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "UNKNOWN" }] },
        },
        advisory: null,
        automationDecision: null,
        modes: {},
        autonomyState: { level: "SUPERVISED_APPROVAL", paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "unknown_recovery_classification",
      policyCode: "BLOCK_UNKNOWN",
    });

    expect(
      evaluateAutonomyPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "retry_safe_steps",
          preview: { replayCandidates: [{ classification: "CORRUPTED" }] },
        },
        advisory: null,
        automationDecision: null,
        modes: {},
        autonomyState: { level: "SUPERVISED_APPROVAL", paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "corrupted_recovery_requires_manual_handling",
      policyCode: "BLOCK_CORRUPTED",
    });
  });

  it("keeps operator recovery and mark corrupted manual only", () => {
    expect(
      evaluateAutonomyPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "operator_recovery",
          preview: { replayCandidates: [{ classification: "REQUIRES_OPERATOR" }] },
        },
        advisory: null,
        automationDecision: null,
        modes: {},
        autonomyState: { level: "SUPERVISED_APPROVAL", paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "manual_approval_required",
      reason: "operator_recovery_requires_manual_approval",
      policyCode: "MANUAL_ONLY_MODE",
    });
  });

  it("allows supervised auto-approval for safe resume and safe retry", () => {
    expect(
      evaluateAutonomyPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        advisory: { recommendation: { confidence: 0.96 } },
        automationDecision: { actionTaken: "create_request" },
        modes: {},
        autonomyState: { level: "SUPERVISED_APPROVAL", paused: false },
      }),
    ).toEqual({
      allowed: true,
      action: "auto_approve",
      reason: "safe_resume_supervised",
      policyCode: "ALLOW_AUTO_APPROVE",
    });

    expect(
      evaluateAutonomyPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "retry_safe_steps",
          preview: { replayCandidates: [{ classification: "IDEMPOTENT_REPLAY" }] },
        },
        advisory: { recommendation: { confidence: 0.94 } },
        automationDecision: { actionTaken: "create_request" },
        modes: {},
        autonomyState: { level: "SUPERVISED_APPROVAL", paused: false },
      }),
    ).toEqual({
      allowed: true,
      action: "auto_approve",
      reason: "safe_retry_supervised",
      policyCode: "ALLOW_AUTO_APPROVE",
    });
  });
});
