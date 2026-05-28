"use strict";

function getPrimaryClassification(recoveryRequest = {}) {
  const candidates = Array.isArray(recoveryRequest?.preview?.replayCandidates)
    ? recoveryRequest.preview.replayCandidates
    : [];
  return String(candidates[0]?.classification || "UNKNOWN");
}

function canAutoApproveRecovery({ recoveryRequest, autonomyPolicy, riskScore, modes = {} }) {
  if (!recoveryRequest || !autonomyPolicy || !riskScore) {
    return {
      allowed: false,
      reason: "missing_autonomy_gate_input",
      gateCode: "BLOCK_MISSING_INPUT",
    };
  }

  if (String(recoveryRequest.status || "") !== "AWAITING_APPROVAL") {
    return {
      allowed: false,
      reason: "request_not_awaiting_approval",
      gateCode: "BLOCK_REQUEST_STATE",
    };
  }

  if (String(modes.autonomyLevel || "OFF") !== "SUPERVISED_APPROVAL") {
    return {
      allowed: false,
      reason: "autonomy_level_not_supervised",
      gateCode: "BLOCK_AUTONOMY_LEVEL",
    };
  }

  if (String(autonomyPolicy.action || "") !== "auto_approve") {
    return {
      allowed: false,
      reason: "policy_did_not_allow_auto_approval",
      gateCode: "BLOCK_POLICY",
    };
  }

  if (String(riskScore.riskLevel || "") !== "LOW") {
    return {
      allowed: false,
      reason: "risk_not_low",
      gateCode: "BLOCK_RISK",
    };
  }

  const classification = getPrimaryClassification(recoveryRequest);
  if (classification === "UNKNOWN" || classification === "CORRUPTED") {
    return {
      allowed: false,
      reason: "unsafe_recovery_classification",
      gateCode: "BLOCK_CLASSIFICATION",
    };
  }

  const allowlist = Array.isArray(modes.autonomyAllowlist) ? modes.autonomyAllowlist : [];
  if (!allowlist.includes(String(recoveryRequest.recoveryMode || ""))) {
    return {
      allowed: false,
      reason: "mode_not_allowlisted",
      gateCode: "BLOCK_MODE",
    };
  }

  return {
    allowed: true,
    reason: "autonomy_gate_passed",
    gateCode: "ALLOW_AUTO_APPROVAL",
  };
}

module.exports = {
  canAutoApproveRecovery,
};
