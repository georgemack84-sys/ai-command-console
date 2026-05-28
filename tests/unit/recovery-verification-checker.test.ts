import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { verifyRecoveryOutcome } = require("../../services/recoveryVerificationChecker.js");

describe("recovery verification checker", () => {
  it("verifies committed resume outcomes when post-state is running", () => {
    const result = verifyRecoveryOutcome({
      recoveryRequest: { recoveryMode: "resume" },
      executionResult: { outcomeType: "COMMITTED" },
      beforeState: { execution: { status: "paused_for_review" } },
      afterState: { execution: { status: "running" } },
      ledgerEvents: [{ eventType: "recovery.resume.applied" }],
    });

    expect(result).toEqual({
      verified: true,
      outcome: "VERIFIED",
      confidence: expect.any(Number),
      evidence: expect.arrayContaining(["post_state_running", "recovery_resume_applied"]),
      reason: "recovery_resume_verified",
    });
  });

  it("confirms no mutation for stale-blocked outcomes", () => {
    const result = verifyRecoveryOutcome({
      recoveryRequest: { recoveryMode: "resume" },
      executionResult: { outcomeType: "BLOCKED", result: { code: "STALE_RECOVERY_PLAN" } },
      beforeState: { execution: { status: "running", lastUpdatedAt: "2026-01-01T00:00:00.000Z" } },
      afterState: { execution: { status: "running", lastUpdatedAt: "2026-01-01T00:00:00.000Z" } },
      ledgerEvents: [{ eventType: "recovery.commit.stale" }],
    });

    expect(result).toEqual({
      verified: true,
      outcome: "NO_MUTATION_CONFIRMED",
      confidence: expect.any(Number),
      evidence: expect.arrayContaining(["stale_commit_blocked", "execution_state_unchanged"]),
      reason: "stale_block_confirmed_without_mutation",
    });
  });

  it("marks failed and ambiguous outcomes appropriately and clamps confidence", () => {
    const failed = verifyRecoveryOutcome({
      recoveryRequest: { recoveryMode: "resume" },
      executionResult: { outcomeType: "FAILED" },
      beforeState: { execution: { status: "running" } },
      afterState: { execution: { status: "running" } },
      ledgerEvents: [],
    });
    expect(failed).toEqual({
      verified: false,
      outcome: "FAILED",
      confidence: 0,
      evidence: ["execution_commit_failed"],
      reason: "recovery_execution_failed",
    });

    const unknown = verifyRecoveryOutcome({
      recoveryRequest: { recoveryMode: "retry_safe_steps" },
      executionResult: { outcomeType: "COMMITTED" },
      beforeState: { execution: { status: "paused_for_review" } },
      afterState: { execution: { status: "paused_for_review" } },
      ledgerEvents: [],
    });
    expect(unknown.outcome).toBe("UNKNOWN");
    expect(unknown.confidence).toBeGreaterThanOrEqual(0);
    expect(unknown.confidence).toBeLessThanOrEqual(1);
  });
});
