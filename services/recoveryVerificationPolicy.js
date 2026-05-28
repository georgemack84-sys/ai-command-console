"use strict";

function evaluateRecoveryVerificationPolicy({ executionResult, recoveryRequest, modes = {} }) {
  void modes;

  if (!executionResult || !recoveryRequest) {
    return {
      allowed: false,
      action: "block",
      reason: "missing_verification_input",
      policyCode: "BLOCKED_UNSAFE_RECOVERY_VERIFICATION",
    };
  }

  const outcomeType = String(executionResult.outcomeType || "").toUpperCase();
  if (outcomeType === "COMMITTED") {
    return {
      allowed: true,
      action: "verify_outcome",
      reason: "committed_recovery_requires_verification",
      policyCode: "VERIFY_COMMITTED",
    };
  }

  if (outcomeType === "BLOCKED" && String(executionResult?.result?.code || "") === "STALE_RECOVERY_PLAN") {
    return {
      allowed: true,
      action: "verify_outcome",
      reason: "stale_blocked_recovery_requires_no_mutation_check",
      policyCode: "VERIFY_STALE_BLOCKED",
    };
  }

  if (outcomeType === "FAILED") {
    return {
      allowed: false,
      action: "manual_review_required",
      reason: "failed_recovery_requires_manual_review",
      policyCode: "MANUAL_REVIEW_REQUIRED",
    };
  }

  return {
    allowed: false,
    action: "no_action",
    reason: "verification_not_applicable",
    policyCode: "NO_ACTION",
  };
}

module.exports = {
  evaluateRecoveryVerificationPolicy,
};
