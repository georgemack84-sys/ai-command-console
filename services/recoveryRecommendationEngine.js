"use strict";

function success(data) {
  return { ok: true, data };
}

function failure(message) {
  return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY_ADVISORY", message: String(message || "Recovery recommendation blocked.") };
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numeric));
}

function recommendRecoveryAction({ candidate, signal, modes }) {
  void candidate;
  void modes;

  if (!signal || typeof signal !== "object") {
    return failure("Recovery signal is required.");
  }

  const signalType = String(signal.signalType || "UNKNOWN").trim().toUpperCase();
  const evidence = signal.evidence && typeof signal.evidence === "object" ? signal.evidence : {};
  const confidence = clampConfidence(signal.confidence);

  switch (signalType) {
    case "STALE_LOCK":
      return success({
        recommendation: evidence.safeContinuation ? "resume" : "operator_recovery",
        confidence,
        requiresOperator: !Boolean(evidence.safeContinuation),
        reason: evidence.safeContinuation ? "stale_lock_safe_resume" : "stale_lock_requires_operator",
      });
    case "EXPIRED_LEASE":
      return success({
        recommendation: evidence.safeContinuation ? "resume" : "operator_recovery",
        confidence,
        requiresOperator: !Boolean(evidence.safeContinuation),
        reason: signal.reason || "execution_lease_expired",
      });
    case "FAILED_EXECUTION":
      return success({
        recommendation: evidence.safeRetry ? "retry_safe_steps" : "operator_recovery",
        confidence,
        requiresOperator: !Boolean(evidence.safeRetry),
        reason: evidence.safeRetry ? "failed_execution_safe_retry" : "failed_execution_requires_operator",
      });
    case "INTERRUPTED_ATTEMPT":
      return success({
        recommendation: evidence.safeContinuation ? "resume" : "operator_recovery",
        confidence,
        requiresOperator: !Boolean(evidence.safeContinuation),
        reason: evidence.safeContinuation ? "interrupted_attempt_safe_resume" : "interrupted_attempt_requires_operator",
      });
    case "MISSING_TERMINAL_EVENT":
      return success({
        recommendation: "operator_recovery",
        confidence,
        requiresOperator: true,
        reason: "missing_terminal_event",
      });
    case "OPERATOR_PAUSED":
      return success({
        recommendation: "operator_recovery",
        confidence,
        requiresOperator: true,
        reason: "operator_paused_execution",
      });
    case "UNKNOWN":
    default:
      return success({
        recommendation: "none",
        confidence,
        requiresOperator: true,
        reason: signal.reason || "unknown_recovery_signal",
      });
  }
}

module.exports = {
  recommendRecoveryAction,
};
