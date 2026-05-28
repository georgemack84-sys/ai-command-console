"use strict";

function getPrimaryClassification(recoveryRequest = {}) {
  const candidates = Array.isArray(recoveryRequest?.preview?.replayCandidates)
    ? recoveryRequest.preview.replayCandidates
    : [];
  const ordered = ["CORRUPTED", "UNKNOWN", "UNSAFE_REPLAY", "REQUIRES_OPERATOR", "IDEMPOTENT_REPLAY", "SAFE_REPLAY"];
  for (const classification of ordered) {
    if (candidates.some((candidate) => String(candidate?.classification || "") === classification)) {
      return classification;
    }
  }
  return "UNKNOWN";
}

function evaluateRecoveryExecutionPolicy({ recoveryRequest, modes = {}, executionState = {} }) {
  void executionState;

  if (!recoveryRequest || typeof recoveryRequest !== "object") {
    return {
      allowed: false,
      action: "block",
      reason: "missing_recovery_request",
      policyCode: "BLOCK_MISSING_STATE",
    };
  }

  if (String(recoveryRequest.status || "") !== "APPROVED") {
    return {
      allowed: false,
      action: "block",
      reason: "request_not_approved",
      policyCode: "BLOCK_REQUEST_STATE",
    };
  }

  const recoveryMode = String(recoveryRequest.recoveryMode || "");
  const classification = getPrimaryClassification(recoveryRequest);
  const allowlist = Array.isArray(modes.executionAllowlist) ? modes.executionAllowlist : [];

  if (classification === "CORRUPTED") {
    if (recoveryMode === "mark_corrupted") {
      return {
        allowed: false,
        action: "manual_commit_required",
        reason: "mark_corrupted_requires_manual_commit",
        policyCode: "MANUAL_ONLY_MODE",
      };
    }
    return {
      allowed: false,
      action: "block",
      reason: "corrupted_recovery_blocked",
      policyCode: "BLOCK_CORRUPTED",
    };
  }

  if (classification === "UNKNOWN") {
    return {
      allowed: false,
      action: "block",
      reason: "unknown_recovery_blocked",
      policyCode: "BLOCK_UNKNOWN",
    };
  }

  if (classification === "UNSAFE_REPLAY") {
    return {
      allowed: false,
      action: "block",
      reason: "unsafe_replay_blocked",
      policyCode: "BLOCK_UNSAFE",
    };
  }

  if (recoveryMode === "operator_recovery" || recoveryMode === "mark_corrupted") {
    return {
      allowed: false,
      action: "manual_commit_required",
      reason: recoveryMode === "operator_recovery"
        ? "operator_recovery_requires_manual_commit"
        : "mark_corrupted_requires_manual_commit",
      policyCode: "MANUAL_ONLY_MODE",
    };
  }

  if (!allowlist.includes(recoveryMode)) {
    return {
      allowed: false,
      action: "block",
      reason: "recovery_mode_not_allowlisted",
      policyCode: "BLOCK_MODE",
    };
  }

  if (recoveryMode === "resume" && (classification === "SAFE_REPLAY" || classification === "IDEMPOTENT_REPLAY")) {
    return {
      allowed: true,
      action: "commit_approved",
      reason: "approved_safe_resume",
      policyCode: "ALLOW_COMMIT_APPROVED",
    };
  }

  if (recoveryMode === "retry_safe_steps" && (classification === "SAFE_REPLAY" || classification === "IDEMPOTENT_REPLAY")) {
    return {
      allowed: true,
      action: "commit_approved",
      reason: "approved_safe_retry",
      policyCode: "ALLOW_COMMIT_APPROVED",
    };
  }

  return {
    allowed: false,
    action: "manual_commit_required",
    reason: "manual_commit_required",
    policyCode: "MANUAL_COMMIT_REQUIRED",
  };
}

module.exports = {
  evaluateRecoveryExecutionPolicy,
};
