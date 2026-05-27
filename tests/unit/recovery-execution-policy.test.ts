import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateRecoveryExecutionPolicy } = require("../../services/recoveryExecutionPolicy.js");

describe("recovery execution policy", () => {
  it("allows approved safe resume when allowlisted", () => {
    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "APPROVED",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        modes: { executionAllowlist: ["resume", "retry_safe_steps"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: true,
      action: "commit_approved",
      reason: "approved_safe_resume",
      policyCode: "ALLOW_COMMIT_APPROVED",
    });
  });

  it("blocks unapproved, corrupted, unknown, and unsafe requests", () => {
    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        modes: { executionAllowlist: ["resume"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "request_not_approved",
      policyCode: "BLOCK_REQUEST_STATE",
    });

    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "APPROVED",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "CORRUPTED" }] },
        },
        modes: { executionAllowlist: ["resume"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "corrupted_recovery_blocked",
      policyCode: "BLOCK_CORRUPTED",
    });

    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "APPROVED",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "UNKNOWN" }] },
        },
        modes: { executionAllowlist: ["resume"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "unknown_recovery_blocked",
      policyCode: "BLOCK_UNKNOWN",
    });

    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "APPROVED",
          recoveryMode: "retry_safe_steps",
          preview: { replayCandidates: [{ classification: "UNSAFE_REPLAY" }] },
        },
        modes: { executionAllowlist: ["retry_safe_steps"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "unsafe_replay_blocked",
      policyCode: "BLOCK_UNSAFE",
    });
  });

  it("keeps operator recovery and mark corrupted as manual commit only", () => {
    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "APPROVED",
          recoveryMode: "operator_recovery",
          preview: { replayCandidates: [{ classification: "REQUIRES_OPERATOR" }] },
        },
        modes: { executionAllowlist: ["resume", "retry_safe_steps"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "manual_commit_required",
      reason: "operator_recovery_requires_manual_commit",
      policyCode: "MANUAL_ONLY_MODE",
    });

    expect(
      evaluateRecoveryExecutionPolicy({
        recoveryRequest: {
          status: "APPROVED",
          recoveryMode: "mark_corrupted",
          preview: { replayCandidates: [{ classification: "CORRUPTED" }] },
        },
        modes: { executionAllowlist: ["resume", "retry_safe_steps"] },
        executionState: { paused: false },
      }),
    ).toEqual({
      allowed: false,
      action: "manual_commit_required",
      reason: "mark_corrupted_requires_manual_commit",
      policyCode: "MANUAL_ONLY_MODE",
    });
  });
});
