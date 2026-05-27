"use strict";

function getPrimaryClassification(recoveryRequest = {}) {
  const candidates = Array.isArray(recoveryRequest?.preview?.replayCandidates)
    ? recoveryRequest.preview.replayCandidates
    : [];
  return String(candidates[0]?.classification || "UNKNOWN");
}

function canExecuteApprovedRecovery({ recoveryRequest, policy, modes = {}, orchestrationState = {} }) {
  if (!recoveryRequest || !policy || !orchestrationState) {
    return {
      allowed: false,
      reason: "missing_execution_gate_input",
      gateCode: "BLOCK_MISSING_INPUT",
    };
  }

  if (orchestrationState.paused) {
    return {
      allowed: false,
      reason: "execution_orchestration_paused",
      gateCode: "BLOCK_PAUSED",
    };
  }

  if (String(recoveryRequest.status || "") !== "APPROVED") {
    return {
      allowed: false,
      reason: "request_not_approved",
      gateCode: "BLOCK_REQUEST_STATE",
    };
  }

  if (String(policy.action || "") !== "commit_approved") {
    return {
      allowed: false,
      reason: "policy_did_not_allow_commit",
      gateCode: "BLOCK_POLICY",
    };
  }

  if (orchestrationState.successfulCommits?.has(String(recoveryRequest.recoveryRequestId || ""))) {
    return {
      allowed: false,
      reason: "duplicate_commit_suppressed",
      gateCode: "BLOCK_DUPLICATE",
    };
  }

  if (orchestrationState.inFlightExecutionIds?.has(String(recoveryRequest.executionId || ""))) {
    return {
      allowed: false,
      reason: "execution_commit_already_in_flight",
      gateCode: "BLOCK_IN_FLIGHT",
    };
  }

  const allowlist = Array.isArray(modes.executionAllowlist) ? modes.executionAllowlist : [];
  if (!allowlist.includes(String(recoveryRequest.recoveryMode || ""))) {
    return {
      allowed: false,
      reason: "recovery_mode_not_allowlisted",
      gateCode: "BLOCK_MODE",
    };
  }

  const classification = getPrimaryClassification(recoveryRequest);
  if (["CORRUPTED", "UNKNOWN", "UNSAFE_REPLAY"].includes(classification)) {
    return {
      allowed: false,
      reason: "unsafe_execution_classification",
      gateCode: "BLOCK_CLASSIFICATION",
    };
  }

  return {
    allowed: true,
    reason: "execution_gate_passed",
    gateCode: "ALLOW_EXECUTION",
  };
}

module.exports = {
  canExecuteApprovedRecovery,
};
