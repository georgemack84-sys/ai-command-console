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

function evaluateAutonomyPolicy({ recoveryRequest, advisory, automationDecision, modes = {}, autonomyState = {} }) {
  void advisory;
  void automationDecision;
  void modes;

  if (!recoveryRequest || typeof recoveryRequest !== "object" || !autonomyState || typeof autonomyState !== "object") {
    return {
      allowed: false,
      action: "block",
      reason: "missing_autonomy_policy_input",
      policyCode: "BLOCKED_UNSAFE_RECOVERY_AUTONOMY",
    };
  }

  if (autonomyState.paused) {
    return {
      allowed: false,
      action: "block",
      reason: "autonomy_paused",
      policyCode: "AUTONOMY_PAUSED",
    };
  }

  const level = String(autonomyState.level || "OFF");
  const recoveryMode = String(recoveryRequest.recoveryMode || "");
  const classification = getPrimaryClassification(recoveryRequest);

  if (level !== "SUPERVISED_APPROVAL") {
    return {
      allowed: false,
      action: "manual_approval_required",
      reason: "autonomy_level_not_supervised",
      policyCode: "MANUAL_APPROVAL_REQUIRED",
    };
  }

  if (classification === "UNKNOWN") {
    return {
      allowed: false,
      action: "block",
      reason: "unknown_recovery_classification",
      policyCode: "BLOCK_UNKNOWN",
    };
  }

  if (classification === "CORRUPTED") {
    return {
      allowed: false,
      action: "block",
      reason: "corrupted_recovery_requires_manual_handling",
      policyCode: "BLOCK_CORRUPTED",
    };
  }

  if (classification === "UNSAFE_REPLAY") {
    return {
      allowed: false,
      action: "block",
      reason: "unsafe_replay_requires_manual_handling",
      policyCode: "BLOCK_UNSAFE",
    };
  }

  if (recoveryMode === "operator_recovery" || recoveryMode === "mark_corrupted") {
    return {
      allowed: false,
      action: "manual_approval_required",
      reason: recoveryMode === "operator_recovery"
        ? "operator_recovery_requires_manual_approval"
        : "mark_corrupted_requires_manual_approval",
      policyCode: "MANUAL_ONLY_MODE",
    };
  }

  if (recoveryMode === "resume" && (classification === "SAFE_REPLAY" || classification === "IDEMPOTENT_REPLAY")) {
    return {
      allowed: true,
      action: "auto_approve",
      reason: "safe_resume_supervised",
      policyCode: "ALLOW_AUTO_APPROVE",
    };
  }

  if (recoveryMode === "retry_safe_steps" && (classification === "SAFE_REPLAY" || classification === "IDEMPOTENT_REPLAY")) {
    return {
      allowed: true,
      action: "auto_approve",
      reason: "safe_retry_supervised",
      policyCode: "ALLOW_AUTO_APPROVE",
    };
  }

  return {
    allowed: false,
    action: "manual_approval_required",
    reason: "manual_review_required",
    policyCode: "MANUAL_APPROVAL_REQUIRED",
  };
}

module.exports = {
  evaluateAutonomyPolicy,
};
