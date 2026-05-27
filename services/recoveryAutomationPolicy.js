"use strict";

function evaluateAutomationPolicy({ advisory, recommendation, modes = {}, automationState = {} }) {
  if (!advisory || !recommendation || typeof recommendation !== "object") {
    return {
      allowed: false,
      action: "block",
      requiresOperator: true,
      reason: "missing_automation_policy_input",
      policyCode: "BLOCKED_UNSAFE_RECOVERY_AUTOMATION",
    };
  }

  if (automationState.paused) {
    return {
      allowed: false,
      action: "block",
      requiresOperator: true,
      reason: "automation_paused",
      policyCode: "AUTOMATION_PAUSED",
    };
  }

  const action = String(recommendation.recommendation || "none");
  const confidence = Number(recommendation.confidence || 0);
  const minConfidence = Number(modes.automationMinConfidence || 0.9);

  if (recommendation.reason === "unknown_recovery_signal") {
    return {
      allowed: false,
      action: "suppress",
      requiresOperator: true,
      reason: "unknown_recovery_signal",
      policyCode: "SUPPRESS_UNKNOWN",
    };
  }

  if (action === "none") {
    return {
      allowed: false,
      action: "suppress",
      requiresOperator: true,
      reason: String(recommendation.reason || "no_action"),
      policyCode: "SUPPRESS_NONE",
    };
  }

  if (action === "operator_recovery") {
    return {
      allowed: false,
      action: "advisory_only",
      requiresOperator: true,
      reason: String(recommendation.reason || "operator_recovery"),
      policyCode: "ADVISORY_ONLY_OPERATOR_RECOVERY",
    };
  }

  if (action === "resume") {
    if (modes.automationAllowResume !== true || confidence < minConfidence) {
      return {
        allowed: false,
        action: "advisory_only",
        requiresOperator: true,
        reason: String(recommendation.reason || "resume_below_confidence_threshold"),
        policyCode: "RESUME_REQUIRES_OPERATOR",
      };
    }
  }

  return {
    allowed: true,
    action: "create_request",
    requiresOperator: Boolean(recommendation.requiresOperator),
    reason: String(recommendation.reason || "automation_allowed"),
    policyCode: "ALLOW_CREATE_REQUEST",
  };
}

module.exports = {
  evaluateAutomationPolicy,
};
