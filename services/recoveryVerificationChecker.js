"use strict";

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numeric));
}

function verifyRecoveryOutcome({ recoveryRequest, executionResult, beforeState, afterState, ledgerEvents = [] }) {
  const outcomeType = String(executionResult?.outcomeType || "").toUpperCase();
  const recoveryMode = String(recoveryRequest?.recoveryMode || "");
  const afterStatus = String(afterState?.execution?.status || "");
  const beforeStatus = String(beforeState?.execution?.status || "");
  const eventTypes = Array.isArray(ledgerEvents) ? ledgerEvents.map((entry) => String(entry?.eventType || "")) : [];

  if (outcomeType === "FAILED") {
    return {
      verified: false,
      outcome: "FAILED",
      confidence: 0,
      evidence: ["execution_commit_failed"],
      reason: "recovery_execution_failed",
    };
  }

  if (outcomeType === "BLOCKED" && String(executionResult?.result?.code || "") === "STALE_RECOVERY_PLAN") {
    const unchanged = beforeStatus === afterStatus
      && String(beforeState?.execution?.lastUpdatedAt || "") === String(afterState?.execution?.lastUpdatedAt || "");
    return {
      verified: Boolean(unchanged),
      outcome: unchanged ? "NO_MUTATION_CONFIRMED" : "STALE_BLOCKED",
      confidence: clampConfidence(unchanged ? 0.96 : 0.55),
      evidence: unchanged
        ? ["stale_commit_blocked", "execution_state_unchanged"]
        : ["stale_commit_blocked", "post_state_changed"],
      reason: unchanged ? "stale_block_confirmed_without_mutation" : "stale_block_detected_with_state_change",
    };
  }

  if (outcomeType === "COMMITTED" && recoveryMode === "resume") {
    const running = afterStatus === "running";
    const resumed = eventTypes.includes("recovery.resume.applied");
    if (running) {
      return {
        verified: true,
        outcome: "VERIFIED",
        confidence: clampConfidence(resumed ? 0.94 : 0.88),
        evidence: resumed ? ["post_state_running", "recovery_resume_applied"] : ["post_state_running"],
        reason: resumed ? "recovery_resume_verified" : "recovery_resume_verified_by_post_state",
      };
    }
  }

  return {
    verified: false,
    outcome: "UNKNOWN",
    confidence: clampConfidence(0.35),
    evidence: ["verification_evidence_ambiguous"],
    reason: "recovery_verification_ambiguous",
  };
}

module.exports = {
  verifyRecoveryOutcome,
};
