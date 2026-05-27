import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canExecuteApprovedRecovery } = require("../../services/recoveryExecutionGate.js");

describe("recovery execution gate", () => {
  it("only allows approved, allowlisted, non-paused, non-duplicate execution", () => {
    expect(
      canExecuteApprovedRecovery({
        recoveryRequest: {
          recoveryRequestId: "recovery_1",
          executionId: "exec_1",
          status: "APPROVED",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        policy: { action: "commit_approved" },
        modes: { executionAllowlist: ["resume"] },
        orchestrationState: {
          paused: false,
          successfulCommits: new Set(),
          inFlightExecutionIds: new Set(),
        },
      }),
    ).toEqual({
      allowed: true,
      reason: "execution_gate_passed",
      gateCode: "ALLOW_EXECUTION",
    });
  });

  it("suppresses duplicates and blocks paused or invalid states", () => {
    expect(
      canExecuteApprovedRecovery({
        recoveryRequest: {
          recoveryRequestId: "recovery_1",
          executionId: "exec_1",
          status: "APPROVED",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        policy: { action: "commit_approved" },
        modes: { executionAllowlist: ["resume"] },
        orchestrationState: {
          paused: true,
          successfulCommits: new Set(),
          inFlightExecutionIds: new Set(),
        },
      }),
    ).toEqual({
      allowed: false,
      reason: "execution_orchestration_paused",
      gateCode: "BLOCK_PAUSED",
    });

    expect(
      canExecuteApprovedRecovery({
        recoveryRequest: {
          recoveryRequestId: "recovery_1",
          executionId: "exec_1",
          status: "APPROVED",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        policy: { action: "commit_approved" },
        modes: { executionAllowlist: ["resume"] },
        orchestrationState: {
          paused: false,
          successfulCommits: new Set(["recovery_1"]),
          inFlightExecutionIds: new Set(),
        },
      }),
    ).toEqual({
      allowed: false,
      reason: "duplicate_commit_suppressed",
      gateCode: "BLOCK_DUPLICATE",
    });
  });
});
