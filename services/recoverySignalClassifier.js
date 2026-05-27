"use strict";

function success(data) {
  return { ok: true, data };
}

function failure(message) {
  return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY_ADVISORY", message: String(message || "Recovery signal classification blocked.") };
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numeric));
}

function classifyRecoverySignal({ candidate, executionState, lockState, ledgerEvents }) {
  void executionState;
  void lockState;
  void ledgerEvents;

  if (!candidate || typeof candidate !== "object") {
    return failure("Recovery candidate is required.");
  }

  const signalType = String(candidate.signalType || "").trim().toUpperCase();
  const evidence = candidate.evidence && typeof candidate.evidence === "object" ? candidate.evidence : {};
  const confidenceHint = evidence.confidenceHint;

  switch (signalType) {
    case "STALE_LOCK":
      return success({
        signalType,
        severity: "MEDIUM",
        confidence: clampConfidence(confidenceHint == null ? 0.75 : confidenceHint),
        evidence,
        reason: "stale_lock_detected",
      });
    case "EXPIRED_LEASE":
      return success({
        signalType,
        severity: "HIGH",
        confidence: clampConfidence(confidenceHint == null ? 0.9 : confidenceHint),
        evidence,
        reason: "execution_lease_expired",
      });
    case "FAILED_EXECUTION":
      return success({
        signalType,
        severity: "HIGH",
        confidence: clampConfidence(confidenceHint == null ? 0.85 : confidenceHint),
        evidence,
        reason: "failed_execution_detected",
      });
    case "INTERRUPTED_ATTEMPT":
      return success({
        signalType,
        severity: "HIGH",
        confidence: clampConfidence(confidenceHint == null ? 0.8 : confidenceHint),
        evidence,
        reason: "interrupted_attempt_detected",
      });
    case "MISSING_TERMINAL_EVENT":
      return success({
        signalType,
        severity: "CRITICAL",
        confidence: clampConfidence(confidenceHint == null ? 0.95 : confidenceHint),
        evidence,
        reason: "missing_terminal_event",
      });
    case "OPERATOR_PAUSED":
      return success({
        signalType,
        severity: "LOW",
        confidence: clampConfidence(confidenceHint == null ? 0.7 : confidenceHint),
        evidence,
        reason: "operator_paused_execution",
      });
    default:
      return success({
        signalType: "UNKNOWN",
        severity: "UNKNOWN",
        confidence: 0,
        evidence,
        reason: "unknown_recovery_signal",
      });
  }
}

module.exports = {
  classifyRecoverySignal,
};
