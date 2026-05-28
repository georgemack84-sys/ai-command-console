import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateRecoveryVerificationPolicy } = require("../../services/recoveryVerificationPolicy.js");

describe("recovery verification policy", () => {
  it("allows committed and stale-blocked execution results to be verified", () => {
    expect(
      evaluateRecoveryVerificationPolicy({
        executionResult: { outcomeType: "COMMITTED" },
        recoveryRequest: { recoveryRequestId: "recovery_1" },
        modes: {},
      }),
    ).toEqual({
      allowed: true,
      action: "verify_outcome",
      reason: "committed_recovery_requires_verification",
      policyCode: "VERIFY_COMMITTED",
    });

    expect(
      evaluateRecoveryVerificationPolicy({
        executionResult: { outcomeType: "BLOCKED", result: { code: "STALE_RECOVERY_PLAN" } },
        recoveryRequest: { recoveryRequestId: "recovery_1" },
        modes: {},
      }),
    ).toEqual({
      allowed: true,
      action: "verify_outcome",
      reason: "stale_blocked_recovery_requires_no_mutation_check",
      policyCode: "VERIFY_STALE_BLOCKED",
    });
  });

  it("routes failed results to manual review and blocks missing evidence", () => {
    expect(
      evaluateRecoveryVerificationPolicy({
        executionResult: { outcomeType: "FAILED" },
        recoveryRequest: { recoveryRequestId: "recovery_1" },
        modes: {},
      }),
    ).toEqual({
      allowed: false,
      action: "manual_review_required",
      reason: "failed_recovery_requires_manual_review",
      policyCode: "MANUAL_REVIEW_REQUIRED",
    });

    expect(
      evaluateRecoveryVerificationPolicy({
        executionResult: null,
        recoveryRequest: null,
        modes: {},
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "missing_verification_input",
      policyCode: "BLOCKED_UNSAFE_RECOVERY_VERIFICATION",
    });
  });
});
