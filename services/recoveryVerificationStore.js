"use strict";

const { appendAuditEvent, listAuditEvents } = require("./auditTrail");

const VERIFICATION_TYPES = Object.freeze({
  STARTED: "RECOVERY_VERIFICATION_STARTED",
  POLICY_EVALUATED: "RECOVERY_VERIFICATION_POLICY_EVALUATED",
  VERIFIED: "RECOVERY_VERIFICATION_VERIFIED",
  PARTIAL: "RECOVERY_VERIFICATION_PARTIAL",
  FAILED: "RECOVERY_VERIFICATION_FAILED",
  UNKNOWN: "RECOVERY_VERIFICATION_UNKNOWN",
  MANUAL_REVIEW_REQUIRED: "RECOVERY_VERIFICATION_MANUAL_REVIEW_REQUIRED",
});

function appendVerificationEvent({ type, message, payload, actor = "operator" }) {
  return appendAuditEvent({
    actor,
    type,
    message,
    payload,
  });
}

function listVerificationEvents(limit = 5000) {
  return listAuditEvents(limit).filter((event) => String(event?.type || "").startsWith("RECOVERY_VERIFICATION_"));
}

function recordVerificationStarted({ recoveryRequestId, executionId, requestedBy }) {
  return appendVerificationEvent({
    type: VERIFICATION_TYPES.STARTED,
    message: `Recovery verification started for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      requestedBy,
    },
  });
}

function recordVerificationPolicyEvaluated({ recoveryRequestId, executionId, policy, requestedBy }) {
  return appendVerificationEvent({
    type: VERIFICATION_TYPES.POLICY_EVALUATED,
    message: `Recovery verification policy evaluated for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      policy,
      requestedBy,
    },
  });
}

function recordVerificationResult({ recoveryRequestId, executionId, verification, requestedBy }) {
  const type = verification?.outcome === "VERIFIED"
    ? VERIFICATION_TYPES.VERIFIED
    : verification?.outcome === "PARTIAL"
      ? VERIFICATION_TYPES.PARTIAL
      : verification?.outcome === "FAILED"
        ? VERIFICATION_TYPES.FAILED
        : verification?.outcome === "UNKNOWN"
          ? VERIFICATION_TYPES.UNKNOWN
          : VERIFICATION_TYPES.MANUAL_REVIEW_REQUIRED;

  return appendVerificationEvent({
    type,
    message: `Recovery verification recorded for ${executionId}.`,
    payload: {
      recoveryRequestId,
      executionId,
      verification,
      requestedBy,
    },
  });
}

function deriveVerificationState({ recoveryRequestId }) {
  const normalizedId = String(recoveryRequestId || "").trim();
  const latest = listVerificationEvents().find((event) => String(event?.payload?.recoveryRequestId || "") === normalizedId);
  if (!latest) {
    return null;
  }
  const verification = latest?.payload?.verification || {};
  return {
    recoveryRequestId: normalizedId,
    executionId: String(latest?.payload?.executionId || ""),
    latestOutcome: String(verification.outcome || ""),
    latestReason: String(verification.reason || ""),
    verified: Boolean(verification.verified),
  };
}

module.exports = {
  deriveVerificationState,
  listVerificationEvents,
  recordVerificationPolicyEvaluated,
  recordVerificationResult,
  recordVerificationStarted,
};
